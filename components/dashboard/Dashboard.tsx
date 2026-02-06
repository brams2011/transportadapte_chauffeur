'use client';

import { useEffect, useState } from 'react';
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  userId: string;
}

export default function Dashboard({ userId }: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Récupérer les insights mensuels
      const response = await fetch(`/api/insights/monthly?user_id=${userId}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result);
        setInsights(result.ai_insights);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Impossible de charger les données</p>
      </div>
    );
  }

  const { summary, breakdown, comparison, ai_insights } = data;

  // Couleurs pour les graphiques
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Données pour le graphique de dépenses par catégorie
  const expensesData = Object.entries(breakdown.expenses_by_category).map(([name, value]) => ({
    name: name === 'fuel' ? 'Essence' :
          name === 'maintenance' ? 'Entretien' :
          name === 'insurance' ? 'Assurance' : 'Autre',
    value: value as number
  }));

  // Données pour le graphique revenus vs dépenses
  const revenueExpensesData = [
    { name: 'Revenus', value: summary.revenue, color: '#10b981' },
    { name: 'Dépenses', value: summary.expenses, color: '#ef4444' },
    { name: 'Profit', value: summary.profit, color: '#3b82f6' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Tableau de bord financier
          </h1>
          <p className="text-gray-600 mt-1">
            {data.period.month}
          </p>
        </div>

        {/* Cartes de résumé */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Revenus */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenus</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.revenue.toFixed(2)}$
                </p>
                {comparison.revenue_change !== 0 && (
                  <div className={`flex items-center mt-2 text-sm ${
                    comparison.revenue_change > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {comparison.revenue_change > 0 ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {Math.abs(comparison.revenue_change).toFixed(1)}%
                  </div>
                )}
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Dépenses */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Dépenses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.expenses.toFixed(2)}$
                </p>
                {comparison.expenses_change !== 0 && (
                  <div className={`flex items-center mt-2 text-sm ${
                    comparison.expenses_change < 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {comparison.expenses_change < 0 ? (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    )}
                    {Math.abs(comparison.expenses_change).toFixed(1)}%
                  </div>
                )}
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          {/* Profit */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Profit net</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.profit.toFixed(2)}$
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Marge: {summary.profit_margin.toFixed(1)}%
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Taux horaire */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taux horaire moyen</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.avg_hourly_rate.toFixed(2)}$/h
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {summary.hours_worked.toFixed(1)}h travaillées
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenus vs Dépenses */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Revenus vs Dépenses</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueExpensesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6">
                  {revenueExpensesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Dépenses par catégorie */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Dépenses par catégorie</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expensesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value.toFixed(0)}$`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expensesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insights IA */}
        {ai_insights?.insights && ai_insights.insights.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-blue-600" />
              Insights IA
            </h3>
            <div className="space-y-4">
              {ai_insights.insights.map((insight: any, index: number) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg border-l-4 ${
                    insight.severity === 'critical' ? 'border-red-500 bg-red-50' :
                    insight.severity === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                    'border-blue-500 bg-blue-50'
                  }`}
                >
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {insight.title}
                  </h4>
                  <p className="text-gray-700 text-sm">
                    {insight.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommandations */}
        {ai_insights?.recommendations && ai_insights.recommendations.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">
              Recommandations pour améliorer ta rentabilité
            </h3>
            <div className="space-y-4">
              {ai_insights.recommendations.map((rec: any, index: number) => (
                <div key={index} className="border-l-4 border-green-500 bg-green-50 p-4 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {rec.title}
                      </h4>
                      <p className="text-gray-700 text-sm mb-2">
                        {rec.description}
                      </p>
                      {rec.action_steps && rec.action_steps.length > 0 && (
                        <ul className="text-sm text-gray-600 ml-4 list-disc">
                          {rec.action_steps.map((step: string, i: number) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {rec.potential_savings > 0 && (
                      <div className="ml-4 text-right">
                        <p className="text-xs text-gray-600">Économies potentielles</p>
                        <p className="text-lg font-bold text-green-600">
                          {rec.potential_savings.toFixed(2)}$
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
