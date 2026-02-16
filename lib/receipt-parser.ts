/**
 * Classification de reçus basée sur des règles (sans IA)
 * Utilise uniquement le texte OCR de Tesseract
 */

interface ReceiptItem {
  description: string;
  quantity?: number;
  unit?: string;
  price?: number;
}

interface ParsedReceipt {
  date: string | null;
  amount: number | null;
  vendor: string | null;
  category: string;
  subcategory: string | null;
  items: ReceiptItem[];
  tax_deductible: boolean;
  deductible_percentage: number;
  confidence: number;
  notes: string;
}

// Mots-clés pour identifier les catégories
const CATEGORY_KEYWORDS = {
  fuel: [
    'essence', 'diesel', 'carburant', 'gas', 'fuel', 'petro', 'shell', 'esso',
    'ultramar', 'irving', 'couche-tard', 'circle k', 'litre', 'litres', 'l '
  ],
  maintenance: [
    'huile', 'oil', 'pneu', 'tire', 'batterie', 'battery', 'filtre', 'filter',
    'réparation', 'repair', 'entretien', 'maintenance', 'balancement', 'alignment',
    'freins', 'brake', 'transmission', 'suspension', 'vidange', 'changement'
  ],
  insurance: [
    'assurance', 'insurance', 'prime', 'premium', 'police', 'policy',
    'intact', 'desjardins', 'belairdirect'
  ],
  permits: [
    'permis', 'permit', 'saaq', 'immatriculation', 'registration',
    'classe 4', 'licence', 'renouvellement', 'renewal', 'certification'
  ],
  phone: [
    'téléphone', 'phone', 'cellulaire', 'mobile', 'bell', 'rogers',
    'videotron', 'fido', 'telus', 'koodo', 'forfait', 'plan', 'données'
  ],
  parking: [
    'stationnement', 'parking', 'parcomètre', 'meter', 'vignette'
  ],
  vehicle_payment: [
    'paiement véhicule', 'vehicle payment', 'location', 'lease', 'financement',
    'financing', 'mensualité', 'payment'
  ]
};

// Vendeurs connus
const KNOWN_VENDORS = {
  fuel: [
    'shell', 'esso', 'petro-canada', 'ultramar', 'irving',
    'couche-tard', 'circle k', 'costco', 'canadian tire'
  ],
  maintenance: [
    'canadian tire', 'garage', 'midas', 'speedy', 'point s',
    'ok pneus', 'pièces d\'auto'
  ],
  phone: [
    'bell', 'rogers', 'videotron', 'telus', 'fido', 'koodo', 'virgin'
  ]
};

/**
 * Extrait la date du texte OCR
 */
