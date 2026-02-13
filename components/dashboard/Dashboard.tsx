'use client';

import { useEffect, useState } from 'react';
import { Bus, Car } from 'lucide-react';

interface DashboardProps {
  userId: string;
  userName?: string;
}

export default function Dashboard({ userId, userName }: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [tours, setTours] = useState<{ adapte: number; regulier: number }>({ adapte: 0, regulier: 0 });

  useEffect(() => {
    fetchToursData();
  }, [userId]);

  const fetchToursData = async () => {
    try {
      setLoading(true);

      // Récupérer les tournées pour compter adaptées vs régulières
      const response = await fetch(`/api/tournees?user_id=${userId}`);
      const result = await response.json();

      if (result.success && result.tournees) {
        const adapte = result.tournees.filter((t: any) => t.transport_type === 'adapte' || !t.transport_type).length;
        const regulier = result.tournees.filter((t: any) => t.transport_type === 'regulier').length;
        setTours({ adapte, regulier });
      }
    } catch (error) {
      console.error('Error fetching tours data:', error);
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

  // Déterminer la civilité
  const civilite = userName && userName.toLowerCase().includes('mme') ? 'Mme' :
                   userName && userName.toLowerCase().includes('mme.') ? 'Mme' : 'M.';
  const displayName = userName ? userName.replace(/^(M\.|Mme\.?)\s*/i, '') : 'Chauffeur';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Bienvenue {civilite} {displayName}
          </h1>
          <p className="text-lg text-gray-600">
            Voici un aperçu de vos dernières activités
          </p>
        </div>

        {/* Courses Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Courses Adaptées */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-gray-600 font-semibold uppercase tracking-wider">Courses Adaptées</p>
                <p className="text-4xl font-bold text-blue-600 mt-2">
                  {tours.adapte}
                </p>
              </div>
              <div className="bg-blue-100 p-4 rounded-full">
                <Bus className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Transport adapté pour passagers à mobilité réduite
            </p>
          </div>

          {/* Courses Régulières */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-gray-600 font-semibold uppercase tracking-wider">Courses Régulières</p>
                <p className="text-4xl font-bold text-green-600 mt-2">
                  {tours.regulier}
                </p>
              </div>
              <div className="bg-green-100 p-4 rounded-full">
                <Car className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Transport régulier pour tous les passagers
            </p>
          </div>
        </div>

        {/* Total Stats */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-semibold uppercase tracking-wider">Total des Courses</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {tours.adapte + tours.regulier}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-2">Répartition</p>
              <p className="text-sm font-semibold text-blue-600">
                {tours.adapte > 0 ? ((tours.adapte / (tours.adapte + tours.regulier)) * 100).toFixed(1) : 0}% Adapté
              </p>
              <p className="text-sm font-semibold text-green-600">
                {tours.regulier > 0 ? ((tours.regulier / (tours.adapte + tours.regulier)) * 100).toFixed(1) : 0}% Régulier
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
