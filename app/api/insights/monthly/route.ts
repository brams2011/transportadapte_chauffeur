import { NextRequest, NextResponse } from 'next/server';
import { ClaudeService } from '@/lib/claude-service';
import { supabase } from '@/lib/supabase';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

/**
 * API Route: GET /api/insights/monthly?user_id=xxx&month=2024-01
 * 
 * Génère des insights mensuels avec analyse IA
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id');
    const monthParam = searchParams.get('month'); // Format: YYYY-MM

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Par défaut, mois en cours
    const targetDate = monthParam ? new Date(monthParam + '-01') : new Date();
    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);
    const currentMonth = format(targetDate, 'MMMM yyyy');

    // Mois précédent
    const prevDate = subMonths(targetDate, 1);
    const prevMonthStart = startOfMonth(prevDate);
    const prevMonthEnd = endOfMonth(prevDate);
    const previousMonth = format(prevDate, 'MMMM yyyy');

    console.log('Generating insights for:', currentMonth, 'User:', userId);

    // 1. Récupérer les revenus du mois en cours
    const { data: revenues } = await supabase
      .from('revenues')
      .select('*')
      .eq('user_id', userId)
      .gte('date', monthStart.toISOString())
      .lte('date', monthEnd.toISOString());

    const totalRevenue = revenues?.reduce((sum, r) => sum + r.amount, 0) || 0;
    const totalHours = revenues?.reduce((sum, r) => sum + (r.hours_worked || 0), 0) || 0;
    
    // Revenue breakdown par compagnie
    const revenueBreakdown = revenues?.reduce((acc, r) => {
      acc[r.company] = (acc[r.company] || 0) + r.amount;
      return acc;
    }, {} as Record<string, number>) || {};

    // 2. Récupérer les dépenses du mois en cours
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .gte('date', monthStart.toISOString())
      .lte('date', monthEnd.toISOString());

    const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
    
    const fuelExpenses = expenses
      ?.filter(e => e.category === 'fuel')
      .reduce((sum, e) => sum + e.amount, 0) || 0;
    
    const maintenanceExpenses = expenses
      ?.filter(e => e.category === 'maintenance')
      .reduce((sum, e) => sum + e.amount, 0) || 0;
    
    const insuranceExpenses = expenses
      ?.filter(e => e.category === 'insurance')
      .reduce((sum, e) => sum + e.amount, 0) || 0;
    
    const otherExpenses = totalExpenses - fuelExpenses - maintenanceExpenses - insuranceExpenses;

    // 3. Récupérer données du mois précédent
    const { data: prevRevenues } = await supabase
      .from('revenues')
      .select('amount')
      .eq('user_id', userId)
      .gte('date', prevMonthStart.toISOString())
      .lte('date', prevMonthEnd.toISOString());

    const { data: prevExpenses } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', userId)
      .gte('date', prevMonthStart.toISOString())
      .lte('date', prevMonthEnd.toISOString());

    const prevRevenue = prevRevenues?.reduce((sum, r) => sum + r.amount, 0) || 0;
    const prevExpensesTotal = prevExpenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
    const prevProfit = prevRevenue - prevExpensesTotal;

    // 4. Historique 3 derniers mois
    const threeMonthsAgo = subMonths(targetDate, 3);
    const { data: historicalRevenues } = await supabase
      .from('revenues')
      .select('date, amount')
      .eq('user_id', userId)
      .gte('date', threeMonthsAgo.toISOString())
      .lte('date', monthEnd.toISOString())
      .order('date', { ascending: true });

    const { data: historicalExpenses } = await supabase
      .from('expenses')
      .select('date, amount, category')
      .eq('user_id', userId)
      .gte('date', threeMonthsAgo.toISOString())
      .lte('date', monthEnd.toISOString())
      .order('date', { ascending: true });

    // Calculer métriques
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const avgHourlyRate = totalHours > 0 ? totalRevenue / totalHours : 0;

    // 5. Générer insights avec Claude AI
    const financialData = {
      current_month: currentMonth,
      total_revenue: totalRevenue,
      revenue_breakdown: revenueBreakdown,
      total_hours: totalHours,
      avg_hourly_rate: avgHourlyRate,
      total_expenses: totalExpenses,
      fuel_expenses: fuelExpenses,
      maintenance_expenses: maintenanceExpenses,
      insurance_expenses: insuranceExpenses,
      other_expenses: otherExpenses,
      net_profit: netProfit,
      profit_margin: profitMargin,
      previous_month: previousMonth,
      prev_revenue: prevRevenue,
      prev_expenses: prevExpensesTotal,
      prev_profit: prevProfit,
      historical_data: {
        revenues: historicalRevenues || [],
        expenses: historicalExpenses || []
      }
    };

    const insights = await ClaudeService.generateMonthlyInsights(financialData);

    if (!insights.success) {
      return NextResponse.json(
        { error: 'Failed to generate insights', details: insights.error },
        { status: 500 }
      );
    }

    // 6. Sauvegarder les insights en base de données
    if (insights.data?.insights) {
      for (const insight of insights.data.insights) {
        await supabase.from('ai_insights').insert({
          user_id: userId,
          type: insight.type === 'anomaly' ? 'anomaly' : 
                insight.type === 'warning' ? 'anomaly' : 'recommendation',
          severity: insight.severity,
          title: insight.title,
          message: insight.message,
          action_required: insight.severity === 'critical'
        });
      }
    }

    // 7. Retourner résultats
    return NextResponse.json({
      success: true,
      period: {
        month: currentMonth,
        start: monthStart.toISOString(),
        end: monthEnd.toISOString()
      },
      summary: {
        revenue: totalRevenue,
        expenses: totalExpenses,
        profit: netProfit,
        profit_margin: profitMargin,
        hours_worked: totalHours,
        avg_hourly_rate: avgHourlyRate
      },
      breakdown: {
        revenue_by_company: revenueBreakdown,
        expenses_by_category: {
          fuel: fuelExpenses,
          maintenance: maintenanceExpenses,
          insurance: insuranceExpenses,
          other: otherExpenses
        }
      },
      comparison: {
        previous_month: previousMonth,
        revenue_change: prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0,
        expenses_change: prevExpensesTotal > 0 ? ((totalExpenses - prevExpensesTotal) / prevExpensesTotal) * 100 : 0,
        profit_change: prevProfit > 0 ? ((netProfit - prevProfit) / prevProfit) * 100 : 0
      },
      ai_insights: insights.data,
      usage: insights.usage
    });

  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
