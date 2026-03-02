'use client';

import { useState, useEffect, ElementType } from 'react';
import { User as UserIcon, Lock, Sun, Moon, Monitor, Eye, EyeOff, X, Check, Loader2 } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase-browser';

type Theme = 'light' | 'dark' | 'system';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  transport_company?: string;
  status?: string;
}

interface UserSelectorProps {
  currentUser: User | null;
  onUserChange: (user: User) => void;
}

export default function UserSelector({ currentUser }: UserSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [theme, setTheme] = useState<Theme>('system');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    const saved = (localStorage.getItem('app-theme') as Theme) || 'system';
    setTheme(saved);
    applyTheme(saved);
  }, []);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === 'dark') {
      root.classList.add('dark');
    } else if (t === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) root.classList.add('dark');
      else root.classList.remove('dark');
    }
  };

  const handleThemeChange = (t: Theme) => {
    setTheme(t);
    localStorage.setItem('app-theme', t);
    applyTheme(t);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPwdError('');
    setPwdSuccess(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');

    if (newPassword.length < 6) {
      setPwdError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('Les mots de passe ne correspondent pas');
      return;
    }

    setPwdLoading(true);
    try {
      const { error } = await supabaseBrowser.auth.updateUser({ password: newPassword });
      if (error) {
        setPwdError(error.message);
      } else {
        setPwdSuccess(true);
        setTimeout(() => closePasswordModal(), 1500);
      }
    } catch {
      setPwdError('Erreur inattendue. Réessayez.');
    } finally {
      setPwdLoading(false);
    }
  };

  if (!currentUser) return null;

  const statusLabel =
    currentUser.status === 'owner' ? 'Propriétaire'
    : currentUser.status === 'employee' ? 'Employé'
    : currentUser.status === 'renter' ? 'Locataire'
    : '';

  const themeOptions: { value: Theme; label: string; Icon: ElementType }[] = [
    { value: 'light', label: 'Clair', Icon: Sun },
    { value: 'dark', label: 'Sombre', Icon: Moon },
    { value: 'system', label: 'Système', Icon: Monitor },
  ];

  return (
    <>
      <div className="relative">
        {/* Bouton utilisateur */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-2 md:px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors btn-press"
        >
          <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 font-semibold text-xs md:text-sm">
              {currentUser.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="text-left hidden sm:block min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{currentUser.name}</p>
            <p className="text-xs text-gray-500 truncate">{currentUser.transport_company || 'Transport'}</p>
          </div>
          <UserIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </button>

        {/* Dropdown profil */}
        {isOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 mt-2 w-screen max-w-xs md:w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-30 mx-2 md:mx-0 animate-scale-in">
              <div className="p-4 space-y-3">

                {/* Infos utilisateur */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-base">{currentUser.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{currentUser.name}</p>
                    <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                  </div>
                </div>

                {/* Détails */}
                {(currentUser.phone || currentUser.transport_company || statusLabel) && (
                  <div className="space-y-1.5 text-sm border-t pt-3">
                    {currentUser.phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Téléphone</span>
                        <span className="text-gray-900 font-medium">{currentUser.phone}</span>
                      </div>
                    )}
                    {currentUser.transport_company && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Compagnie</span>
                        <span className="text-gray-900 font-medium">{currentUser.transport_company}</span>
                      </div>
                    )}
                    {statusLabel && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Statut</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{statusLabel}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Apparence */}
                <div className="border-t pt-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Apparence</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {themeOptions.map(({ value, label, Icon }) => (
                      <button
                        key={value}
                        onClick={() => handleThemeChange(value)}
                        className={`flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-medium transition-all border ${
                          theme === value
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'text-gray-500 hover:bg-gray-50 border-transparent'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Changer mot de passe */}
                <div className="border-t pt-3">
                  <button
                    onClick={() => { setIsOpen(false); setShowPasswordModal(true); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Lock className="w-4 h-4 text-gray-400" />
                    Changer le mot de passe
                  </button>
                </div>

              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal changement de mot de passe */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-base font-bold text-gray-900">Changer le mot de passe</h3>
              <button onClick={closePasswordModal} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nouveau mot de passe</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 caractères"
                    className="w-full px-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirmer le mot de passe</label>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>

              {pwdError && (
                <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{pwdError}</p>
              )}
              {pwdSuccess && (
                <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">
                  <Check className="w-4 h-4" />
                  Mot de passe modifié avec succès !
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={pwdLoading || pwdSuccess}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center gap-2 transition-colors"
                >
                  {pwdLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Modification...</>
                  ) : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
