import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/rapports?user_id=xxx&month=2026-02
 * Récupère les données financières pour les rapports
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('user_id');
    const month = request.nextUrl.searchParams.get('month'); // YYYY-MM

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const now = new Date();
    const year = now.getFullYear();

    // Année à date
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;

    // Mois sélectionné
    const targetMonth = month || `${year}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [mYear, mMonth] = targetMonth.split('-').map(Number);
    const monthStart = `${targetMonth}-01`;
    const lastDay = new Date(mYear, mMonth, 0).getDate();
    const monthEnd = `${targetMonth}-${lastDay}`;

    // Revenus année à date
    const { data: yearRevenues } = await supabase
      .from('revenues')
      .select('amount, date, company, type, description')
      .eq('user_id', userId)
      .gte('date', yearStart)
      .lte('date', yearEnd);

    // Dépenses année à date
    const { data: yearExpenses } = await supabase
      .from('expenses')
      .select('amount, date, category, vendor, is_tax_deductible')
      .eq('user_id', userId)
      .gte('date', yearStart)
      .lte('date', yearEnd);

    // Revenus du mois
    const { data: monthRevenues } = await supabase
      .from('revenues')
      .select('amount, company, type, description, transport_type')
      .eq('user_id', userId)
      .gte('date', monthStart)
      .lte('date', monthEnd);

    // Dépenses du mois
    const { data: monthExpenses } = await supabase
      .from('expenses')
      .select('amount, category, vendor, is_tax_deductible')
      .eq('user_id', userId)
      .gte('date', monthStart)
      .lte('date', monthEnd);

    // Calculs année à date
    const totalRevenueYTD = yearRevenues?.reduce((s, r) => s + r.amount, 0) || 0;
    const totalExpensesYTD = yearExpenses?.reduce((s, e) => s + e.amount, 0) || 0;
    const profitYTD = totalRevenueYTD - totalExpensesYTD;

    // Calculs mois
    const monthRevenueTotal = monthRevenues?.reduce((s, r) => s + r.amount, 0) || 0;
    const monthExpenseTotal = monthExpenses?.reduce((s, e) => s + e.amount, 0) || 0;
    const monthProfit = monthRevenueTotal - monthExpenseTotal;
    const profitMargin = monthRevenueTotal > 0 ? (monthProfit / monthRevenueTotal) * 100 : 0;

    // Revenus par type
    const revenueByType: Record<string, number> = {};
    monthRevenues?.forEach(r => {
      const key = r.type === 'regular' ? 'Courses régulières' :
                  r.type === 'extra' ? 'Courses extra' :
                  r.type === 'bonus' ? 'Bonus' : 'Autre';
      revenueByType[key] = (revenueByType[key] || 0) + r.amount;
    });

    // Dépenses déductibles par catégorie
    const deductibleByCategory: Record<string, number> = {};
    monthExpenses?.filter(e => e.is_tax_deductible).forEach(e => {
      const key = e.category === 'fuel' ? 'Essence' :
                  e.category === 'maintenance' ? 'Entretien' :
                  e.category === 'insurance' ? 'Assurance' : 'Autres';
      deductibleByCategory[key] = (deductibleByCategory[key] || 0) + e.amount;
    });

    const totalDeductible = Object.values(deductibleByCategory).reduce((s, v) => s + v, 0);

    // Ventilation par type de transport
    const revenueAdapte = monthRevenues?.filter(r => (r.transport_type || 'adapte') === 'adapte').reduce((s, r) => s + r.amount, 0) || 0;
    const revenueRegulier = monthRevenues?.filter(r => r.transport_type === 'regulier').reduce((s, r) => s + r.amount, 0) || 0;

    return NextResponse.json({
      success: true,
      ytd: {
        revenue: totalRevenueYTD,
        expenses: totalExpensesYTD,
        profit: profitYTD,
      },
      month: {
        period: targetMonth,
        revenue: {
          total: monthRevenueTotal,
          byType: revenueByType,
          byTransportType: { adapte: revenueAdapte, regulier: revenueRegulier },
        },
        expenses: {
          total: monthExpenseTotal,
          deductible: totalDeductible,
          byCategory: deductibleByCategory,
        },
        profit: monthProfit,
        profitMargin,
      },
    });
  } catch (error) {
    console.error('Error fetching report data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
