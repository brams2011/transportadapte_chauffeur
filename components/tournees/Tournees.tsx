'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Plus, Calendar, X, Trash2, Loader2, AlertCircle, Clock, Bus, Car } from 'lucide-react';

interface Tournee {
  id: string;
  date: string;
  type: string;
  montant: number;
  heures?: number;
  compagnie?: string;
  notes?: string;
  transport_type?: string;
}

interface TourneesProps {
  userId: string;
}

export default function Tournees({ userId }: TourneesProps) {
  const [tournees, setTournees] = useState<Tournee[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTournee, setNewTournee] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Revenu de tournée',
    montant: '',
    heures: '',
    compagnie: '',
    notes: '',
    transport_type: 'adapte'
  });

  // Charger les tournées depuis Supabase
  useEffect(() => {
    fetchTournees();
  }, [userId]);

  const fetchTournees = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tournees?user_id=${encodeURIComponent(userId)}`);
      const data = await res.json();

      if (data.success && data.tournees) {
        setTournees(data.tournees);
      } else {
        // Fallback localStorage si Supabase échoue
        const saved = localStorage.getItem(`tournees_${userId}`);
        if (saved) {
          setTournees(JSON.parse(saved));
        }
        if (data.error) {
          setError(`Erreur Supabase: ${data.error}. Données locales chargées.`);
        }
      }
    } catch {
      // Fallback localStorage si pas de connexion
      const saved = localStorage.getItem(`tournees_${userId}`);
      if (saved) {
        setTournees(JSON.parse(saved));
      }
      setError('Impossible de se connecter au serveur. Données locales chargées.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('fr-CA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTournee.montant) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/tournees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          date: newTournee.date,
          type: newTournee.type,
          montant: newTournee.montant,
          heures: newTournee.heures ? parseFloat(newTournee.heures) : null,
          compagnie: newTournee.compagnie || null,
          notes: newTournee.notes || null,
          transport_type: newTournee.transport_type,
        }),
      });

      const data = await res.json();

      if (data.success && data.tournee) {
        setTournees(prev => [data.tournee, ...prev]);
      } else {
        // Fallback: ajouter localement
        const tournee: Tournee = {
          id: `local-${Date.now()}`,
          date: newTournee.date,
          type: newTournee.type,
          montant: parseFloat(newTournee.montant),
          heures: newTournee.heures ? parseFloat(newTournee.heures) : undefined,
          compagnie: newTournee.compagnie || undefined,
          notes: newTournee.notes || undefined,
          transport_type: newTournee.transport_type,
        };
        setTournees(prev => {
          const updated = [tournee, ...prev];
          localStorage.setItem(`tournees_${userId}`, JSON.stringify(updated));
          return updated;
        });
        setError('Sauvegardé localement (Supabase indisponible)');
      }

      setNewTournee({
        date: new Date().toISOString().split('T')[0],
        type: 'Revenu de tournée',
        montant: '',
        heures: '',
        compagnie: '',
        notes: '',
        transport_type: 'adapte'
      });
      setShowForm(false);
    } catch {
      // Fallback local
      const tournee: Tournee = {
        id: `local-${Date.now()}`,
        date: newTournee.date,
        type: newTournee.type,
        montant: parseFloat(newTournee.montant),
        compagnie: newTournee.compagnie || undefined,
        notes: newTournee.notes || undefined,
        transport_type: newTournee.transport_type,
      };
      setTournees(prev => {
        const updated = [tournee, ...prev];
        localStorage.setItem(`tournees_${userId}`, JSON.stringify(updated));
        return updated;
      });
      setError('Sauvegardé localement (pas de connexion)');
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/tournees?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        setTournees(prev => prev.filter(t => t.id !== id));
      } else {
        setError('Erreur lors de la suppression');
      }
    } catch {
      // Fallback: supprimer localement
      setTournees(prev => {
        const updated = prev.filter(t => t.id !== id);
        localStorage.setItem(`tournees_${userId}`, JSON.stringify(updated));
        return updated;
      });
    }
  };

  const totalRevenu = tournees.reduce((sum, t) => sum + t.montant, 0);
  const totalHeures = tournees.reduce((sum, t) => sum + (t.heures || 0), 0);
  const tauxHoraire = totalHeures > 0 ? totalRevenu / totalHeures : 0;
  const totalAdapte = tournees.filter(t => (t.transport_type || 'adapte') === 'adapte').reduce((sum, t) => sum + t.montant, 0);
  const totalRegulier = tournees.filter(t => t.transport_type === 'regulier').reduce((sum, t) => sum + t.montant, 0);
  const nbAdapte = tournees.filter(t => (t.transport_type || 'adapte') === 'adapte').length;
  const nbRegulier = tournees.filter(t => t.transport_type === 'regulier').length;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-600">Chargement des tournées...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Error banner */}
      {error && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2 text-sm text-amber-800 animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-amber-600 hover:text-amber-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2.5 rounded-xl">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Courses</h2>
            <p className="text-sm text-gray-500">Gestion des tournées et revenus</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all active:scale-[0.97]"
        >
          <Plus className="w-4 h-4" />
          Ajouter une tournée
        </button>
      </div>

      {/* Total card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 mb-6 text-white shadow-lg">
        <p className="text-sm text-blue-200 font-medium">Total des revenus</p>
        <p className="text-3xl font-bold mt-1">{totalRevenu.toFixed(2)} $</p>
        <div className="flex items-center gap-4 mt-1 flex-wrap">
          <p className="text-sm text-blue-200">{tournees.length} tournée{tournees.length > 1 ? 's' : ''}</p>
          {totalHeures > 0 && (
            <>
              <span className="text-blue-300">•</span>
              <p className="text-sm text-blue-200">{totalHeures.toFixed(1)}h travaillées</p>
              <span className="text-blue-300">•</span>
              <p className="text-sm font-semibold text-white">{tauxHoraire.toFixed(2)} $/h</p>
            </>
          )}
        </div>
        {/* Ventilation Adapté / Régulier */}
        <div className="flex gap-4 mt-3 pt-3 border-t border-white/20">
          <div className="flex items-center gap-2">
            <Bus className="w-4 h-4 text-blue-200" />
            <div>
              <p className="text-xs text-blue-200">Adapté</p>
              <p className="text-sm font-bold">{totalAdapte.toFixed(2)} $ <span className="text-xs font-normal text-blue-300">({nbAdapte})</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-green-300" />
            <div>
              <p className="text-xs text-green-200">Régulier</p>
              <p className="text-sm font-bold">{totalRegulier.toFixed(2)} $ <span className="text-xs font-normal text-blue-300">({nbRegulier})</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Add form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md flex flex-col max-h-[90vh] animate-scale-in">
            {/* Header fixe */}
            <div className="flex items-center justify-between p-5 border-b shrink-0">
              <h3 className="text-lg font-bold text-gray-900">Nouvelle tournée</h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {/* Contenu scrollable */}
            <form onSubmit={handleAdd} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto flex-1 p-5 space-y-4">
                {/* Type de transport */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Type de transport</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewTournee({ ...newTournee, transport_type: 'adapte' })}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm border-2 transition-all ${
                        newTournee.transport_type === 'adapte'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <Bus className="w-4 h-4" />
                      Transport Adapté
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTournee({ ...newTournee, transport_type: 'regulier' })}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm border-2 transition-all ${
                        newTournee.transport_type === 'regulier'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <Car className="w-4 h-4" />
                      Transport Régulier
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={newTournee.date}
                      onChange={(e) => setNewTournee({ ...newTournee, date: e.target.value })}
                      className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Montant ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      value={newTournee.montant}
                      onChange={(e) => setNewTournee({ ...newTournee, montant: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Heures travaillées</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      value={newTournee.heures}
                      onChange={(e) => setNewTournee({ ...newTournee, heures: e.target.value })}
                      placeholder="Ex: 8"
                      className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type</label>
                  <select
                    value={newTournee.type}
                    onChange={(e) => setNewTournee({ ...newTournee, type: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  >
                    <option>Revenu de tournée</option>
                    <option>Pourboire</option>
                    <option>Bonus</option>
                    <option>Autre revenu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Compagnie (optionnel)</label>
                  <input
                    type="text"
                    value={newTournee.compagnie}
                    onChange={(e) => setNewTournee({ ...newTournee, compagnie: e.target.value })}
                    placeholder="Ex: STM, RTL..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes (optionnel)</label>
                  <textarea
                    value={newTournee.notes}
                    onChange={(e) => setNewTournee({ ...newTournee, notes: e.target.value })}
                    placeholder="Notes additionnelles..."
                    rows={2}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 resize-none"
                  />
                </div>
              </div>
              {/* Footer fixe avec boutons toujours visibles */}
              <div className="p-4 border-t shrink-0 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-all active:scale-[0.98]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-purple-600/30 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    'Enregistrer'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {tournees.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucune tournée enregistrée</p>
            <p className="text-sm text-gray-400 mt-1">Cliquez sur &quot;Ajouter une tournée&quot; pour commencer</p>
          </div>
        ) : (
          tournees.map((tournee, index) => (
            <div
              key={tournee.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:shadow-md hover:border-gray-300 transition-all animate-fade-in group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border ${
                tournee.transport_type === 'regulier'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-blue-50 border-blue-200'
              }`}>
                {tournee.transport_type === 'regulier'
                  ? <Car className="w-5 h-5 text-green-600" />
                  : <Bus className="w-5 h-5 text-blue-600" />
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">{formatDate(tournee.date)}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                    tournee.transport_type === 'regulier'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {tournee.transport_type === 'regulier' ? 'Régulier' : 'Adapté'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{tournee.type}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {tournee.heures && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {tournee.heures}h
                    </span>
                  )}
                  {tournee.compagnie && (
                    <span className="text-xs text-blue-600 font-medium">{tournee.compagnie}</span>
                  )}
                </div>
              </div>

              {/* Amount */}
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold text-blue-700">{tournee.montant.toFixed(2)} $</p>
              </div>

              {/* Delete button */}
              <button
                onClick={() => handleDelete(tournee.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg transition-all"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
