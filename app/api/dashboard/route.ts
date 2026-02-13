import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

/**
 * GET /api/dashboard?user_id=xxx
 * Retourne les données financières RAPIDEMENT (sans appel Claude AI)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const currentMonth = format(now, 'MMMM yyyy');

    const prevDate = subMonths(now, 1);
    const prevMonthStart = startOfMonth(prevDate);
    const prevMonthEnd = endOfMonth(prevDate);

    // Requêtes parallèles pour la vitesse
    const [revenuesRes, expensesRes, prevRevenuesRes, prevExpensesRes] = await Promise.all([
      supabase
        .from('revenues')
        .select('amount, company, type, hours_worked')
        .eq('user_id', userId)
        .gte('date', monthStart.toISOString())
        .lte('date', monthEnd.toISOString()),
      supabase
        .from('expenses')
        .select('amount, category')
        .eq('user_id', userId)
        .gte('date', monthStart.toISOString())
        .lte('date', monthEnd.toISOString()),
      supabase
        .from('revenues')
        .select('amount')
        .eq('user_id', userId)
        .gte('date', prevMonthStart.toISOString())
        .lte('date', prevMonthEnd.toISOString()),
      supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', userId)
        .gte('date', prevMonthStart.toISOString())
        .lte('date', prevMonthEnd.toISOString()),
    ]);

    const revenues = revenuesRes.data || [];
    const expenses = expensesRes.data || [];
    const prevRevenues = prevRevenuesRes.data || [];
    const prevExpenses = prevExpensesRes.data || [];

    const totalRevenue = revenues.reduce((s, r) => s + r.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const totalHours = revenues.reduce((s, r) => s + (r.hours_worked || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const avgHourlyRate = totalHours > 0 ? totalRevenue / totalHours : 0;

    const prevRevenue = prevRevenues.reduce((s, r) => s + r.amount, 0);
    const prevExpensesTotal = prevExpenses.reduce((s, e) => s + e.amount, 0);

    const revenueByCompany = revenues.reduce((acc, r) => {
      acc[r.company || 'Autre'] = (acc[r.company || 'Autre'] || 0) + r.amount;
      return acc;
    }, {} as Record<string, number>);

    const fuelExpenses = expenses.filter(e => e.category === 'fuel').reduce((s, e) => s + e.amount, 0);
    const maintenanceExpenses = expenses.filter(e => e.category === 'maintenance').reduce((s, e) => s + e.amount, 0);
    const insuranceExpenses = expenses.filter(e => e.category === 'insurance').reduce((s, e) => s + e.amount, 0);
    const otherExpenses = totalExpenses - fuelExpenses - maintenanceExpenses - insuranceExpenses;

    return NextResponse.json({
      success: true,
      period: { month: currentMonth },
      summary: {
        revenue: totalRevenue,
        expenses: totalExpenses,
        profit: netProfit,
        profit_margin: profitMargin,
        hours_worked: totalHours,
        avg_hourly_rate: avgHourlyRate,
      },
      breakdown: {
        revenue_by_company: revenueByCompany,
        expenses_by_category: {
          fuel: fuelExpenses,
          maintenance: maintenanceExpenses,
          insurance: insuranceExpenses,
          other: otherExpenses,
        },
      },
      comparison: {
        revenue_change: prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0,
        expenses_change: prevExpensesTotal > 0 ? ((totalExpenses - prevExpensesTotal) / prevExpensesTotal) * 100 : 0,
        profit_change: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
