'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, TrendingUp, Loader2, ChevronDown, CheckCircle, Bus, Car } from 'lucide-react';

interface RapportsProps {
  userId: string;
}

interface ReportData {
  ytd: {
    revenue: number;
    expenses: number;
    profit: number;
  };
  month: {
    period: string;
    revenue: { total: number; byType: Record<string, number>; byTransportType?: { adapte: number; regulier: number } };
    expenses: { total: number; deductible: number; byCategory: Record<string, number> };
    profit: number;
    profitMargin: number;
  };
}

export default function Rapports({ userId }: RapportsProps) {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [generated, setGenerated] = useState<string | null>(null);
  const [formatChoice, setFormatChoice] = useState<{ type: string; label: string } | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    fetchData();
  }, [userId, selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rapports?user_id=${encodeURIComponent(userId)}&month=${selectedMonth}`);
      const result = await res.json();
      if (result.success) {
        setData(result);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = (type: string) => {
    setFormatChoice({ type, label: type });
  };

  const handleDownload = async (format: 'csv' | 'pdf') => {
    if (!formatChoice) return;
    const type = formatChoice.type;
    setFormatChoice(null);

    if (format === 'pdf') {
      const url = `/api/rapports/pdf?user_id=${encodeURIComponent(userId)}&type=${type}&month=${selectedMonth}`;
      window.open(url, '_blank');
      setGenerated(type);
      setTimeout(() => setGenerated(null), 3000);
      return;
    }

    setGenerating(type);
    setGenerated(null);
    try {
      const url = `/api/rapports/generate?user_id=${encodeURIComponent(userId)}&type=${type}&month=${selectedMonth}`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error('Erreur lors de la génération');
      }

      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const filenameMatch = disposition.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `rapport-${type}.csv`;

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      setGenerated(type);
      setTimeout(() => setGenerated(null), 3000);
    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setGenerating(null);
    }
  };

  const fmt = (n: number) => n.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' });
      options.push({ value: val, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return options;
  };

  const ReportButton = ({ type, label, color, description }: {
    type: string;
    label: string;
    color: string;
    description: string;
  }) => {
    const isGenerating = generating === type;
    const isGenerated = generated === type;

    const gradients: Record<string, string> = {
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-red-500',
      green: 'from-green-500 to-emerald-500',
    };

    const textColors: Record<string, string> = {
      blue: 'text-blue-600 hover:text-blue-700',
      purple: 'text-purple-600 hover:text-purple-700',
      orange: 'text-orange-600 hover:text-orange-700',
      green: 'text-green-600 hover:text-green-700',
    };

    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className={`bg-gradient-to-r ${gradients[color]} px-5 py-3`}>
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {label}
          </h3>
        </div>
        <div className="p-5">
          <p className="text-sm text-gray-600 mb-4">{description}</p>
          <button
            onClick={() => handleGenerate(type)}
            disabled={isGenerating}
            className={`flex items-center gap-2 font-semibold text-sm transition-colors ${
              isGenerated ? 'text-green-600' :
              isGenerating ? 'text-gray-400' :
              textColors[color]
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Génération en cours...
              </>
            ) : isGenerated ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Rapport téléchargé!
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Générer le rapport
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-600">Chargement des rapports...</span>
        </div>
      </div>
    );
  }

  const ytd = data?.ytd || { revenue: 0, expenses: 0, profit: 0 };
  const month = data?.month || {
    period: selectedMonth,
    revenue: { total: 0, byType: {} },
    expenses: { total: 0, deductible: 0, byCategory: {} },
    profit: 0,
    profitMargin: 0,
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 p-2.5 rounded-xl">
          <FileText className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Rapports</h2>
          <p className="text-sm text-gray-500">Générez vos rapports comptables et fiscaux</p>
        </div>
      </div>

      {/* YTD Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500 font-medium mb-1">Revenus année à date</p>
          <p className="text-2xl font-bold text-gray-900">{fmt(ytd.revenue)} $</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500 font-medium mb-1">Dépenses année à date</p>
          <p className="text-2xl font-bold text-gray-900">{fmt(ytd.expenses)} $</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500 font-medium mb-1">Profit net année à date</p>
          <p className={`text-2xl font-bold ${ytd.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {fmt(ytd.profit)} $
          </p>
        </div>
      </div>

      {/* Report Generation Buttons - 2x2 Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <ReportButton
          type="mensuel"
          label="Rapport mensuel"
          color="blue"
          description="Résumé complet de vos revenus et dépenses du mois"
        />
        <ReportButton
          type="trimestriel"
          label="Rapport trimestriel"
          color="purple"
          description="Vue d'ensemble des 3 derniers mois pour votre comptable"
        />
        <ReportButton
          type="annuel"
          label="Rapport annuel"
          color="orange"
          description="Déclaration fiscale et résumé de l'année complète"
        />
        <ReportButton
          type="tps"
          label="TPS/TVQ"
          color="green"
          description="Rapport pour vos déclarations de taxes"
        />
      </div>

      {/* Aperçu du mois en cours */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-8">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold text-gray-900 text-lg">Aperçu du mois en cours</h3>
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {generateMonthOptions().map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Revenus */}
            <div>
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Revenus
              </h4>
              <div className="space-y-2">
                {Object.entries(month.revenue.byType).length > 0 ? (
                  Object.entries(month.revenue.byType).map(([type, amount]) => (
                    <div key={type} className="flex justify-between text-sm">
                      <span className="text-gray-600">{type}</span>
                      <span className="font-medium text-gray-900">{fmt(amount)} $</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">Aucun revenu ce mois</p>
                )}
                <div className="flex justify-between text-sm font-bold border-t pt-2 mt-2">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">{fmt(month.revenue.total)} $</span>
                </div>
              </div>
            </div>

            {/* Dépenses déductibles */}
            <div>
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-orange-500">*</span>
                Dépenses déductibles
              </h4>
              <div className="space-y-2">
                {Object.entries(month.expenses.byCategory).length > 0 ? (
                  Object.entries(month.expenses.byCategory).map(([cat, amount]) => (
                    <div key={cat} className="flex justify-between text-sm">
                      <span className="text-gray-600">{cat}</span>
                      <span className="font-medium text-gray-900">{fmt(amount)} $</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">Aucune dépense déductible ce mois</p>
                )}
                <div className="flex justify-between text-sm font-bold border-t pt-2 mt-2">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">{fmt(month.expenses.deductible)} $</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ventilation par type de transport */}
          {month.revenue.byTransportType && (month.revenue.byTransportType.adapte > 0 || month.revenue.byTransportType.regulier > 0) && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Bus className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-600 uppercase">Transport Adapté</p>
                  <p className="text-lg font-bold text-blue-800">{fmt(month.revenue.byTransportType.adapte)} $</p>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Car className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-green-600 uppercase">Transport Régulier</p>
                  <p className="text-lg font-bold text-green-800">{fmt(month.revenue.byTransportType.regulier)} $</p>
                </div>
              </div>
            </div>
          )}

          {/* Revenu net box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">Revenu net</span>
            </div>
            <p className={`text-2xl font-bold ${month.profit >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
              {fmt(month.profit)} $
            </p>
            <p className="text-sm text-blue-600 mt-1">
              Marge de profit: {month.profitMargin.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Modal choix de format */}
      {formatChoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in">
            <div className="p-5 border-b">
              <h3 className="text-lg font-bold text-gray-900">Choisir le format</h3>
              <p className="text-sm text-gray-500 mt-1">Comment souhaitez-vous exporter le rapport ?</p>
            </div>
            <div className="p-5 space-y-3">
              <button
                onClick={() => handleDownload('pdf')}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-red-400 hover:bg-red-50 transition-all group"
              >
                <div className="bg-red-100 p-2.5 rounded-lg group-hover:bg-red-200 transition-colors">
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">PDF</p>
                  <p className="text-xs text-gray-500">Rapport formaté pour impression</p>
                </div>
              </button>
              <button
                onClick={() => handleDownload('csv')}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all group"
              >
                <div className="bg-green-100 p-2.5 rounded-lg group-hover:bg-green-200 transition-colors">
                  <Download className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">CSV</p>
                  <p className="text-xs text-gray-500">Fichier tableur (Excel, Google Sheets)</p>
                </div>
              </button>
            </div>
            <div className="px-5 pb-5">
              <button
                onClick={() => setFormatChoice(null)}
                className="w-full py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pour votre comptable */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <h3 className="font-bold text-gray-900 text-lg mb-3">Pour votre comptable</h3>
        <p className="text-sm text-gray-600 mb-4">Tous les rapports incluent automatiquement :</p>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">&#8226;</span>
            Détails de toutes les transactions avec dates et catégories
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">&#8226;</span>
            Classification automatique des dépenses déductibles
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">&#8226;</span>
            Calculs TPS/TVQ pré-remplis
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">&#8226;</span>
            Copies numériques de toutes les factures scannées
          </li>
        </ul>
      </div>
    </div>
  );
}
