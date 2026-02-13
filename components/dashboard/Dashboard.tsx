'use client';

import { useEffect, useState } from 'react';
import { Bus, Car, Activity } from 'lucide-react';

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

  const total = tours.adapte + tours.regulier;
  const percentAdapte = total > 0 ? ((tours.adapte / total) * 100).toFixed(1) : 0;
  const percentRegulier = total > 0 ? ((tours.regulier / total) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner with Background */}
      <div
        className="relative w-full py-16 md:py-24 overflow-hidden"
        style={{
          backgroundImage: 'url("/images/hero-background.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/85 to-blue-900/75"></div>
        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Left Content */}
            <div className="flex-1 text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                Bienvenue {civilite} {displayName}
              </h1>
              <p className="text-lg md:text-xl text-gray-100">
                Voici un aperçu de vos dernières activités
              </p>
            </div>

            {/* Right Icon/Visual */}
            <div className="flex-1 flex justify-center md:justify-end opacity-50">
              <div className="relative">
                <Activity className="w-20 h-20 md:w-32 md:h-32 text-blue-300" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Courses Adaptées Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 p-4 rounded-full mb-4">
                <Bus className="w-10 h-10 text-blue-600" />
              </div>
              <p className="text-sm font-bold text-gray-600 uppercase tracking-widest mb-3">
                Courses Adaptées
              </p>
              <p className="text-5xl font-black text-blue-600 mb-4">
                {tours.adapte}
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Transport adapté pour passagers<br/>à mobilité réduite
              </p>
            </div>
          </div>

          {/* Courses Régulières Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="flex flex-col items-center text-center">
              <div className="bg-green-100 p-4 rounded-full mb-4">
                <Car className="w-10 h-10 text-green-600" />
              </div>
              <p className="text-sm font-bold text-gray-600 uppercase tracking-widest mb-3">
                Courses Régulières
              </p>
              <p className="text-5xl font-black text-green-600 mb-4">
                {tours.regulier}
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Transport régulier pour<br/>tous les passagers
              </p>
            </div>
          </div>

          {/* Total Courses Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-2xl p-8 border-2 border-blue-200 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="flex flex-col items-center text-center">
              <div className="bg-indigo-100 p-4 rounded-full mb-4">
                <Activity className="w-10 h-10 text-indigo-600" />
              </div>
              <p className="text-sm font-bold text-gray-600 uppercase tracking-widest mb-3">
                Total des Courses
              </p>
              <p className="text-5xl font-black text-gray-900 mb-4">
                {total}
              </p>
              <div className="space-y-1 text-xs font-semibold">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-blue-600">{percentAdapte}% Adapté</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-green-600">{percentRegulier}% Régulier</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="bg-gray-50 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Gestion Efficace de vos Courses
            </h2>
            <p className="text-gray-600 mb-6">
              Suivez en temps réel vos courses adaptées et régulières, analysez vos revenus et optimisez votre activité avec notre plateforme intelligente propulsée par l'IA.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                    <Bus className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Suivi en Temps Réel</h3>
                  <p className="mt-1 text-sm text-gray-600">Monitez vos courses et vos revenus instantanément</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                    <Car className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Rapports Détaillés</h3>
                  <p className="mt-1 text-sm text-gray-600">Obtenez des analyses complètes de votre activité</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
                    <Activity className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Optimisation IA</h3>
                  <p className="mt-1 text-sm text-gray-600">Recommandations personnalisées pour augmenter vos profits</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
