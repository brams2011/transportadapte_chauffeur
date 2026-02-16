'use client';

import { useState, useEffect, useRef } from 'react';
import { Lock, Mail, ArrowRight, UserPlus, Phone, Building2, Briefcase, Eye, EyeOff, Shield, ArrowLeft, RefreshCw } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase-browser';

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

type AuthStep = 'credentials' | 'otp';

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [authStep, setAuthStep] = useState<AuthStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [transportCompany, setTransportCompany] = useState('');
  const [status, setStatus] = useState<'owner' | 'employee' | 'renter'>('owner');
  const [showPassword, setShowPassword] = useState(false);

  // OTP state
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpPhone, setOtpPhone] = useState(''); // numéro brut pour la vérification
  const [maskedPhone, setMaskedPhone] = useState('');
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Countdown pour le renvoi
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Auto-focus sur le premier input OTP
  useEffect(() => {
    if (authStep === 'otp') {
      otpInputRefs.current[0]?.focus();
    }
  }, [authStep]);

  const completeLogin = (user: User) => {
    localStorage.setItem('transport_current_user', JSON.stringify(user));
    onLogin(user);
  };

  const sendOtp = async (phoneNumber: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber }),
      });
      const data = await res.json();

      if (data.success) {
        setMaskedPhone(data.maskedPhone);
        setResendCooldown(60);
        return true;
      } else {
        setError(data.error || 'Impossible d\'envoyer le code SMS');
        return false;
      }
    } catch {
      setError('Erreur de connexion au service SMS');
      return false;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Veuillez entrer votre courriel et mot de passe');
      return;
    }

    setLoading(true);

    try {
      // Étape 1 : Authentification Supabase avec vérification du mot de passe
      const { data: authData, error: authError } = await supabaseBrowser.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Courriel ou mot de passe incorrect');
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Veuillez confirmer votre courriel avant de vous connecter');
        } else {
          setError(authError.message);
        }
        return;
      }

      if (!authData.user) {
        setError('Erreur de connexion. Veuillez réessayer.');
        return;
      }

      // Récupérer le profil utilisateur
      const res = await fetch(`/api/users?email=${encodeURIComponent(email)}`);
      const profileData = await res.json();

      let user: User;
      if (profileData.success && profileData.user) {
        user = profileData.user;
      } else {
        user = {
          id: authData.user.id,
          name: authData.user.user_metadata?.name || email.split('@')[0],
          email: authData.user.email!,
        };
      }

      // Étape 2 : Si le chauffeur a un téléphone, envoyer l'OTP
      const userPhone = user.phone || profileData?.user?.phone;
      if (userPhone) {
        setPendingUser(user);
        setOtpPhone(userPhone);
        const sent = await sendOtp(userPhone);
        if (sent) {
          setAuthStep('otp');
        }
      } else {
        // Pas de téléphone — connexion directe
        completeLogin(user);
      }
    } catch {
      setError('Impossible de se connecter au serveur.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Gestion du copier-coller d'un code complet
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newCode = [...otpCode];
      digits.forEach((d, i) => {
        if (index + i < 6) newCode[index + i] = d;
      });
      setOtpCode(newCode);
      const nextIndex = Math.min(index + digits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    if (value && !/^\d$/.test(value)) return;

    const newCode = [...otpCode];
    newCode[index] = value;
    setOtpCode(newCode);

    // Auto-avance au prochain champ
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const code = otpCode.join('');
    if (code.length !== 6) {
      setError('Veuillez entrer le code à 6 chiffres');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: otpPhone, code }),
      });
      const data = await res.json();

      if (data.success && pendingUser) {
        completeLogin(pendingUser);
      } else {
        setError(data.error || 'Code invalide');
        // Reset le code si erreur
        setOtpCode(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
      }
    } catch {
      setError('Erreur de vérification');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setLoading(true);
    await sendOtp(otpPhone);
    setOtpCode(['', '', '', '', '', '']);
    otpInputRefs.current[0]?.focus();
    setLoading(false);
  };

  const handleBackToCredentials = () => {
    setAuthStep('credentials');
    setOtpCode(['', '', '', '', '', '']);
    setPendingUser(null);
    setOtpPhone('');
    setMaskedPhone('');
    setError('');
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabaseBrowser.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone: phone || null,
            transport_company: transportCompany || null,
            status,
          },
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('Un compte existe déjà avec ce courriel');
        } else {
          setError(authError.message);
        }
        return;
      }

      if (!authData.user) {
        setError('Erreur lors de la création du compte');
        return;
      }

      const companyName = transportCompany || 'Transport';
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: authData.user.id,
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
      } else if (authData.session) {
        const user: User = {
          id: authData.user.id,
          name,
          email,
          phone: phone || undefined,
          transport_company: companyName,
          status,
        };
        localStorage.setItem('transport_current_user', JSON.stringify(user));
        onLogin(user);
      } else {
        setError('');
        setIsSignUp(false);
        setError('Compte créé! Vérifiez votre courriel pour confirmer, puis connectez-vous.');
      }
    } catch {
      setError('Impossible de se connecter au serveur.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Écran OTP
  // ==========================================
  if (authStep === 'otp') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

            {/* Green Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-10 text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">
                Vérification SMS
              </h1>
              <p className="text-green-200 text-sm font-medium">
                Code envoyé au {maskedPhone}
              </p>
            </div>

            {/* OTP Form */}
            <form onSubmit={handleVerifyOtp} className="p-8 space-y-6">

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-6">
                  Entrez le code à 6 chiffres reçu par SMS
                </p>

                {/* 6 digit inputs */}
                <div className="flex justify-center gap-2">
                  {otpCode.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { otpInputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 bg-gray-50 focus:bg-white"
                    />
                  ))}
                </div>
              </div>

              {/* Verify button */}
              <button
                type="submit"
                disabled={loading || otpCode.join('').length !== 6}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-600/30 hover:shadow-green-700/40 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Vérifier le code
                    <Shield className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Resend + Back buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleBackToCredentials}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                  className="text-sm font-semibold text-green-600 hover:text-green-700 transition-colors flex items-center gap-1 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <RefreshCw className="w-4 h-4" />
                  {resendCooldown > 0 ? `Renvoyer (${resendCooldown}s)` : 'Renvoyer le code'}
                </button>
              </div>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Propulsé par Claude AI &bull; Brams AI Agency
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // Écran Connexion / Inscription
  // ==========================================
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
              <div className={`px-4 py-3 rounded-xl text-sm ${
                error.includes('Compte créé')
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
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
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all text-gray-900 placeholder-gray-400"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {isSignUp && (
                <p className="text-xs text-gray-500 mt-1.5">Minimum 6 caractères</p>
              )}
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
