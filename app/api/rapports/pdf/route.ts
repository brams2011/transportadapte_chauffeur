import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/rapports/pdf?user_id=xxx&type=mensuel|trimestriel|annuel|tps&month=2026-02
 * Génère un rapport HTML stylisé pour impression PDF
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('user_id');
    const reportType = request.nextUrl.searchParams.get('type') || 'mensuel';
    const month = request.nextUrl.searchParams.get('month');

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
      const targetMonth = month || `${year}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const [mY, mM] = targetMonth.split('-').map(Number);
      dateStart = `${targetMonth}-01`;
      const lastDay = new Date(mY, mM, 0).getDate();
      dateEnd = `${targetMonth}-${lastDay}`;
      periodLabel = targetMonth;
    }

    // Fetch user
    const { data: userData } = await supabase
      .from('users')
      .select('name, email, transport_company')
      .eq('id', userId)
      .single();

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
      maintenance: 'Entretien',
      insurance: 'Assurance',
      food: 'Nourriture',
      parking: 'Stationnement',
      toll: 'Péage',
      phone: 'Téléphone',
      office: 'Bureau',
      license: 'Permis & Certification',
      other: 'Autre',
    };

    // Ventilation par type de transport
    const revenueAdapte = revenues.filter(r => (r.transport_type || 'adapte') === 'adapte').reduce((s, r) => s + r.amount, 0);
    const revenueRegulier = revenues.filter(r => r.transport_type === 'regulier').reduce((s, r) => s + r.amount, 0);
    const nbAdapte = revenues.filter(r => (r.transport_type || 'adapte') === 'adapte').length;
    const nbRegulier = revenues.filter(r => r.transport_type === 'regulier').length;

    // Group revenues by type
    const revenueByType: Record<string, number> = {};
    revenues.forEach(r => {
      const key = r.type === 'regular' ? 'Courses Régulières' :
                  r.type === 'extra' ? 'Courses Extra' :
                  r.type === 'bonus' ? 'Bonus' : 'Autre';
      revenueByType[key] = (revenueByType[key] || 0) + r.amount;
    });

    // Group expenses by category
    const expensesByCategory: Record<string, number> = {};
    expenses.forEach(e => {
      const label = categoryLabels[e.category] || e.category;
      expensesByCategory[label] = (expensesByCategory[label] || 0) + e.amount;
    });

    const formatDate = (d: string) => {
      const [y, m, day] = d.split('-');
      return `${day}/${m}/${y}`;
    };

    const fmt = (n: number) => n.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const generatedDate = now.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });

    const userName = userData?.name || 'Chauffeur';
    const userCompany = userData?.transport_company || '';

    // Build detail rows for revenues
    const revenueDetailRows = Object.entries(revenueByType).map(([type, amount]) =>
      `<tr><td>${type}</td><td class="amount">${fmt(amount)} $</td></tr>`
    ).join('');

    // Build detail rows for expenses (negative)
    const expenseDetailRows = Object.entries(expensesByCategory).map(([cat, amount]) =>
      `<tr><td>${cat}</td><td class="amount expense">-${fmt(amount)} $</td></tr>`
    ).join('');

    // TPS/TVQ section
    let tpsTvqSection = '';
    if (reportType === 'tps') {
      const TPS_RATE = 0.05;
      const TVQ_RATE = 0.09975;
      const deductibleExpenses = expenses.filter(e => e.is_tax_deductible);
      const totalDeductible = deductibleExpenses.reduce((s, e) => s + e.amount, 0);
      const tpsPercu = totalRevenue * TPS_RATE;
      const tvqPercu = totalRevenue * TVQ_RATE;
      const tpsPaye = totalDeductible * TPS_RATE;
      const tvqPaye = totalDeductible * TVQ_RATE;

      tpsTvqSection = `
        <div class="section">
          <table>
            <thead><tr><th>TPS (5%)</th><th>Montant</th></tr></thead>
            <tbody>
              <tr><td>TPS perçue sur revenus</td><td class="amount">${fmt(tpsPercu)} $</td></tr>
              <tr><td>TPS payée sur dépenses</td><td class="amount expense">-${fmt(tpsPaye)} $</td></tr>
              <tr class="total-row"><td>TPS nette à remettre</td><td class="amount">${fmt(tpsPercu - tpsPaye)} $</td></tr>
            </tbody>
          </table>
        </div>
        <div class="section">
          <table>
            <thead><tr><th>TVQ (9,975%)</th><th>Montant</th></tr></thead>
            <tbody>
              <tr><td>TVQ perçue sur revenus</td><td class="amount">${fmt(tvqPercu)} $</td></tr>
              <tr><td>TVQ payée sur dépenses</td><td class="amount expense">-${fmt(tvqPaye)} $</td></tr>
              <tr class="total-row"><td>TVQ nette à remettre</td><td class="amount">${fmt(tvqPercu - tvqPaye)} $</td></tr>
            </tbody>
          </table>
        </div>
        <div class="section">
          <table>
            <thead><tr><th>Total taxes à remettre</th><th>Montant</th></tr></thead>
            <tbody>
              <tr class="total-row"><td>Total TPS + TVQ</td><td class="amount bold">${fmt((tpsPercu - tpsPaye) + (tvqPercu - tvqPaye))} $</td></tr>
            </tbody>
          </table>
        </div>
      `;
    }

    // Hours section
    const hoursSection = totalHours > 0 ? `
      <tr><td>Heures travaillées</td><td class="amount">${totalHours.toFixed(1)}h</td></tr>
      <tr><td>Taux horaire moyen</td><td class="amount">${fmt(totalRevenue / totalHours)} $/h</td></tr>
    ` : '';

    // Transaction detail section
    const transactionSection = `
      <div class="section">
        <h3>Détail des revenus</h3>
        <table class="detail-table">
          <thead><tr><th>Date</th><th>Transport</th><th>Source</th><th>Description</th><th>Montant</th></tr></thead>
          <tbody>
            ${revenues.map(r => `
              <tr>
                <td>${formatDate(r.date)}</td>
                <td><span style="background:${(r.transport_type || 'adapte') === 'adapte' ? '#dbeafe;color:#1d4ed8' : '#dcfce7;color:#166534'};padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600">${(r.transport_type || 'adapte') === 'adapte' ? 'Adapté' : 'Régulier'}</span></td>
                <td>${r.company || 'N/A'}</td>
                <td>${r.description || '-'}</td>
                <td class="amount">${fmt(r.amount)} $</td>
              </tr>
            `).join('')}
            ${revenues.length === 0 ? '<tr><td colspan="5" class="empty">Aucun revenu pour cette période</td></tr>' : ''}
          </tbody>
        </table>
      </div>
      <div class="section">
        <h3>Détail des dépenses</h3>
        <table class="detail-table">
          <thead><tr><th>Date</th><th>Vendeur</th><th>Catégorie</th><th>Déductible</th><th>Montant</th></tr></thead>
          <tbody>
            ${expenses.map(e => `
              <tr>
                <td>${formatDate(e.date)}</td>
                <td>${e.vendor || 'N/A'}</td>
                <td>${categoryLabels[e.category] || e.category}</td>
                <td>${e.is_tax_deductible ? 'Oui' : 'Non'}</td>
                <td class="amount expense">-${fmt(e.amount)} $</td>
              </tr>
            `).join('')}
            ${expenses.length === 0 ? '<tr><td colspan="5" class="empty">Aucune dépense pour cette période</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    `;

    const reportTitle = reportType === 'tps' ? 'Rapport TPS/TVQ' :
                        reportType === 'annuel' ? 'Rapport Annuel' :
                        reportType === 'trimestriel' ? 'Rapport Trimestriel' :
                        'Rapport Financier';

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${reportTitle} - ${periodLabel}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1a1a1a;
      background: #fff;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      margin-bottom: 32px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 16px;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 300;
      color: #111;
      margin-bottom: 6px;
    }
    .header .meta {
      font-size: 13px;
      color: #6b7280;
      line-height: 1.6;
    }
    .section {
      margin-bottom: 28px;
    }
    .section h3 {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 4px;
    }
    thead tr {
      background: #5b7fa6;
    }
    thead th {
      color: #fff;
      font-weight: 600;
      font-size: 13px;
      padding: 10px 16px;
      text-align: left;
    }
    thead th:last-child {
      text-align: right;
    }
    tbody td {
      padding: 10px 16px;
      font-size: 14px;
      border-bottom: 1px solid #f0f0f0;
    }
    tbody tr:nth-child(even) {
      background: #fafafa;
    }
    .amount {
      text-align: right;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .expense {
      color: #dc2626;
    }
    .total-row td {
      font-weight: 700;
      border-top: 2px solid #d1d5db;
      background: #f9fafb;
    }
    .bold { font-weight: 700; }

    .detail-table thead tr {
      background: #6b7280;
    }
    .detail-table tbody td {
      font-size: 13px;
      padding: 8px 16px;
    }
    .empty {
      text-align: center;
      color: #9ca3af;
      font-style: italic;
      padding: 20px !important;
    }

    .print-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #1e40af;
      color: white;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 100;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .print-bar button {
      background: white;
      color: #1e40af;
      border: none;
      padding: 8px 20px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
    }
    .print-bar button:hover { background: #e0e7ff; }
    .print-spacer { height: 60px; }

    @media print {
      .print-bar, .print-spacer { display: none !important; }
      body { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <span>Aperçu du rapport - Utilisez <strong>Ctrl+P</strong> ou le bouton pour sauvegarder en PDF</span>
    <button onclick="window.print()">Imprimer / Sauvegarder PDF</button>
  </div>
  <div class="print-spacer"></div>

  <div class="header">
    <h1>${reportTitle}</h1>
    <div class="meta">
      Généré le ${generatedDate}<br>
      Période: ${periodLabel}
      ${userName ? `<br>Chauffeur: ${userName}` : ''}
      ${userCompany ? ` — ${userCompany}` : ''}
    </div>
  </div>

  <div class="section">
    <table>
      <thead><tr><th>Résumé Financier</th><th>Montant</th></tr></thead>
      <tbody>
        <tr><td>Revenus Totaux</td><td class="amount">${fmt(totalRevenue)} $</td></tr>
        <tr><td>Dépenses Totales</td><td class="amount">${fmt(totalExpenses)} $</td></tr>
        ${hoursSection}
        <tr class="total-row"><td>Revenu Net</td><td class="amount">${fmt(netProfit)} $</td></tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <table>
      <thead><tr><th>Type de Transport</th><th>Courses</th><th>Montant</th></tr></thead>
      <tbody>
        <tr><td>Transport Adapté</td><td>${nbAdapte}</td><td class="amount">${fmt(revenueAdapte)} $</td></tr>
        <tr><td>Transport Régulier</td><td>${nbRegulier}</td><td class="amount">${fmt(revenueRegulier)} $</td></tr>
        <tr class="total-row"><td>Total</td><td>${nbAdapte + nbRegulier}</td><td class="amount">${fmt(totalRevenue)} $</td></tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <table>
      <thead><tr><th>Détails</th><th>Montant</th></tr></thead>
      <tbody>
        ${revenueDetailRows}
        ${expenseDetailRows}
        ${Object.keys(revenueByType).length === 0 && Object.keys(expensesByCategory).length === 0 ?
          '<tr><td colspan="2" class="empty">Aucune donnée pour cette période</td></tr>' : ''}
      </tbody>
    </table>
  </div>

  ${tpsTvqSection}

  ${transactionSection}

</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error generating PDF report:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
