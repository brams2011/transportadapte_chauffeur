'use client';

import { useState, useEffect } from 'react';
import {
  Users, Car, DollarSign, TrendingUp, Trash2, UserCheck, UserX,
  Loader2, RefreshCw, Search, LogOut, BarChart3, Gauge, Wrench,
  Shield, CreditCard, Crown, FileText, Download, ExternalLink,
  Clock, CheckCircle, AlertCircle, Star, FileSpreadsheet, File, Bus,
  List, LayoutGrid
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Types ───────────────────────────────────────────────────────
interface Stats {
  totalChauffeurs: number;
  chauffeursActifs: number;
  totalRevenusCeMois: number;
  totalRevenusMoisDernier: number;
  totalDepensesCeMois: number;
  profitCeMois: number;
  totalVehicules: number;
  totalRevenusGlobal: number;
  totalDepensesGlobal: number;
  revenusAdapteCeMois: number;
  revenusRegulierCeMois: number;
  profitGlobal: number;
}

interface Chauffeur {
  id: string;
  name: string;
  email: string;
  phone?: string;
  transport_company?: string;
  status?: string;
  actif: boolean;
  subscription_tier?: string;
  created_at: string;
  stats: {
    totalRevenus: number;
    totalDepenses: number;
    profit: number;
    nbVehicules: number;
    nbTournees: number;
  };
}

interface VehiculeFlotte {
  id: string;
  nom: string;
  marque?: string;
  modele?: string;
  annee?: number;
  plaque?: string;
  couleur?: string;
  kilometrage: number;
  statut: string;
  chauffeur: { name: string; email: string; company?: string } | null;
  dernierEntretien: { type: string; date?: string; statut: string } | null;
}

interface SquareTransaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  sourceType: string;
  cardBrand: string | null;
  cardLast4: string | null;
  receiptUrl: string | null;
  createdAt: string;
  note: string | null;
}

interface AdminDashboardProps {
  onLogout: () => void;
}

// ─── Config abonnements ──────────────────────────────────────────
const SUBSCRIPTION_PLANS = [
  { tier: 'basic', label: 'Basic', price: 0, color: 'gray', features: ['Dashboard', 'Scanner', 'Courses'] },
  { tier: 'pro', label: 'Pro', price: 29.99, color: 'blue', features: ['Tout Basic', 'Rapports PDF', 'Véhicules illimités', 'Square'] },
  { tier: 'premium', label: 'Premium', price: 59.99, color: 'purple', features: ['Tout Pro', 'IA Assistant', 'Support prioritaire', 'Multi-véhicules'] },
];

