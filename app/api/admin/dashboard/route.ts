import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

// GET /api/admin/dashboard
export async function GET() {
  try {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const prevMonthStart = startOfMonth(subMonths(now, 1));
    const prevMonthEnd = endOfMonth(subMonths(now, 1));

    // Tous les chauffeurs
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    const totalChauffeurs = users?.length || 0;
    const chauffeursActifs = users?.filter((u: any) => u.actif !== false).length || 0;

    // Revenus ce mois (tous chauffeurs)
    const { data: revenuesCeMois } = await supabase
      .from('revenues')
      .select('amount, transport_type')
      .gte('date', monthStart.toISOString())
      .lte('date', monthEnd.toISOString());

    const totalRevenusCeMois = revenuesCeMois?.reduce((sum: number, r: any) => sum + (r.amount || 0), 0) || 0;
    const revenusAdapteCeMois = revenuesCeMois?.filter((r: any) => (r.transport_type || 'adapte') === 'adapte').reduce((sum: number, r: any) => sum + (r.amount || 0), 0) || 0;
    const revenusRegulierCeMois = revenuesCeMois?.filter((r: any) => r.transport_type === 'regulier').reduce((sum: number, r: any) => sum + (r.amount || 0), 0) || 0;

    // Revenus mois dernier
    const { data: revenuesMoisDernier } = await supabase
      .from('revenues')
      .select('amount')
      .gte('date', prevMonthStart.toISOString())
      .lte('date', prevMonthEnd.toISOString());

    const totalRevenusMoisDernier = revenuesMoisDernier?.reduce((sum: number, r: any) => sum + (r.amount || 0), 0) || 0;

    // Dépenses ce mois
    const { data: depensesCeMois } = await supabase
      .from('expenses')
      .select('amount')
      .gte('date', monthStart.toISOString())
      .lte('date', monthEnd.toISOString());

    const totalDepensesCeMois = depensesCeMois?.reduce((sum: number, r: any) => sum + (r.amount || 0), 0) || 0;

    // Total véhicules
    const { data: vehicules } = await supabase
      .from('vehicules')
      .select('id');

    const totalVehicules = vehicules?.length || 0;

    // Revenus totaux (all time)
    const { data: allRevenues } = await supabase
      .from('revenues')
      .select('amount');

    const totalRevenusGlobal = allRevenues?.reduce((sum: number, r: any) => sum + (r.amount || 0), 0) || 0;

    // Dépenses totales (all time)
    const { data: allExpenses } = await supabase
      .from('expenses')
      .select('amount');

    const totalDepensesGlobal = allExpenses?.reduce((sum: number, r: any) => sum + (r.amount || 0), 0) || 0;

    // Derniers chauffeurs inscrits
    const derniersChauffeurs = (users || []).slice(0, 5).map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      company: u.transport_company,
      created_at: u.created_at,
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalChauffeurs,
        chauffeursActifs,
        totalRevenusCeMois,
        totalRevenusMoisDernier,
        totalDepensesCeMois,
        profitCeMois: totalRevenusCeMois - totalDepensesCeMois,
        totalVehicules,
        totalRevenusGlobal,
        totalDepensesGlobal,
        profitGlobal: totalRevenusGlobal - totalDepensesGlobal,
        revenusAdapteCeMois,
        revenusRegulierCeMois,
      },
      derniersChauffeurs,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
