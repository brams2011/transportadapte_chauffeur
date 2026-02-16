'use client';

import { useState } from 'react';
import { Upload, CheckCircle, XCircle, Loader2, Edit2, Save } from 'lucide-react';

interface ReceiptScannerProps {
  userId: string;
  onSuccess?: () => void;
}

interface ScannedData {
  date: string | null;
  amount: number | null;
  vendor: string | null;
  category: string;
  subcategory: string | null;
  notes: string;
  receipt_url: string | null;
  tax_deductible: boolean;
  confidence: number;
}

export default function ReceiptScanner({ userId, onSuccess }: ReceiptScannerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedData | null>(null);
  const [editedData, setEditedData] = useState<ScannedData | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResult(null);

      // Créer preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleScan = async () => {
    if (!file) {
      setError('Veuillez sélectionner une image');
      return;
    }

    setScanning(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('receipt', file);
      formData.append('user_id', userId);
      formData.append('preview', 'true'); // Mode preview!

      const response = await fetch('/api/expenses/scan', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors du traitement');
      }

      // Stocker les données scannées
      setScannedData(data.data);
      setEditedData(data.data); // Copie pour édition

    } catch (err) {
      console.error('Error scanning receipt:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setScanning(false);
    }
  };

  const handleSave = async () => {
    if (!editedData) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/expenses/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          date: editedData.date,
          category: editedData.category,
          subcategory: editedData.subcategory,
          amount: editedData.amount,
          vendor: editedData.vendor,
          receipt_url: editedData.receipt_url,
          is_tax_deductible: editedData.tax_deductible,
          ai_confidence: editedData.confidence,
          notes: editedData.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }

      setResult(data);

      // Réinitialiser après succès
      setTimeout(() => {
        setFile(null);
        setPreview(null);
        setScannedData(null);
        setEditedData(null);
        setResult(null);
        if (onSuccess) onSuccess();
      }, 2000);

    } catch (err) {
      console.error('Error saving expense:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setScannedData(null);
    setEditedData(null);
    setError(null);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Scanner une facture</h2>
      
      <div className="space-y-4">
        {/* Zone de drop */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
          <input
            type="file"
            id="receipt-upload"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          
          {!preview ? (
            <label 
              htmlFor="receipt-upload" 
              className="cursor-pointer flex flex-col items-center"
            >
              <Upload className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-sm text-gray-600 mb-1">
                Cliquez pour sélectionner une image
              </p>
              <p className="text-xs text-gray-500">
                ou prenez une photo de votre facture
              </p>
            </label>
          ) : (
            <div className="space-y-4">
              <img 
                src={preview} 
                alt="Preview" 
                className="max-h-64 mx-auto rounded"
              />
              <label 
                htmlFor="receipt-upload"
                className="inline-block px-4 py-2 text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                Changer l'image
              </label>
            </div>
          )}
        </div>

        {/* Bouton de scan */}
        {file && !scannedData && !result && (
          <button
            onClick={handleScan}
            disabled={scanning}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {scanning ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Scanner et analyser
              </>
            )}
          </button>
        )}

        {/* Formulaire d'édition des données scannées */}
        {editedData && !result && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-yellow-900 flex items-center">
                <Edit2 className="w-5 h-5 mr-2" />
                Vérifiez et modifiez les données
              </h3>
              {editedData.confidence < 0.7 && (
                <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">
                  ⚠️ Confiance faible - Vérification recommandée
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={editedData.date || ''}
                  onChange={(e) =>
                    setEditedData({ ...editedData, date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Montant */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editedData.amount || ''}
                  onChange={(e) =>
                    setEditedData({
                      ...editedData,
                      amount: parseFloat(e.target.value) || null,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Vendeur */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendeur *
                </label>
                <input
                  type="text"
                  value={editedData.vendor || ''}
                  onChange={(e) =>
                    setEditedData({ ...editedData, vendor: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Catégorie */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <select
                  value={editedData.category}
                  onChange={(e) =>
                    setEditedData({ ...editedData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="fuel">Essence</option>
                  <option value="maintenance">Entretien</option>
                  <option value="insurance">Assurance</option>
                  <option value="permits">Permis</option>
                  <option value="phone">Téléphone</option>
                  <option value="parking">Stationnement</option>
                  <option value="vehicle_payment">Paiement véhicule</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={editedData.notes || ''}
                  onChange={(e) =>
                    setEditedData({ ...editedData, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Notes additionnelles..."
                />
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editedData.amount || !editedData.vendor}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Enregistrer
                  </>
                )}
              </button>
            </div>

            {/* Confiance IA */}
            <div className="text-xs text-gray-600 text-center pt-2">
              Confiance de l'analyse: {(editedData.confidence * 100).toFixed(0)}%
            </div>
          </div>
        )}

        {/* Résultat de la sauvegarde */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-2">
                  ✅ Dépense enregistrée avec succès!
                </h3>
                <div className="text-sm text-green-800 space-y-1">
                  <p>
                    <span className="font-medium">Montant:</span>{' '}
                    {result.expense?.amount?.toFixed(2) || 'N/A'}$
                  </p>
                  <p>
                    <span className="font-medium">Vendeur:</span>{' '}
                    {result.expense?.vendor || 'N/A'}
                  </p>
                  <p>
                    <span className="font-medium">Catégorie:</span>{' '}
                    {result.expense?.category || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <XCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Erreur</h3>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">
            💡 Conseils pour de meilleurs résultats
          </h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Assurez-vous que la facture est bien éclairée</li>
            <li>Évitez les reflets et les ombres</li>
            <li>Capturez toute la facture dans le cadre</li>
            <li>L'IA classifiera automatiquement la dépense</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