// ─── Composant Principal ─────────────────────────────────────────
export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'chauffeurs' | 'flotte' | 'paiements' | 'abonnements' | 'rapports'>('overview');
  const [flotteView, setFlotteView] = useState<'cards' | 'list'>('cards');
  const [stats, setStats] = useState<Stats | null>(null);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [flotte, setFlotte] = useState<VehiculeFlotte[]>([]);
  const [transactions, setTransactions] = useState<SquareTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dashRes, chauffRes, flotteRes, txRes] = await Promise.all([
        fetch('/api/admin/dashboard').then(r => r.json()),
        fetch('/api/admin/chauffeurs').then(r => r.json()),
        fetch('/api/admin/vehicules').then(r => r.json()),
        fetch('/api/square/transactions').then(r => r.json()).catch(() => ({ success: false })),
      ]);

      if (dashRes.success) setStats(dashRes.stats);
      if (chauffRes.success) setChauffeurs(chauffRes.chauffeurs);
      if (flotteRes.success) setFlotte(flotteRes.flotte);
      if (txRes.success) setTransactions(txRes.transactions || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (chauffeur: Chauffeur) => {
    const newActif = !chauffeur.actif;
    if (!confirm(`${newActif ? 'Activer' : 'Désactiver'} le chauffeur ${chauffeur.name}?`)) return;
    try {
      await fetch('/api/admin/chauffeurs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: chauffeur.id, actif: newActif }),
      });
      setChauffeurs(prev => prev.map(c => c.id === chauffeur.id ? { ...c, actif: newActif } : c));
    } catch (err) {
      console.error('Error toggling chauffeur:', err);
    }
  };

  const handleDeleteChauffeur = async (chauffeur: Chauffeur) => {
    if (!confirm(`SUPPRIMER définitivement le chauffeur "${chauffeur.name}" et toutes ses données?\n\nCette action est irréversible.`)) return;
    try {
      await fetch(`/api/admin/chauffeurs?id=${chauffeur.id}`, { method: 'DELETE' });
      setChauffeurs(prev => prev.filter(c => c.id !== chauffeur.id));
      fetchAll();
    } catch (err) {
      console.error('Error deleting chauffeur:', err);
    }
  };

  const handleChangeTier = async (chauffeurId: string, newTier: string) => {
    try {
      await fetch('/api/admin/chauffeurs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: chauffeurId, subscription_tier: newTier }),
      });
      setChauffeurs(prev => prev.map(c => c.id === chauffeurId ? { ...c, subscription_tier: newTier } : c));
    } catch (err) {
      console.error('Error changing tier:', err);
    }
  };

  // ─── Calculs ───────────────────────────────────────────────────
  const formatMoney = (n: number) => n.toFixed(2) + ' $';
  const formatKm = (n: number) => n.toLocaleString('fr-CA');
  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatDateTime = (d: string) => new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  // Bénéfices abonnements
  const subscriptionRevenue = chauffeurs.reduce((sum, c) => {
    const plan = SUBSCRIPTION_PLANS.find(p => p.tier === (c.subscription_tier || 'basic'));
    return sum + (plan?.price || 0);
  }, 0);

  const tierCounts = {
    basic: chauffeurs.filter(c => (c.subscription_tier || 'basic') === 'basic').length,
    pro: chauffeurs.filter(c => c.subscription_tier === 'pro').length,
    premium: chauffeurs.filter(c => c.subscription_tier === 'premium').length,
  };

  // Square totaux
  const squareTotalReceived = transactions
    .filter(t => t.status === 'COMPLETED')
    .reduce((sum, t) => sum + t.amount, 0);

  const squareTotalPending = transactions
    .filter(t => t.status !== 'COMPLETED' && t.status !== 'FAILED' && t.status !== 'CANCELED')
    .reduce((sum, t) => sum + t.amount, 0);

  // Filtres
  const filteredChauffeurs = chauffeurs.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.transport_company || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredFlotte = flotte.filter(v =>
    v.nom.toLowerCase().includes(search.toLowerCase()) ||
    (v.marque || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.plaque || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.chauffeur?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  // ─── Données de rapport ────────────────────────────────────────
  type ReportType = 'chauffeurs' | 'revenus' | 'abonnements' | 'flotte';

  const getReportData = (type: ReportType): { headers: string[]; rows: string[][]; title: string; totals?: string[][] } => {
    if (type === 'chauffeurs') {
      return {
        title: 'Rapport Chauffeurs',
        headers: ['Nom', 'Email', 'Entreprise', 'Statut', 'Abonnement', 'Revenus', 'Depenses', 'Profit', 'Vehicules', 'Courses'],
        rows: chauffeurs.map(c => [
          c.name, c.email, c.transport_company || '', c.actif ? 'Actif' : 'Inactif',
          c.subscription_tier || 'basic', c.stats.totalRevenus.toFixed(2), c.stats.totalDepenses.toFixed(2),
          c.stats.profit.toFixed(2), String(c.stats.nbVehicules), String(c.stats.nbTournees),
        ]),
      };
    } else if (type === 'revenus') {
      return {
        title: 'Rapport Revenus',
        headers: ['Periode', 'Revenus', 'Adapte', 'Regulier', 'Depenses', 'Profit'],
        rows: stats ? [
          ['Ce mois', stats.totalRevenusCeMois.toFixed(2), stats.revenusAdapteCeMois.toFixed(2), stats.revenusRegulierCeMois.toFixed(2), stats.totalDepensesCeMois.toFixed(2), stats.profitCeMois.toFixed(2)],
          ['Mois dernier', stats.totalRevenusMoisDernier.toFixed(2), '', '', '', ''],
          ['Total global', stats.totalRevenusGlobal.toFixed(2), '', '', stats.totalDepensesGlobal.toFixed(2), stats.profitGlobal.toFixed(2)],
        ] : [],
      };
    } else if (type === 'abonnements') {
      return {
        title: 'Rapport Abonnements',
        headers: ['Nom', 'Email', 'Abonnement', 'Prix mensuel', 'Statut'],
        rows: chauffeurs.map(c => {
          const plan = SUBSCRIPTION_PLANS.find(p => p.tier === (c.subscription_tier || 'basic'));
          return [c.name, c.email, plan?.label || 'Basic', plan?.price?.toFixed(2) || '0.00', c.actif ? 'Actif' : 'Inactif'];
        }),
        totals: [
          ['Total mensuel', '', '', subscriptionRevenue.toFixed(2), ''],
          ['Total annuel estime', '', '', (subscriptionRevenue * 12).toFixed(2), ''],
        ],
      };
    } else {
      return {
        title: 'Rapport Flotte',
        headers: ['Vehicule', 'Marque', 'Modele', 'Annee', 'Plaque', 'KM', 'Chauffeur', 'Entreprise'],
        rows: flotte.map(v => [
          v.nom, v.marque || '', v.modele || '', String(v.annee || ''), v.plaque || '',
          String(v.kilometrage), v.chauffeur?.name || '', v.chauffeur?.company || '',
        ]),
      };
    }
  };

  // ─── Export CSV ───────────────────────────────────────────────
  const downloadCSV = (type: ReportType) => {
    const { headers, rows, totals } = getReportData(type);
    const today = new Date().toISOString().split('T')[0];
    let csv = headers.join(',') + '\n';
    rows.forEach(row => { csv += row.map(v => `"${v}"`).join(',') + '\n'; });
    if (totals) { csv += '\n'; totals.forEach(row => { csv += row.map(v => `"${v}"`).join(',') + '\n'; }); }
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-admin-${type}-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Export PDF ───────────────────────────────────────────────
  const downloadPDF = (type: ReportType) => {
    const { headers, rows, title, totals } = getReportData(type);
    const today = new Date().toISOString().split('T')[0];
    const doc = new jsPDF({ orientation: headers.length > 6 ? 'landscape' : 'portrait' });

    // En-tête
    doc.setFontSize(18);
    doc.setTextColor(30, 64, 175);
    doc.text('Transport Adapte - Administration', 14, 20);
    doc.setFontSize(13);
    doc.setTextColor(60, 60, 60);
    doc.text(title, 14, 30);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Genere le ${today}`, 14, 37);

    // Tableau principal
    const allRows = [...rows, ...(totals || [])];
    autoTable(doc, {
      startY: 42,
      head: [headers],
      body: allRows,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      didParseCell: (data: any) => {
        // Style gras pour les lignes de totaux
        if (totals && data.section === 'body' && data.row.index >= rows.length) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [220, 230, 250];
        }
      },
    });

    // Pied de page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i}/${pageCount}`, doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 10);
      doc.text('Transport Adapte - Confidentiel', 14, doc.internal.pageSize.getHeight() - 10);
    }

    doc.save(`rapport-admin-${type}-${today}.pdf`);
  };

  const tabs = [
    { id: 'overview' as const, label: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'chauffeurs' as const, label: 'Chauffeurs', icon: Users },
    { id: 'flotte' as const, label: 'Flotte', icon: Car },
    { id: 'paiements' as const, label: 'Paiements', icon: CreditCard },
    { id: 'abonnements' as const, label: 'Abonnements', icon: Crown },
    { id: 'rapports' as const, label: 'Rapports', icon: FileText },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-400 mx-auto" />
          <p className="text-gray-400 mt-4">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header Admin */}
      <header className="bg-gray-900 border-b border-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-white">Administration</h1>
                <p className="text-xs text-gray-400">Transport Adapté - Panneau de gestion</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={fetchAll} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors">
                <RefreshCw className="w-5 h-5" />
              </button>
              <button onClick={onLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm font-semibold">
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 overflow-x-auto">
          <nav className="flex gap-1 min-w-max">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearch(''); }}
                className={`py-3 px-4 font-semibold text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-400'
                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">

        {/* ═══ VUE D'ENSEMBLE ═══ */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Chauffeurs actifs" value={`${stats.chauffeursActifs} / ${stats.totalChauffeurs}`} color="blue" />
              <StatCard icon={DollarSign} label="Revenus ce mois" value={formatMoney(stats.totalRevenusCeMois)} color="green" />
              <StatCard icon={Car} label="Véhicules" value={String(stats.totalVehicules)} color="purple" />
              <StatCard icon={Crown} label="Revenu abonnements" value={formatMoney(subscriptionRevenue) + '/mois'} color="orange" />
              <StatCard icon={Bus} label="Adapté ce mois" value={formatMoney(stats.revenusAdapteCeMois)} color="blue" />
              <StatCard icon={Car} label="Régulier ce mois" value={formatMoney(stats.revenusRegulierCeMois)} color="green" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Revenus - Mois dernier</p>
                <p className="text-2xl font-bold text-gray-200">{formatMoney(stats.totalRevenusMoisDernier)}</p>
                {stats.totalRevenusMoisDernier > 0 && (
                  <p className={`text-xs mt-1 font-semibold ${stats.totalRevenusCeMois >= stats.totalRevenusMoisDernier ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.totalRevenusCeMois >= stats.totalRevenusMoisDernier ? '+' : ''}
                    {((stats.totalRevenusCeMois - stats.totalRevenusMoisDernier) / stats.totalRevenusMoisDernier * 100).toFixed(1)}% vs mois dernier
                  </p>
                )}
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Square - Total reçu</p>
                <p className="text-2xl font-bold text-green-400">{formatMoney(squareTotalReceived)}</p>
                {squareTotalPending > 0 && <p className="text-xs text-yellow-400 mt-1">{formatMoney(squareTotalPending)} en attente</p>}
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Profit global</p>
                <p className={`text-2xl font-bold ${stats.profitGlobal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatMoney(stats.profitGlobal)}
                </p>
              </div>
            </div>

            {/* Top chauffeurs */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="font-bold text-gray-200 mb-4">Top chauffeurs par revenus</h3>
              <div className="space-y-3">
                {chauffeurs.sort((a, b) => b.stats.totalRevenus - a.stats.totalRevenus).slice(0, 5).map((c, i) => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-500 w-5">#{i + 1}</span>
                      <div>
                        <p className="font-semibold text-gray-200">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.transport_company || c.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-400">{formatMoney(c.stats.totalRevenus)}</p>
                      <p className="text-xs text-gray-500">{c.stats.nbTournees} courses</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ CHAUFFEURS ═══ */}
        {activeTab === 'chauffeurs' && (
          <div className="space-y-4 animate-fade-in">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un chauffeur..."
                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-gray-200 placeholder-gray-600 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <p className="text-sm text-gray-500">{filteredChauffeurs.length} chauffeur{filteredChauffeurs.length !== 1 ? 's' : ''}</p>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase">
                      <th className="text-left py-3 px-4">Chauffeur</th>
                      <th className="text-left py-3 px-4 hidden md:table-cell">Entreprise</th>
                      <th className="text-center py-3 px-4 hidden sm:table-cell">Abonnement</th>
                      <th className="text-right py-3 px-4">Revenus</th>
                      <th className="text-right py-3 px-4 hidden md:table-cell">Dépenses</th>
                      <th className="text-center py-3 px-4">Statut</th>
                      <th className="text-center py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredChauffeurs.map(c => (
                      <tr key={c.id} className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-gray-200">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.email}</p>
                        </td>
                        <td className="py-3 px-4 text-gray-400 hidden md:table-cell">{c.transport_company || '-'}</td>
                        <td className="py-3 px-4 text-center hidden sm:table-cell">
                          <TierBadge tier={c.subscription_tier || 'basic'} />
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-green-400">{formatMoney(c.stats.totalRevenus)}</td>
                        <td className="py-3 px-4 text-right text-orange-400 hidden md:table-cell">{formatMoney(c.stats.totalDepenses)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${c.actif ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                            {c.actif ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => handleToggleActive(c)}
                              className={`p-1.5 rounded-lg transition-colors ${c.actif ? 'text-yellow-400 hover:bg-yellow-900/30' : 'text-green-400 hover:bg-green-900/30'}`}
                              title={c.actif ? 'Désactiver' : 'Activer'}>
                              {c.actif ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                            <button onClick={() => handleDeleteChauffeur(c)}
                              className="text-red-500 hover:bg-red-900/30 p-1.5 rounded-lg transition-colors" title="Supprimer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══ FLOTTE ═══ */}
        {activeTab === 'flotte' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un véhicule..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-gray-200 placeholder-gray-600 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <button onClick={() => setFlotteView('cards')}
                  className={`p-3 transition-colors ${flotteView === 'cards' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                  title="Vue par véhicule">
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button onClick={() => setFlotteView('list')}
                  className={`p-3 transition-colors ${flotteView === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                  title="Vue en liste">
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500">{filteredFlotte.length} véhicule{filteredFlotte.length !== 1 ? 's' : ''}</p>

            {/* Vue par véhicule (cards) */}
            {flotteView === 'cards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFlotte.map(v => (
                  <div key={v.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="bg-purple-900/30 p-2.5 rounded-xl"><Car className="w-5 h-5 text-purple-400" /></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-200">{v.nom}</h4>
                        <p className="text-sm text-gray-500">{[v.marque, v.modele, v.annee].filter(Boolean).join(' ')}</p>
                        <div className="flex flex-wrap gap-2 mt-2 text-xs">
                          <span className="flex items-center gap-1 text-gray-400"><Gauge className="w-3 h-3" />{formatKm(v.kilometrage)} km</span>
                          {v.plaque && <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded font-mono">{v.plaque}</span>}
                          {v.dernierEntretien && <span className="flex items-center gap-1 text-gray-400"><Wrench className="w-3 h-3" />{v.dernierEntretien.type}</span>}
                        </div>
                        {v.chauffeur && (
                          <div className="mt-2 pt-2 border-t border-gray-800">
                            <p className="text-xs text-blue-400 font-semibold">{v.chauffeur.name}</p>
                            <p className="text-xs text-gray-600">{v.chauffeur.company || v.chauffeur.email}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Vue en liste (tableau) */}
            {flotteView === 'list' && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase">
                        <th className="text-left py-3 px-4">Véhicule</th>
                        <th className="text-left py-3 px-4 hidden md:table-cell">Marque / Modèle</th>
                        <th className="text-center py-3 px-4 hidden sm:table-cell">Plaque</th>
                        <th className="text-right py-3 px-4">Kilométrage</th>
                        <th className="text-left py-3 px-4 hidden md:table-cell">Entretien</th>
                        <th className="text-left py-3 px-4">Chauffeur</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFlotte.map(v => (
                        <tr key={v.id} className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Car className="w-4 h-4 text-purple-400 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-gray-200">{v.nom}</p>
                                {v.annee && <p className="text-xs text-gray-500">{v.annee}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-400 hidden md:table-cell">{[v.marque, v.modele].filter(Boolean).join(' ') || '-'}</td>
                          <td className="py-3 px-4 text-center hidden sm:table-cell">
                            {v.plaque ? <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded font-mono text-xs">{v.plaque}</span> : <span className="text-gray-600">-</span>}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="flex items-center justify-end gap-1 text-gray-300"><Gauge className="w-3 h-3 text-gray-500" />{formatKm(v.kilometrage)}</span>
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            {v.dernierEntretien ? (
                              <span className="flex items-center gap-1 text-xs text-gray-400"><Wrench className="w-3 h-3" />{v.dernierEntretien.type}</span>
                            ) : <span className="text-gray-600 text-xs">Aucun</span>}
                          </td>
                          <td className="py-3 px-4">
                            {v.chauffeur ? (
                              <div>
                                <p className="text-sm font-semibold text-blue-400">{v.chauffeur.name}</p>
                                <p className="text-xs text-gray-600">{v.chauffeur.company || v.chauffeur.email}</p>
                              </div>
                            ) : <span className="text-gray-600 text-xs">Non assigné</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ PAIEMENTS SQUARE ═══ */}
        {activeTab === 'paiements' && (
          <div className="space-y-6 animate-fade-in">
            {/* Stats paiements */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard icon={CheckCircle} label="Total reçu" value={formatMoney(squareTotalReceived)} color="green" />
              <StatCard icon={Clock} label="En attente" value={formatMoney(squareTotalPending)} color="orange" />
              <StatCard icon={CreditCard} label="Transactions" value={String(transactions.length)} color="blue" />
            </div>

            {/* Liste transactions */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-800">
                <h3 className="font-bold text-gray-200">Historique des paiements Square</h3>
              </div>
              {transactions.length === 0 ? (
                <div className="p-12 text-center">
                  <CreditCard className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500">Aucune transaction Square</p>
                  <p className="text-xs text-gray-600 mt-1">Vérifiez que vos clés Square sont configurées dans .env.local</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase">
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-right py-3 px-4">Montant</th>
                        <th className="text-center py-3 px-4 hidden sm:table-cell">Méthode</th>
                        <th className="text-center py-3 px-4">Statut</th>
                        <th className="text-left py-3 px-4 hidden md:table-cell">Note</th>
                        <th className="text-center py-3 px-4">Reçu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(tx => (
                        <tr key={tx.id} className="border-t border-gray-800 hover:bg-gray-800/30">
                          <td className="py-3 px-4 text-gray-300">{formatDateTime(tx.createdAt)}</td>
                          <td className="py-3 px-4 text-right font-bold text-green-400">{formatMoney(tx.amount)}</td>
                          <td className="py-3 px-4 text-center text-gray-400 hidden sm:table-cell">
                            {tx.cardBrand ? `${tx.cardBrand} ****${tx.cardLast4}` : tx.sourceType || '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              tx.status === 'COMPLETED' ? 'bg-green-900/50 text-green-400' :
                              tx.status === 'FAILED' ? 'bg-red-900/50 text-red-400' :
                              'bg-yellow-900/50 text-yellow-400'
                            }`}>{tx.status === 'COMPLETED' ? 'Complété' : tx.status === 'FAILED' ? 'Échoué' : tx.status}</span>
                          </td>
                          <td className="py-3 px-4 text-gray-500 hidden md:table-cell">{tx.note || '-'}</td>
                          <td className="py-3 px-4 text-center">
                            {tx.receiptUrl && (
                              <a href={tx.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                                <ExternalLink className="w-4 h-4 inline" />
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ ABONNEMENTS ═══ */}
        {activeTab === 'abonnements' && (
          <div className="space-y-6 animate-fade-in">
            {/* Résumé revenus abonnements */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Crown} label="Revenu mensuel" value={formatMoney(subscriptionRevenue)} color="orange" />
              <StatCard icon={TrendingUp} label="Revenu annuel est." value={formatMoney(subscriptionRevenue * 12)} color="green" />
              <StatCard icon={Star} label="Pro + Premium" value={String(tierCounts.pro + tierCounts.premium)} color="purple" />
              <StatCard icon={Users} label="Basic (gratuit)" value={String(tierCounts.basic)} color="gray" />
            </div>

            {/* Plans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SUBSCRIPTION_PLANS.map(plan => {
                const count = tierCounts[plan.tier as keyof typeof tierCounts] || 0;
                const revenue = count * plan.price;
                return (
                  <div key={plan.tier} className={`bg-gray-900 border rounded-xl p-5 ${
                    plan.tier === 'premium' ? 'border-purple-700' : plan.tier === 'pro' ? 'border-blue-700' : 'border-gray-800'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`font-bold text-lg ${
                        plan.tier === 'premium' ? 'text-purple-400' : plan.tier === 'pro' ? 'text-blue-400' : 'text-gray-400'
                      }`}>{plan.label}</h3>
                      <span className="text-xl font-bold text-gray-200">{plan.price > 0 ? formatMoney(plan.price) : 'Gratuit'}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{count} chauffeur{count !== 1 ? 's' : ''}</p>
                    {plan.price > 0 && (
                      <p className="text-sm font-semibold text-green-400 mb-3">Revenu: {formatMoney(revenue)}/mois</p>
                    )}
                    <ul className="space-y-1">
                      {plan.features.map((f, i) => (
                        <li key={i} className="text-xs text-gray-500 flex items-center gap-1.5">
                          <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* Tableau gestion abonnements */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-800">
                <h3 className="font-bold text-gray-200">Gestion des abonnements</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase">
                      <th className="text-left py-3 px-4">Chauffeur</th>
                      <th className="text-left py-3 px-4 hidden md:table-cell">Email</th>
                      <th className="text-center py-3 px-4">Abonnement actuel</th>
                      <th className="text-center py-3 px-4">Changer</th>
                      <th className="text-right py-3 px-4">Revenu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chauffeurs.map(c => {
                      const currentTier = c.subscription_tier || 'basic';
                      const currentPlan = SUBSCRIPTION_PLANS.find(p => p.tier === currentTier);
                      return (
                        <tr key={c.id} className="border-t border-gray-800 hover:bg-gray-800/30">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-gray-200">{c.name}</p>
                            <p className="text-xs text-gray-500 md:hidden">{c.email}</p>
                          </td>
                          <td className="py-3 px-4 text-gray-400 hidden md:table-cell">{c.email}</td>
                          <td className="py-3 px-4 text-center"><TierBadge tier={currentTier} /></td>
                          <td className="py-3 px-4 text-center">
                            <select
                              value={currentTier}
                              onChange={e => handleChangeTier(c.id, e.target.value)}
                              className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {SUBSCRIPTION_PLANS.map(p => (
                                <option key={p.tier} value={p.tier}>{p.label} ({p.price > 0 ? formatMoney(p.price) : 'Gratuit'})</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-green-400">
                            {currentPlan && currentPlan.price > 0 ? formatMoney(currentPlan.price) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══ RAPPORTS ═══ */}
        {activeTab === 'rapports' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ReportCard
                title="Rapport Abonnements"
                description="Détail des abonnements par chauffeur avec prix, revenu mensuel et annuel estimé"
                icon={Crown}
                color="orange"
                onDownloadCSV={() => downloadCSV('abonnements')}
                onDownloadPDF={() => downloadPDF('abonnements')}
              />
              <ReportCard
                title="Rapport Flotte"
                description="Liste de tous les véhicules avec marque, modèle, kilométrage et chauffeur associé"
                icon={Car}
                color="purple"
                onDownloadCSV={() => downloadCSV('flotte')}
                onDownloadPDF={() => downloadPDF('flotte')}
              />
            </div>

            {/* Résumé rapide */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="font-bold text-gray-200 mb-4">Résumé financier</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-xs uppercase">
                      <th className="text-left py-2 px-3">Métrique</th>
                      <th className="text-right py-2 px-3">Valeur</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    <tr className="border-t border-gray-800"><td className="py-2 px-3 font-bold">Revenu abonnements (mensuel)</td><td className="text-right py-2 px-3 font-bold text-blue-400">{formatMoney(subscriptionRevenue)}</td></tr>
                    <tr className="border-t border-gray-800"><td className="py-2 px-3 font-bold">Revenu abonnements (annuel est.)</td><td className="text-right py-2 px-3 font-bold text-blue-400">{formatMoney(subscriptionRevenue * 12)}</td></tr>
                    <tr className="border-t border-gray-800"><td className="py-2 px-3">Abonnés Basic</td><td className="text-right py-2 px-3">{tierCounts.basic}</td></tr>
                    <tr className="border-t border-gray-800"><td className="py-2 px-3">Abonnés Pro</td><td className="text-right py-2 px-3 text-blue-400">{tierCounts.pro}</td></tr>
                    <tr className="border-t border-gray-800"><td className="py-2 px-3">Abonnés Premium</td><td className="text-right py-2 px-3 text-purple-400">{tierCounts.premium}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Sous-composants ─────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-900/30 text-blue-400', green: 'bg-green-900/30 text-green-400',
    purple: 'bg-purple-900/30 text-purple-400', red: 'bg-red-900/30 text-red-400',
    orange: 'bg-orange-900/30 text-orange-400', gray: 'bg-gray-800/50 text-gray-400',
  };
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-2 rounded-lg ${colorMap[color] || colorMap.blue}`}><Icon className="w-4 h-4" /></div>
        <span className="text-xs font-semibold text-gray-500 uppercase">{label}</span>
      </div>
      <p className="text-xl font-bold text-gray-100">{value}</p>
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    basic: 'bg-gray-800 text-gray-400',
    pro: 'bg-blue-900/50 text-blue-400',
    premium: 'bg-purple-900/50 text-purple-400',
  };
  const labels: Record<string, string> = { basic: 'Basic', pro: 'Pro', premium: 'Premium' };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${styles[tier] || styles.basic}`}>{labels[tier] || tier}</span>;
}

function ReportCard({ title, description, icon: Icon, color, onDownloadCSV, onDownloadPDF }: {
  title: string; description: string; icon: any; color: string; onDownloadCSV: () => void; onDownloadPDF: () => void;
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-900/30 text-blue-400', green: 'bg-green-900/30 text-green-400',
    purple: 'bg-purple-900/30 text-purple-400', orange: 'bg-orange-900/30 text-orange-400',
  };
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-start gap-4">
      <div className={`p-3 rounded-xl ${colorMap[color] || colorMap.blue}`}><Icon className="w-6 h-6" /></div>
      <div className="flex-1">
        <h3 className="font-bold text-gray-200 mb-1">{title}</h3>
        <p className="text-xs text-gray-500 mb-3">{description}</p>
        <div className="flex items-center gap-3">
          <button
            onClick={onDownloadPDF}
            className="flex items-center gap-2 text-sm font-semibold bg-red-600/20 text-red-400 hover:bg-red-600/30 px-3 py-1.5 rounded-lg transition-colors"
          >
            <File className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={onDownloadCSV}
            className="flex items-center gap-2 text-sm font-semibold bg-green-600/20 text-green-400 hover:bg-green-600/30 px-3 py-1.5 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            CSV
          </button>
        </div>
      </div>
    </div>
  );
}
