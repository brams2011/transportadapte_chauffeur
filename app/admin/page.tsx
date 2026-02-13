'use client';

import { useState, useEffect } from 'react';
import { Shield, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import AdminDashboard from '@/components/admin/AdminDashboard';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Vérifier la session existante au chargement
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const session = localStorage.getItem('transport_admin_session');
    if (session) {
      try {
        const { token, timestamp } = JSON.parse(session);
        const res = await fetch(`/api/admin/login?token=${token}&ts=${timestamp}`);
        const data = await res.json();
        if (data.valid) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('transport_admin_session');
        }
      } catch {
        localStorage.removeItem('transport_admin_session');
      }
    }
    setIsLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('transport_admin_session', JSON.stringify({
          token: data.token,
          timestamp: data.timestamp,
          expiresAt: data.expiresAt,
        }));
        setIsAuthenticated(true);
      } else {
        setError(data.error || 'Identifiants incorrects');
      }
    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('transport_admin_session');
    setIsAuthenticated(false);
    setEmail('');
    setPassword('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  // ─── Page de Login Admin ───────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="bg-blue-600 p-4 rounded-2xl inline-block mb-4 shadow-lg shadow-blue-600/20">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Administration</h1>
          <p className="text-gray-500 text-sm mt-1">Transport Adapté - Accès réservé</p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleLogin} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 shadow-2xl">
          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Email administrateur</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@transport.com"
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-200 placeholder-gray-600 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Mot de passe</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mot de passe"
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-200 placeholder-gray-600 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loginLoading || !email || !password}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loginLoading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Connexion...</>
            ) : (
              <><Shield className="w-5 h-5" /> Se connecter</>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-700 mt-6">
          Accès réservé aux administrateurs autorisés
        </p>
      </div>
    </div>
  );
}
