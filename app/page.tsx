'use client';

import { useState, useEffect } from 'react';
import Dashboard from '@/components/dashboard/Dashboard';
import FinancialDashboard from '@/components/dashboard/FinancialDashboard';
import Tournees from '@/components/tournees/Tournees';
import ReceiptScanner from '@/components/forms/ReceiptScanner';
import ChatBot from '@/components/chat/ChatBot';
import UserSelector from '@/components/auth/UserSelector';
import LoginPage from '@/components/auth/LoginPage';
import LandingPage from '@/components/auth/LandingPage';
import Rapports from '@/components/rapports/Rapports';
import Vehicules from '@/components/vehicules/Vehicules';
import { Home as HomeIcon, Bus, Car, DollarSign, Lightbulb, Upload, FileText, LogOut, Sparkles, AlertTriangle, Save, Loader2 } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase-browser';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  transport_company?: string;
  status?: string;
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<'landing' | 'login' | 'signup'>('landing');
  const [activeTab, setActiveTab] = useState<'accueil' | 'courses' | 'vehicules' | 'finances' | 'insights' | 'scan' | 'rapports' | 'chat'>('accueil');
  const [refreshDashboard, setRefreshDashboard] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasVehicule, setHasVehicule] = useState<boolean | null>(null);
  const [savingVehicule, setSavingVehicule] = useState(false);
  const [formVehicule, setFormVehicule] = useState({
    nom: '', marque: '', modele: '', annee: '', plaque: '', kilometrage_actuel: ''
  });
  const [userContext, setUserContext] = useState({
    current_month_revenue: 0,
    current_month_expenses: 0,
    current_profit: 0,
    top_expense_categories: [] as string[]
  });

  useEffect(() => {
    // Vérifier la session Supabase Auth en premier
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabaseBrowser.auth.getSession();
        if (session?.user) {
          // Session auth valide — charger le profil local
          const savedSession = localStorage.getItem('transport_current_user');
          if (savedSession) {
            const parsed = JSON.parse(savedSession);
            // Vérifier que le profil local correspond à l'utilisateur auth
            if (parsed.email === session.user.email) {
              setCurrentUser(parsed);
            } else {
              // Mismatch — nettoyer
              localStorage.removeItem('transport_current_user');
            }
          }
        } else {
          // Pas de session auth — nettoyer le localStorage
          localStorage.removeItem('transport_current_user');
        }
      } catch {
        // Fallback : utiliser localStorage si Supabase est inaccessible
        const savedSession = localStorage.getItem('transport_current_user');
        if (savedSession) {
          setCurrentUser(JSON.parse(savedSession));
        }
      }
      setIsLoading(false);
    };
    checkSession();
  }, []);

  // Charger JotForm Agent avec identity verification
  useEffect(() => {
    if (!currentUser) return;

    let script: HTMLScriptElement | null = null;

    const loadJotForm = async () => {
      try {
        const res = await fetch('/api/jotform-hash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id }),
        });
        const data = await res.json();

        if (data.success && data.userHash) {
          (window as any).jotformAgentIdentity = {
            userId: currentUser.id,
            userHash: data.userHash,
          };
        }
      } catch {}

      script = document.createElement('script');
      script.src = 'https://cdn.jotfor.ms/agent/embedjs/019c316345c37c149f3229f6a6ed7674fcaa/embed.js';
      script.async = true;
      document.body.appendChild(script);
    };

    loadJotForm();

    return () => {
      if (script) {
        try { document.body.removeChild(script); } catch {}
      }
    };
  }, [currentUser?.id]);

  // Vérifier si l'utilisateur a un véhicule
  useEffect(() => {
    if (currentUser) {
      checkVehicule(currentUser.id);
    }
  }, [currentUser?.id]);

  const checkVehicule = async (userId: string) => {
    try {
      const res = await fetch(`/api/vehicules?user_id=${userId}`);
      const data = await res.json();
      setHasVehicule(data.success && data.vehicules && data.vehicules.length > 0);
    } catch {
      setHasVehicule(false);
    }
  };

  const handleAddFirstVehicule = async () => {
    if (!formVehicule.nom.trim() || !currentUser) return;
    setSavingVehicule(true);
    try {
      const res = await fetch('/api/vehicules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, ...formVehicule }),
      });
      const data = await res.json();
      if (data.success) {
        setHasVehicule(true);
        setFormVehicule({ nom: '', marque: '', modele: '', annee: '', plaque: '', kilometrage_actuel: '' });
      }
    } catch (err) {
      console.error('Error adding vehicule:', err);
    } finally {
      setSavingVehicule(false);
    }
  };

  const handleScanSuccess = () => {
    setRefreshDashboard(prev => prev + 1);
    setActiveTab('accueil');
  };

  const handleUserChange = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('transport_current_user', JSON.stringify(user));
    setRefreshDashboard(prev => prev + 1);
  };

  const handleLogout = async () => {
    // Déconnexion Supabase Auth + nettoyage local
    await supabaseBrowser.auth.signOut();
    setCurrentUser(null);
    localStorage.removeItem('transport_current_user');
    setAuthView('landing');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Pages avant connexion : Landing ou Login
  if (!currentUser) {
    if (authView === 'login' || authView === 'signup') {
      return <LoginPage onLogin={handleUserChange} />;
    }
    return (
      <LandingPage
        onGoToLogin={() => setAuthView('login')}
        onGoToSignup={() => setAuthView('signup')}
      />
    );
  }

  // Écran obligatoire : ajouter un véhicule
  if (hasVehicule === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-t-2xl text-white text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
            <h2 className="text-xl font-bold">Véhicule obligatoire</h2>
            <p className="text-sm text-orange-100 mt-2">
              Vous devez enregistrer au moins un véhicule pour continuer à utiliser l&apos;application.
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom du véhicule *</label>
              <input
                type="text"
                value={formVehicule.nom}
                onChange={e => setFormVehicule({ ...formVehicule, nom: e.target.value })}
                placeholder="Ex: Mon Dodge Caravan"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marque</label>
                <input
                  type="text"
                  value={formVehicule.marque}
                  onChange={e => setFormVehicule({ ...formVehicule, marque: e.target.value })}
                  placeholder="Dodge"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modèle</label>
                <input
                  type="text"
                  value={formVehicule.modele}
                  onChange={e => setFormVehicule({ ...formVehicule, modele: e.target.value })}
                  placeholder="Grand Caravan"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
                <input
                  type="number"
                  value={formVehicule.annee}
                  onChange={e => setFormVehicule({ ...formVehicule, annee: e.target.value })}
                  placeholder="2019"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plaque</label>
                <input
                  type="text"
                  value={formVehicule.plaque}
                  onChange={e => setFormVehicule({ ...formVehicule, plaque: e.target.value })}
                  placeholder="ABC 1234"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kilométrage actuel</label>
              <input
                type="number"
                value={formVehicule.kilometrage_actuel}
                onChange={e => setFormVehicule({ ...formVehicule, kilometrage_actuel: e.target.value })}
                placeholder="125000"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <button
              onClick={handleAddFirstVehicule}
              disabled={savingVehicule || !formVehicule.nom.trim()}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {savingVehicule ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Enregistrement...</>
              ) : (
                <><Save className="w-5 h-5" /> Enregistrer et continuer</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Attente de la vérification véhicule
  if (hasVehicule === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b backdrop-blur-sm bg-white/90">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-1.5 md:p-2 rounded-lg md:rounded-xl">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.92 5.01C18.72 4.42 18.16 4 17.5 4h-11c-.66 0-1.21.42-1.42 1.01L3 11v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 15c-.83 0-1.5-.67-1.5-1.5S5.67 12 6.5 12s1.5.67 1.5 1.5S7.33 15 6.5 15zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 10l1.5-4.5h11L19 10H5z"/>
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent truncate">
                  Ino-Service
                </h1>
                <p className="text-xs md:text-sm text-gray-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 flex-shrink-0" />
                  <span className="hidden sm:inline">Gestion financière propulsée par IA</span>
                  <span className="sm:hidden">IA Financière</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              <UserSelector currentUser={currentUser} onUserChange={handleUserChange} />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation tabs */}
      <div className="bg-white border-b sticky top-0 z-10 backdrop-blur-sm bg-white/95 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 overflow-x-auto">
          <nav className="flex gap-0 min-w-max">
            {[
              { id: 'accueil' as const, label: 'Accueil', shortLabel: 'Accueil', icon: HomeIcon },
              { id: 'courses' as const, label: 'Courses', shortLabel: 'Courses', icon: Bus },
              { id: 'vehicules' as const, label: 'Véhicules', shortLabel: 'Véhicule', icon: Car },
              { id: 'finances' as const, label: 'Finances', shortLabel: 'Finances', icon: DollarSign },
              { id: 'insights' as const, label: 'Insights', shortLabel: 'Insights', icon: Lightbulb },
              { id: 'scan' as const, label: 'Scanner', shortLabel: 'Scanner', icon: Upload },
              { id: 'rapports' as const, label: 'Rapports', shortLabel: 'Rapports', icon: FileText },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 md:py-4 px-3 md:px-5 font-semibold text-xs md:text-sm transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-b-[3px] border-blue-600 text-blue-600'
                    : 'border-b-[3px] border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50/50'
                }`}
              >
                <div className="flex items-center gap-1.5 md:gap-2">
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </div>
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="py-3 md:py-4 px-3 md:px-5 font-semibold text-xs md:text-sm text-red-500 hover:text-red-600 hover:bg-red-50/50 transition-all whitespace-nowrap border-b-[3px] border-transparent"
            >
              <div className="flex items-center gap-1.5 md:gap-2">
                <LogOut className="w-4 h-4" />
                <span>Quitter</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {activeTab === 'accueil' && (
          <Dashboard key={`accueil-${refreshDashboard}`} userId={currentUser.id} userName={currentUser.name} />
        )}

        {activeTab === 'courses' && (
          <Tournees userId={currentUser.id} />
        )}

        {activeTab === 'vehicules' && (
          <Vehicules userId={currentUser.id} />
        )}

        {activeTab === 'finances' && (
          <FinancialDashboard key={`finances-${refreshDashboard}`} userId={currentUser.id} />
        )}

        {activeTab === 'insights' && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-4 md:mb-6 animate-fade-in">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                🤖 Assistant Financier IA
              </h2>
              <p className="text-sm md:text-base text-gray-600">
                💬 Posez vos questions sur vos finances, vos dépenses, ou obtenez des conseils personnalisés
              </p>
            </div>
            <div className="animate-fade-in animate-delay-100">
              <ChatBot userId={currentUser.id} userContext={userContext} />
            </div>
          </div>
        )}

        {activeTab === 'scan' && (
          <div className="max-w-2xl mx-auto">
            <ReceiptScanner userId={currentUser.id} onSuccess={handleScanSuccess} />

            {/* Instructions */}
            <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-3">
                    💡 Conseils pour de meilleurs résultats
                  </h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                      Assurez-vous que la facture est bien éclairée
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                      Évitez les reflets et les ombres
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                      Prenez la photo bien droite (pas en angle)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                      L'IA classifiera automatiquement la dépense
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rapports' && (
          <Rapports userId={currentUser.id} />
        )}

        {activeTab === 'chat' && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-4 md:mb-6 animate-fade-in">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                🤖 Assistant Financier IA
              </h2>
              <p className="text-sm md:text-base text-gray-600">
                💬 Posez vos questions sur vos finances, vos dépenses, ou obtenez des conseils personnalisés
              </p>
            </div>
            <div className="animate-fade-in animate-delay-100">
              <ChatBot userId={currentUser.id} userContext={userContext} />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            {/* Column 1 */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Ino-Service</h3>
              <p className="text-sm text-gray-600">
                Gestion financière intelligente propulsée par l'intelligence artificielle Claude AI
              </p>
            </div>

            {/* Column 2 */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Fonctionnalités</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Scan automatique de factures</li>
                <li>• Dashboard interactif</li>
                <li>• Chatbot IA conversationnel</li>
                <li>• Détection d'anomalies</li>
              </ul>
            </div>

            {/* Column 3 */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Technologies</h3>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Next.js 16</span>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">Claude AI</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Supabase</span>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">TypeScript</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 text-center text-sm text-gray-600">
            <p>Développé avec ❤️ par <span className="font-semibold text-blue-600">Brams AI Agency</span></p>
            <p className="mt-1 text-xs text-gray-500">
              © 2025-2026 • Tous droits réservés
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