function extractDate(text: string): string | null {
  const normalizedText = text.toLowerCase();

  // Format: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
  const datePatterns = [
    /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/,
    /\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/,
    /\b(\d{1,2})\s+(jan|feb|mar|avr|may|jun|jul|aug|sep|oct|nov|dec|janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\w*\s+(\d{4})\b/i
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      // Convertir au format YYYY-MM-DD
      if (pattern === datePatterns[0]) {
        // DD/MM/YYYY
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        const year = match[3];
        return `${year}-${month}-${day}`;
      } else if (pattern === datePatterns[1]) {
        // YYYY-MM-DD (déjà bon format)
        const year = match[1];
        const month = match[2].padStart(2, '0');
        const day = match[3].padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
  }

  // Si aucune date trouvée, utiliser la date du jour
  return new Date().toISOString().split('T')[0];
}

/**
 * Extrait le montant total du texte OCR
 */
function extractAmount(text: string): number | null {
  // Chercher "total", "montant", "amount"
  const amountPatterns = [
    /total[:\s]*\$?\s*(\d+[,\.]\d{2})/i,
    /montant[:\s]*\$?\s*(\d+[,\.]\d{2})/i,
    /amount[:\s]*\$?\s*(\d+[,\.]\d{2})/i,
    /\$\s*(\d+[,\.]\d{2})\s*(total|montant)/i,
    // Dernier montant dans le texte (souvent le total)
    /\$?\s*(\d+[,\.]\d{2})/g
  ];

  for (const pattern of amountPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      // Prendre le dernier match (souvent le total)
      const lastMatch = Array.isArray(matches) ? matches[matches.length - 1] : matches[1];
      const amount = lastMatch.replace(/[^\d,\.]/g, '').replace(',', '.');
      const parsed = parseFloat(amount);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }

  return null;
}

/**
 * Identifie le vendeur
 */
function extractVendor(text: string): string {
  const normalizedText = text.toLowerCase();
  const lines = text.split('\n');

  // Chercher dans les vendeurs connus
  for (const [category, vendors] of Object.entries(KNOWN_VENDORS)) {
    for (const vendor of vendors) {
      if (normalizedText.includes(vendor)) {
        return vendor.charAt(0).toUpperCase() + vendor.slice(1);
      }
    }
  }

  // Si pas trouvé, prendre la première ligne (souvent le nom du vendeur)
  const firstLine = lines[0]?.trim();
  if (firstLine && firstLine.length > 2 && firstLine.length < 50) {
    return firstLine;
  }

  return 'Vendeur inconnu';
}

/**
 * Détermine la catégorie en fonction des mots-clés
 */
function determineCategory(text: string, vendor: string): {
  category: string;
  subcategory: string | null;
  confidence: number;
} {
  const normalizedText = text.toLowerCase();
  const normalizedVendor = vendor.toLowerCase();

  let maxScore = 0;
  let detectedCategory = 'other';
  let subcategory: string | null = null;

  // Vérifier chaque catégorie
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;

    // Compter les mots-clés trouvés
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword) || normalizedVendor.includes(keyword)) {
        score++;
      }
    }

    if (score > maxScore) {
      maxScore = score;
      detectedCategory = category;
    }
  }

  // Déterminer la sous-catégorie pour l'essence
  if (detectedCategory === 'fuel') {
    if (normalizedText.includes('diesel')) {
      subcategory = 'diesel';
    } else {
      subcategory = 'gasoline';
    }
  }

  // Déterminer la sous-catégorie pour maintenance
  if (detectedCategory === 'maintenance') {
    if (normalizedText.includes('huile') || normalizedText.includes('oil') || normalizedText.includes('vidange')) {
      subcategory = 'oil_change';
    } else if (normalizedText.includes('pneu') || normalizedText.includes('tire')) {
      subcategory = 'tires';
    } else if (normalizedText.includes('frein') || normalizedText.includes('brake')) {
      subcategory = 'brakes';
    } else if (normalizedText.includes('batterie') || normalizedText.includes('battery')) {
      subcategory = 'battery';
    }
  }

  // Calculer le score de confiance (0.0 à 1.0)
  const confidence = Math.min(0.5 + (maxScore * 0.1), 0.95);

  return { category: detectedCategory, subcategory, confidence };
}

/**
 * Extrait les articles détaillés (pour essence principalement)
 */
function extractItems(text: string, category: string): ReceiptItem[] {
  const items: ReceiptItem[] = [];

  if (category === 'fuel') {
    // Chercher les litres et prix par litre
    const litresMatch = text.match(/(\d+[,\.]\d+)\s*(l|litre|litres)/i);
    const pricePerLiterMatch = text.match(/(\d+[,\.]\d+)\s*\$?\s*\/?\s*(l|litre)/i);

    if (litresMatch) {
      const quantity = parseFloat(litresMatch[1].replace(',', '.'));
      const price = pricePerLiterMatch
        ? parseFloat(pricePerLiterMatch[1].replace(',', '.'))
        : undefined;

      items.push({
        description: 'Essence',
        quantity,
        unit: 'L',
        price
      });
    }
  }

  return items;
}

/**
 * Parse un reçu à partir du texte OCR
 */
export function parseReceipt(ocrText: string): ParsedReceipt {
  const date = extractDate(ocrText);
  const amount = extractAmount(ocrText);
  const vendor = extractVendor(ocrText);
  const { category, subcategory, confidence } = determineCategory(ocrText, vendor);
  const items = extractItems(ocrText, category);

  // Toutes les dépenses de transport sont déductibles à 100%
  const tax_deductible = true;
  const deductible_percentage = 100;

  // Notes
  let notes = '';
  if (confidence < 0.7) {
    notes = 'Vérification recommandée - confiance faible';
  }
  if (!amount) {
    notes += ' | Montant non détecté';
  }

  return {
    date,
    amount,
    vendor,
    category,
    subcategory,
    items,
    tax_deductible,
    deductible_percentage,
    confidence,
    notes: notes.trim()
  };
}

/**
 * Fonction compatible avec l'ancienne interface Claude
 */
export async function classifyReceiptWithTesseract(ocrText: string) {
  try {
    const parsed = parseReceipt(ocrText);

    return {
      success: true,
      data: parsed,
      usage: {
        input_tokens: 0,
        output_tokens: 0
      }
    };
  } catch (error) {
    console.error('Error parsing receipt:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    };
  }
}
