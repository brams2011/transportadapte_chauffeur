import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/rapports/generate?user_id=xxx&type=mensuel|trimestriel|annuel|tps
 * Génère un rapport CSV téléchargeable
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('user_id');
    const reportType = request.nextUrl.searchParams.get('type') || 'mensuel';
    const month = request.nextUrl.searchParams.get('month'); // YYYY-MM

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const now = new Date();
    const year = now.getFullYear();
    let dateStart: string;
    let dateEnd: string;
    let periodLabel: string;

    if (reportType === 'annuel') {
      dateStart = `${year}-01-01`;
      dateEnd = `${year}-12-31`;
      periodLabel = `Année ${year}`;
    } else if (reportType === 'trimestriel') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const qStart = currentQuarter * 3;
      dateStart = `${year}-${String(qStart + 1).padStart(2, '0')}-01`;
      const qEndMonth = qStart + 3;
      const qEndDate = new Date(year, qEndMonth, 0);
      dateEnd = `${year}-${String(qEndMonth).padStart(2, '0')}-${qEndDate.getDate()}`;
      periodLabel = `T${currentQuarter + 1} ${year}`;
    } else {
      // mensuel ou tps
      const targetMonth = month || `${year}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const [mY, mM] = targetMonth.split('-').map(Number);
      dateStart = `${targetMonth}-01`;
      const lastDay = new Date(mY, mM, 0).getDate();
      dateEnd = `${targetMonth}-${lastDay}`;
      const d = new Date(mY, mM - 1, 1);
      periodLabel = d.toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' });
    }

    // Fetch data
    const [revenuesRes, expensesRes] = await Promise.all([
      supabase
        .from('revenues')
        .select('amount, date, company, type, description, hours_worked, transport_type')
        .eq('user_id', userId)
        .gte('date', dateStart)
        .lte('date', dateEnd)
        .order('date', { ascending: true }),
      supabase
        .from('expenses')
        .select('amount, date, category, vendor, description, is_tax_deductible')
        .eq('user_id', userId)
        .gte('date', dateStart)
        .lte('date', dateEnd)
        .order('date', { ascending: true }),
    ]);

    const revenues = revenuesRes.data || [];
    const expenses = expensesRes.data || [];

    const totalRevenue = revenues.reduce((s, r) => s + r.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const totalHours = revenues.reduce((s, r) => s + (r.hours_worked || 0), 0);
    const netProfit = totalRevenue - totalExpenses;

    const categoryLabels: Record<string, string> = {
      fuel: 'Essence',
      maintenance: 'Entretien véhicule',
      insurance: 'Assurance',
      food: 'Nourriture',
      parking: 'Stationnement',
      toll: 'Péage',
      phone: 'Téléphone',
      office: 'Bureau',
      license: 'Permis & Certification',
      other: 'Autre',
    };

    if (reportType === 'tps') {
      // Rapport TPS/TVQ
      const TPS_RATE = 0.05;
      const TVQ_RATE = 0.09975;

      const tpsPercu = totalRevenue * TPS_RATE;
      const tvqPercu = totalRevenue * TVQ_RATE;
      const deductibleExpenses = expenses.filter(e => e.is_tax_deductible);
      const totalDeductible = deductibleExpenses.reduce((s, e) => s + e.amount, 0);
      const tpsPaye = totalDeductible * TPS_RATE;
      const tvqPaye = totalDeductible * TVQ_RATE;

      const lines = [
        `RAPPORT TPS/TVQ - ${periodLabel}`,
        `Généré le: ${now.toLocaleDateString('fr-CA')}`,
        '',
        'SOMMAIRE',
        `Revenus totaux;${totalRevenue.toFixed(2)} $`,
        `Dépenses déductibles;${totalDeductible.toFixed(2)} $`,
        '',
        'TPS (5%)',
        `TPS perçue sur revenus;${tpsPercu.toFixed(2)} $`,
        `TPS payée sur dépenses;${tpsPaye.toFixed(2)} $`,
        `TPS nette à remettre;${(tpsPercu - tpsPaye).toFixed(2)} $`,
        '',
        'TVQ (9.975%)',
        `TVQ perçue sur revenus;${tvqPercu.toFixed(2)} $`,
        `TVQ payée sur dépenses;${tvqPaye.toFixed(2)} $`,
        `TVQ nette à remettre;${(tvqPercu - tvqPaye).toFixed(2)} $`,
        '',
        'TOTAL TAXES À REMETTRE',
        `Total;${((tpsPercu - tpsPaye) + (tvqPercu - tvqPaye)).toFixed(2)} $`,
        '',
        'DÉTAIL DES DÉPENSES DÉDUCTIBLES',
        'Date;Vendeur;Catégorie;Montant;TPS;TVQ',
        ...deductibleExpenses.map(e => {
          const tps = (e.amount * TPS_RATE).toFixed(2);
          const tvq = (e.amount * TVQ_RATE).toFixed(2);
          return `${e.date};${e.vendor || 'N/A'};${categoryLabels[e.category] || e.category};${e.amount.toFixed(2)} $;${tps} $;${tvq} $`;
        }),
      ];

      const csv = lines.join('\n');
      const fileName = `rapport-tps-tvq-${periodLabel.replace(/\s/g, '-')}.csv`;

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    // Rapports mensuel / trimestriel / annuel
    const expensesByCategory: Record<string, number> = {};
    expenses.forEach(e => {
      const label = categoryLabels[e.category] || e.category;
      expensesByCategory[label] = (expensesByCategory[label] || 0) + e.amount;
    });

    const revenueByCompany: Record<string, number> = {};
    revenues.forEach(r => {
      const key = r.company || 'Transport';
      revenueByCompany[key] = (revenueByCompany[key] || 0) + r.amount;
    });

    // Ventilation par type de transport
    const revenueAdapte = revenues.filter(r => (r.transport_type || 'adapte') === 'adapte').reduce((s: number, r: any) => s + r.amount, 0);
    const revenueRegulier = revenues.filter(r => r.transport_type === 'regulier').reduce((s: number, r: any) => s + r.amount, 0);
    const nbAdapte = revenues.filter(r => (r.transport_type || 'adapte') === 'adapte').length;
    const nbRegulier = revenues.filter(r => r.transport_type === 'regulier').length;

    const lines = [
      `RAPPORT ${reportType.toUpperCase()} - ${periodLabel}`,
      `Généré le: ${now.toLocaleDateString('fr-CA')}`,
      '',
      '═══════════════════════════════════',
      'SOMMAIRE FINANCIER',
      '═══════════════════════════════════',
      `Revenus totaux;${totalRevenue.toFixed(2)} $`,
      `Dépenses totales;${totalExpenses.toFixed(2)} $`,
      `Profit net;${netProfit.toFixed(2)} $`,
      `Marge de profit;${totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0'}%`,
      ...(totalHours > 0 ? [
        `Heures travaillées;${totalHours.toFixed(1)}h`,
        `Taux horaire moyen;${(totalRevenue / totalHours).toFixed(2)} $/h`,
      ] : []),
      '',
      '═══════════════════════════════════',
      'VENTILATION PAR TYPE DE TRANSPORT',
      '═══════════════════════════════════',
      `Transport Adapté;${revenueAdapte.toFixed(2)} $;${nbAdapte} course${nbAdapte > 1 ? 's' : ''}`,
      `Transport Régulier;${revenueRegulier.toFixed(2)} $;${nbRegulier} course${nbRegulier > 1 ? 's' : ''}`,
      '',
      '═══════════════════════════════════',
      'REVENUS PAR SOURCE',
      '═══════════════════════════════════',
      ...Object.entries(revenueByCompany).map(([company, amount]) =>
        `${company};${amount.toFixed(2)} $`
      ),
      '',
      '═══════════════════════════════════',
      'DÉPENSES PAR CATÉGORIE',
      '═══════════════════════════════════',
      ...Object.entries(expensesByCategory).map(([cat, amount]) =>
        `${cat};${amount.toFixed(2)} $;${totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : '0'}%`
      ),
      '',
      '═══════════════════════════════════',
      'DÉTAIL DES REVENUS',
      '═══════════════════════════════════',
      'Date;Source;Transport;Type;Description;Heures;Montant',
      ...revenues.map(r =>
        `${r.date};${r.company || 'N/A'};${(r.transport_type || 'adapte') === 'adapte' ? 'Adapté' : 'Régulier'};${r.type || 'N/A'};${(r.description || '').replace(/;/g, ',')};${r.hours_worked || ''};${r.amount.toFixed(2)} $`
      ),
      '',
      '═══════════════════════════════════',
      'DÉTAIL DES DÉPENSES',
      '═══════════════════════════════════',
      'Date;Vendeur;Catégorie;Déductible;Montant',
      ...expenses.map(e =>
        `${e.date};${e.vendor || 'N/A'};${categoryLabels[e.category] || e.category};${e.is_tax_deductible ? 'Oui' : 'Non'};${e.amount.toFixed(2)} $`
      ),
    ];

    const csv = lines.join('\n');
    const fileName = `rapport-${reportType}-${periodLabel.replace(/\s/g, '-')}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
