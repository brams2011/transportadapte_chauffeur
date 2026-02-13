'use client';

import { useState, useEffect } from 'react';
import {
  Car, Plus, ArrowLeft, Gauge, Wrench, DollarSign, Trash2, Edit3,
  Save, X, Calendar, AlertTriangle, CheckCircle, Clock, Loader2, ChevronRight
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────
interface Vehicule {
  id: string;
  nom: string;
  marque?: string;
  modele?: string;
  annee?: number;
  plaque?: string;
  vin?: string;
  couleur?: string;
  kilometrage_actuel: number;
  date_achat?: string;
  statut: string;
  created_at: string;
}

interface Entretien {
  id: string;
  vehicule_id: string;
  type: string;
  description?: string;
  date_effectue?: string;
  date_prochain?: string;
  km_effectue?: number;
  km_prochain?: number;
  cout: number;
  statut: string;
  notes?: string;
  created_at: string;
}

interface KmLog {
  id: string;
  vehicule_id: string;
  date: string;
  kilometrage: number;
  notes?: string;
}

interface VehiculesProps {
  userId: string;
}

// ─── Constantes ──────────────────────────────────────────────────
const TYPES_ENTRETIEN = [
  { value: 'huile', label: "Changement d'huile", intervalKm: 8000 },
  { value: 'pneus', label: 'Pneus (rotation/changement)', intervalKm: 40000 },
  { value: 'freins', label: 'Freins', intervalKm: 50000 },
  { value: 'inspection', label: 'Inspection mécanique', intervalKm: null },
  { value: 'filtre', label: 'Filtre à air/habitacle', intervalKm: 20000 },
  { value: 'batterie', label: 'Batterie', intervalKm: null },
  { value: 'transmission', label: 'Transmission/fluides', intervalKm: 60000 },
  { value: 'autre', label: 'Autre', intervalKm: null },
];

// ─── Composant Principal ─────────────────────────────────────────
export default function Vehicules({ userId }: VehiculesProps) {
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [selectedVehicule, setSelectedVehicule] = useState<Vehicule | null>(null);
  const [entretiens, setEntretiens] = useState<Entretien[]>([]);
  const [kmLogs, setKmLogs] = useState<KmLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddVehicule, setShowAddVehicule] = useState(false);
  const [showAddEntretien, setShowAddEntretien] = useState(false);
  const [saving, setSaving] = useState(false);

  // Formulaire véhicule
  const [formVehicule, setFormVehicule] = useState({
    nom: '', marque: '', modele: '', annee: '', plaque: '', vin: '', couleur: '', kilometrage_actuel: '', date_achat: ''
  });

  // Formulaire entretien
  const [formEntretien, setFormEntretien] = useState({
    type: 'huile', description: '', date_effectue: '', date_prochain: '', km_effectue: '', km_prochain: '', cout: '', statut: 'planifie', notes: ''
  });

  // Formulaire kilométrage rapide
  const [newKm, setNewKm] = useState('');

  // ─── Fetch véhicules ──────────────────────────────────────────
  useEffect(() => {
    fetchVehicules();
  }, [userId]);

  useEffect(() => {
    if (selectedVehicule) {
      fetchEntretiens(selectedVehicule.id);
      fetchKmLogs(selectedVehicule.id);
    }
  }, [selectedVehicule?.id]);

  const fetchVehicules = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vehicules?user_id=${userId}`);
      const data = await res.json();
      if (data.success) setVehicules(data.vehicules);
    } catch (err) {
      console.error('Error fetching vehicules:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEntretiens = async (vehiculeId: string) => {
    try {
      const res = await fetch(`/api/vehicules/entretiens?vehicule_id=${vehiculeId}`);
      const data = await res.json();
      if (data.success) setEntretiens(data.entretiens);
    } catch (err) {
      console.error('Error fetching entretiens:', err);
    }
  };

  const fetchKmLogs = async (vehiculeId: string) => {
    try {
      const res = await fetch(`/api/vehicules/kilometrage?vehicule_id=${vehiculeId}`);
      const data = await res.json();
      if (data.success) setKmLogs(data.logs);
    } catch (err) {
      console.error('Error fetching km logs:', err);
    }
  };

  // ─── Actions ───────────────────────────────────────────────────
  const handleAddVehicule = async () => {
    if (!formVehicule.nom.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/vehicules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, ...formVehicule }),
      });
      const data = await res.json();
      if (data.success) {
        setVehicules(prev => [data.vehicule, ...prev]);
        setShowAddVehicule(false);
        setFormVehicule({ nom: '', marque: '', modele: '', annee: '', plaque: '', vin: '', couleur: '', kilometrage_actuel: '', date_achat: '' });
      }
    } catch (err) {
      console.error('Error adding vehicule:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVehicule = async (id: string) => {
    if (!confirm('Supprimer ce véhicule et tous ses entretiens?')) return;
    try {
      await fetch(`/api/vehicules?id=${id}`, { method: 'DELETE' });
      setVehicules(prev => prev.filter(v => v.id !== id));
      if (selectedVehicule?.id === id) setSelectedVehicule(null);
    } catch (err) {
      console.error('Error deleting vehicule:', err);
    }
  };

  const handleAddEntretien = async () => {
    if (!selectedVehicule || !formEntretien.type) return;
    setSaving(true);
    try {
      const res = await fetch('/api/vehicules/entretiens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicule_id: selectedVehicule.id,
          user_id: userId,
          ...formEntretien,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEntretiens(prev => [data.entretien, ...prev]);
        setShowAddEntretien(false);
        setFormEntretien({ type: 'huile', description: '', date_effectue: '', date_prochain: '', km_effectue: '', km_prochain: '', cout: '', statut: 'planifie', notes: '' });
      }
    } catch (err) {
      console.error('Error adding entretien:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkDone = async (entretien: Entretien) => {
    try {
      const res = await fetch('/api/vehicules/entretiens', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: entretien.id,
          statut: 'effectue',
          date_effectue: new Date().toISOString().split('T')[0],
          km_effectue: selectedVehicule?.kilometrage_actuel || 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEntretiens(prev => prev.map(e => e.id === entretien.id ? data.entretien : e));
      }
    } catch (err) {
      console.error('Error updating entretien:', err);
    }
  };

  const handleDeleteEntretien = async (id: string) => {
    try {
      await fetch(`/api/vehicules/entretiens?id=${id}`, { method: 'DELETE' });
      setEntretiens(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Error deleting entretien:', err);
    }
  };

  const handleSaveKm = async () => {
    if (!selectedVehicule || !newKm) return;
    setSaving(true);
    try {
      const res = await fetch('/api/vehicules/kilometrage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicule_id: selectedVehicule.id,
          user_id: userId,
          kilometrage: newKm,
          date: new Date().toISOString().split('T')[0],
        }),
      });
      const data = await res.json();
      if (data.success) {
        const km = parseFloat(newKm);
        setSelectedVehicule({ ...selectedVehicule, kilometrage_actuel: km });
        setVehicules(prev => prev.map(v => v.id === selectedVehicule.id ? { ...v, kilometrage_actuel: km } : v));
        setKmLogs(prev => [data.log, ...prev]);
        setNewKm('');
      }
    } catch (err) {
      console.error('Error saving km:', err);
    } finally {
      setSaving(false);
    }
  };

  // ─── Helpers ───────────────────────────────────────────────────
  const getEntretienBadge = (entretien: Entretien) => {
    if (entretien.statut === 'effectue') {
      return { color: 'bg-gray-100 text-gray-600', icon: CheckCircle, label: 'Effectué' };
    }

    const now = new Date();
    let isUrgent = false;
    let isWarning = false;

    if (entretien.date_prochain) {
      const diff = (new Date(entretien.date_prochain).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (diff < 0) isUrgent = true;
      else if (diff < 30) isWarning = true;
    }

    if (entretien.km_prochain && selectedVehicule) {
      const diff = entretien.km_prochain - selectedVehicule.kilometrage_actuel;
      if (diff < 0) isUrgent = true;
      else if (diff < 3000) isWarning = true;
    }

    if (isUrgent) return { color: 'bg-red-100 text-red-700', icon: AlertTriangle, label: 'En retard' };
    if (isWarning) return { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Bientôt' };
    return { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'OK' };
  };

  const getProchainEntretien = (vehiculeId: string) => {
    const upcoming = entretiens
      .filter(e => e.vehicule_id === vehiculeId && e.statut === 'planifie')
      .sort((a, b) => {
        if (a.date_prochain && b.date_prochain) return a.date_prochain.localeCompare(b.date_prochain);
        return 0;
      });
    return upcoming[0];
  };

  const totalCouts = entretiens
    .filter(e => e.statut === 'effectue')
    .reduce((sum, e) => sum + (e.cout || 0), 0);

  const formatKm = (km: number) => km.toLocaleString('fr-CA');

  // ─── Rendu ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // VUE DÉTAIL D'UN VÉHICULE
  // ═══════════════════════════════════════════════════════════════
  if (selectedVehicule) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedVehicule(null)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </button>
          <button
            onClick={() => handleDeleteVehicule(selectedVehicule.id)}
            className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Fiche véhicule */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <Car className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{selectedVehicule.nom}</h2>
              <p className="text-gray-600">
                {[selectedVehicule.marque, selectedVehicule.modele, selectedVehicule.annee].filter(Boolean).join(' ') || 'Aucune info'}
              </p>
              <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-500">
                {selectedVehicule.plaque && (
                  <span className="bg-gray-100 px-2.5 py-1 rounded-lg font-mono font-semibold">{selectedVehicule.plaque}</span>
                )}
                {selectedVehicule.couleur && <span>Couleur: {selectedVehicule.couleur}</span>}
                {selectedVehicule.vin && <span className="text-xs">VIN: {selectedVehicule.vin}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Cards résumé */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Gauge className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-gray-500">Kilométrage</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{formatKm(selectedVehicule.kilometrage_actuel)} km</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Wrench className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-semibold text-gray-500">Entretiens</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{entretiens.filter(e => e.statut === 'planifie').length} planifiés</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-xs font-semibold text-gray-500">Coûts total</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{totalCouts.toFixed(2)} $</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-semibold text-gray-500">Coût/km</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {selectedVehicule.kilometrage_actuel > 0 ? (totalCouts / selectedVehicule.kilometrage_actuel).toFixed(3) : '0.000'} $/km
            </p>
          </div>
        </div>

        {/* Section Kilométrage */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Gauge className="w-5 h-5 text-blue-600" />
            Kilométrage
          </h3>
          <div className="flex gap-3 mb-4">
            <input
              type="number"
              value={newKm}
              onChange={(e) => setNewKm(e.target.value)}
              placeholder="Nouveau kilométrage..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
            />
            <button
              onClick={handleSaveKm}
              disabled={saving || !newKm}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer
            </button>
          </div>
          {kmLogs.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">Historique récent</p>
              {kmLogs.slice(0, 5).map(log => (
                <div key={log.id} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-100 last:border-0">
                  <span className="text-gray-600">{new Date(log.date).toLocaleDateString('fr-CA')}</span>
                  <span className="font-semibold text-gray-900">{formatKm(log.kilometrage)} km</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section Entretiens */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-orange-500" />
              Entretiens
            </h3>
            <button
              onClick={() => setShowAddEntretien(true)}
              className="bg-orange-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-orange-600 transition-colors flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Planifier
            </button>
          </div>

          {entretiens.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">Aucun entretien planifié</p>
          ) : (
            <div className="space-y-3">
              {entretiens.map(entretien => {
                const badge = getEntretienBadge(entretien);
                const typeLabel = TYPES_ENTRETIEN.find(t => t.value === entretien.type)?.label || entretien.type;
                return (
                  <div key={entretien.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className={`p-2 rounded-lg ${badge.color}`}>
                      <badge.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{typeLabel}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-0.5">
                        {entretien.date_prochain && <span>Prochain: {new Date(entretien.date_prochain).toLocaleDateString('fr-CA')}</span>}
                        {entretien.km_prochain && <span>@ {formatKm(entretien.km_prochain)} km</span>}
                        {entretien.cout > 0 && <span className="text-green-600 font-semibold">{entretien.cout.toFixed(2)} $</span>}
                      </div>
                      {entretien.notes && <p className="text-xs text-gray-400 mt-0.5">{entretien.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${badge.color}`}>{badge.label}</span>
                      {entretien.statut === 'planifie' && (
                        <button
                          onClick={() => handleMarkDone(entretien)}
                          className="text-green-600 hover:bg-green-50 p-1.5 rounded-lg transition-colors"
                          title="Marquer comme effectué"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteEntretien(entretien.id)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal ajout entretien */}
        {showAddEntretien && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in max-h-[90vh] overflow-y-auto">
              <div className="p-5 border-b flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Planifier un entretien</h3>
                <button onClick={() => setShowAddEntretien(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formEntretien.type}
                    onChange={e => setFormEntretien({ ...formEntretien, type: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {TYPES_ENTRETIEN.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                  <select
                    value={formEntretien.statut}
                    onChange={e => setFormEntretien({ ...formEntretien, statut: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-900 outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="planifie">Planifié (à faire)</option>
                    <option value="effectue">Déjà effectué</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date effectué</label>
                    <input
                      type="date"
                      value={formEntretien.date_effectue}
                      onChange={e => setFormEntretien({ ...formEntretien, date_effectue: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prochain (date)</label>
                    <input
                      type="date"
                      value={formEntretien.date_prochain}
                      onChange={e => setFormEntretien({ ...formEntretien, date_prochain: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">KM effectué</label>
                    <input
                      type="number"
                      value={formEntretien.km_effectue}
                      onChange={e => setFormEntretien({ ...formEntretien, km_effectue: e.target.value })}
                      placeholder={formatKm(selectedVehicule.kilometrage_actuel)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prochain (km)</label>
                    <input
                      type="number"
                      value={formEntretien.km_prochain}
                      onChange={e => setFormEntretien({ ...formEntretien, km_prochain: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coût ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formEntretien.cout}
                    onChange={e => setFormEntretien({ ...formEntretien, cout: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <input
                    type="text"
                    value={formEntretien.notes}
                    onChange={e => setFormEntretien({ ...formEntretien, notes: e.target.value })}
                    placeholder="Notes optionnelles..."
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  />
                </div>
              </div>
              <div className="p-5 border-t flex gap-3">
                <button
                  onClick={handleAddEntretien}
                  disabled={saving}
                  className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Enregistrer
                </button>
                <button
                  onClick={() => setShowAddEntretien(false)}
                  className="px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // VUE LISTE DES VÉHICULES
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Car className="w-6 h-6 text-blue-600" />
            Mes Véhicules
          </h2>
          <p className="text-sm text-gray-500 mt-1">{vehicules.length} véhicule{vehicules.length !== 1 ? 's' : ''} enregistré{vehicules.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowAddVehicule(true)}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Ajouter</span>
        </button>
      </div>

      {/* Liste véhicules */}
      {vehicules.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 text-lg mb-2">Aucun véhicule</h3>
          <p className="text-gray-500 mb-6">Ajoutez votre premier véhicule pour commencer le suivi</p>
          <button
            onClick={() => setShowAddVehicule(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Ajouter un véhicule
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {vehicules.map(vehicule => (
            <div
              key={vehicule.id}
              onClick={() => setSelectedVehicule(vehicule)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 group-hover:bg-blue-100 p-3 rounded-xl transition-colors">
                  <Car className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900">{vehicule.nom}</h3>
                  <p className="text-sm text-gray-500">
                    {[vehicule.marque, vehicule.modele, vehicule.annee].filter(Boolean).join(' ') || 'Aucun détail'}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5" />
                      {formatKm(vehicule.kilometrage_actuel)} km
                    </span>
                    {vehicule.plaque && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded font-mono font-semibold">{vehicule.plaque}</span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal ajout véhicule */}
      {showAddVehicule && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Nouveau véhicule</h3>
              <button onClick={() => setShowAddVehicule(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
                  <input
                    type="text"
                    value={formVehicule.couleur}
                    onChange={e => setFormVehicule({ ...formVehicule, couleur: e.target.value })}
                    placeholder="Blanc"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">KM actuel</label>
                  <input
                    type="number"
                    value={formVehicule.kilometrage_actuel}
                    onChange={e => setFormVehicule({ ...formVehicule, kilometrage_actuel: e.target.value })}
                    placeholder="125000"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">VIN (optionnel)</label>
                <input
                  type="text"
                  value={formVehicule.vin}
                  onChange={e => setFormVehicule({ ...formVehicule, vin: e.target.value })}
                  placeholder="1HGBH41JXMN109186"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d&apos;achat</label>
                <input
                  type="date"
                  value={formVehicule.date_achat}
                  onChange={e => setFormVehicule({ ...formVehicule, date_achat: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>
            <div className="p-5 border-t flex gap-3">
              <button
                onClick={handleAddVehicule}
                disabled={saving || !formVehicule.nom.trim()}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Ajouter le véhicule
              </button>
              <button
                onClick={() => setShowAddVehicule(false)}
                className="px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
