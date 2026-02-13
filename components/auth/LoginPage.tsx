'use client';

import { useState } from 'react';
import { Lock, Mail, ArrowRight, UserPlus, Phone, Building2, Briefcase } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  transport_company?: string;
  status?: string;
}

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [transportCompany, setTransportCompany] = useState('');
  const [status, setStatus] = useState<'owner' | 'employee' | 'renter'>('owner');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Chercher l'utilisateur sur Supabase
      const res = await fetch(`/api/users?email=${encodeURIComponent(email)}`);
      const data = await res.json();

      if (data.success && data.user) {
        localStorage.setItem('transport_current_user', JSON.stringify(data.user));
        onLogin(data.user);
      } else if (email === 'demo@transport.com') {
        // Utilisateur démo
        const demoUser: User = {
          id: 'demo-user-123',
          name: 'Utilisateur Démo',
          email: 'demo@transport.com',
          phone: '514-555-0000',
          transport_company: 'Transport Adapté',
          status: 'owner'
        };
        localStorage.setItem('transport_current_user', JSON.stringify(demoUser));
        onLogin(demoUser);
      } else {
        // Fallback localStorage
        const savedUsers = localStorage.getItem('transport_users');
        const users: User[] = savedUsers ? JSON.parse(savedUsers) : [];
        const foundUser = users.find(u => u.email === email);

        if (foundUser) {
          localStorage.setItem('transport_current_user', JSON.stringify(foundUser));
          onLogin(foundUser);
        } else {
          setError('Aucun compte trouvé avec ce courriel. Créez un compte.');
        }
      }
    } catch {
      // Fallback localStorage si pas de connexion
      const savedUsers = localStorage.getItem('transport_users');
      const users: User[] = savedUsers ? JSON.parse(savedUsers) : [];
      const foundUser = users.find(u => u.email === email);

      if (foundUser) {
        localStorage.setItem('transport_current_user', JSON.stringify(foundUser));
        onLogin(foundUser);
      } else {
        setError('Impossible de se connecter au serveur.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);

    const companyName = transportCompany || 'Transport';

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: phone || null,
          transport_company: companyName,
          status,
        }),
      });

      const data = await res.json();

      if (data.success && data.user) {
        localStorage.setItem('transport_current_user', JSON.stringify(data.user));
        onLogin(data.user);
      } else if (res.status === 409) {
        setError('Un compte existe déjà avec ce courriel');
      } else {
        setError(data.error || 'Erreur lors de la création du compte');
      }
    } catch {
      // Fallback localStorage
      const savedUsers = localStorage.getItem('transport_users');
      const users: User[] = savedUsers ? JSON.parse(savedUsers) : [];

      if (users.find(u => u.email === email)) {
        setError('Un compte existe déjà avec ce courriel');
        setLoading(false);
        return;
      }

      const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        phone: phone || undefined,
        transport_company: companyName,
        status,
      };

      const updatedUsers = [...users, newUser];
      localStorage.setItem('transport_users', JSON.stringify(updatedUsers));
      localStorage.setItem('transport_current_user', JSON.stringify(newUser));
      onLogin(newUser);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* Blue Header */}
          <div className="bg-blue-600 px-8 py-10 text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {isSignUp ? 'Inscription' : 'Connexion'}
            </h1>
            <p className="text-blue-200 text-sm font-medium">
              Gestion Transport
            </p>
          </div>

          {/* Form */}
          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="p-8 space-y-4">

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Name field (signup only) */}
            {isSignUp && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom complet *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <UserPlus className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jean Tremblay"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>
            )}

            {/* Email field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Courriel *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@exemple.com"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all text-gray-900 placeholder-gray-400"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mot de passe *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all text-gray-900 placeholder-gray-400"
                  required
                />
              </div>
            </div>

            {/* Signup-only fields */}
            {isSignUp && (
              <>
                {/* Phone field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Phone className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="514-555-1234"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Company field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Compagnie de transport
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Building2 className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={transportCompany}
                      onChange={(e) => setTransportCompany(e.target.value)}
                      placeholder="Ex: STM, RTL, Transdev..."
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Status selector */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Statut
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'owner' as const, label: 'Propriétaire', icon: Briefcase },
                      { value: 'employee' as const, label: 'Employé', icon: UserPlus },
                      { value: 'renter' as const, label: 'Locataire', icon: Building2 },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setStatus(opt.value)}
                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all text-center ${
                          status === opt.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <opt.icon className="w-5 h-5" />
                        <span className="text-xs font-semibold">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 hover:shadow-blue-700/40 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp ? "S'inscrire" : 'Se connecter'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Toggle link */}
            <p className="text-center text-sm text-gray-500 pt-2">
              {isSignUp ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
              >
                {isSignUp ? 'Se connecter' : "S'inscrire"}
              </button>
            </p>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Propulsé par Claude AI &bull; Brams AI Agency
        </p>
      </div>
    </div>
  );
}
