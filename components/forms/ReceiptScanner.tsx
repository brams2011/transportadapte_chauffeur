'use client';

import { useState } from 'react';
import { Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ReceiptScannerProps {
  userId: string;
  onSuccess?: () => void;
}

export default function ReceiptScanner({ userId, onSuccess }: ReceiptScannerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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

  const handleUpload = async () => {
    if (!file) {
      setError('Veuillez sélectionner une image');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('receipt', file);
      formData.append('user_id', userId);

      const response = await fetch('/api/expenses/scan', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors du traitement');
      }

      setResult(data);
      
      // Réinitialiser après 3 secondes
      setTimeout(() => {
        setFile(null);
        setPreview(null);
        setResult(null);
        if (onSuccess) onSuccess();
      }, 3000);

    } catch (err) {
      console.error('Error uploading receipt:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
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
        {file && !result && (
          <button
            onClick={handleUpload}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Scanner et classifier
              </>
            )}
          </button>
        )}

        {/* Résultat */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-2">
                  Facture traitée avec succès!
                </h3>
                <div className="text-sm text-green-800 space-y-1">
                  <p>
                    <span className="font-medium">Catégorie:</span>{' '}
                    {result.classification.category}
                  </p>
                  <p>
                    <span className="font-medium">Montant:</span>{' '}
                    {result.expense.amount.toFixed(2)}$
                  </p>
                  <p>
                    <span className="font-medium">Vendeur:</span>{' '}
                    {result.expense.vendor}
                  </p>
                  <p>
                    <span className="font-medium">Confiance IA:</span>{' '}
                    {(result.classification.confidence * 100).toFixed(0)}%
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
