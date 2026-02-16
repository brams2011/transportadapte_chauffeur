# API Scanner de Reçus - Documentation

## Nouveau flux en 2 étapes (avec validation)

### Étape 1: Scanner et prévisualiser (Preview)

**Endpoint:** `POST /api/expenses/scan`

**Paramètres FormData:**
- `receipt`: File (image du reçu)
- `user_id`: string
- `preview`: "true" (pour activer le mode preview)

**Exemple d'utilisation:**
```javascript
const formData = new FormData();
formData.append('receipt', fileInput.files[0]);
formData.append('user_id', userId);
formData.append('preview', 'true'); // Important!

const response = await fetch('/api/expenses/scan', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

**Réponse (preview mode):**
```json
{
  "success": true,
  "preview": true,
  "data": {
    "date": "2026-02-14",
    "amount": 75.50,
    "vendor": "Shell",
    "category": "fuel",
    "subcategory": "gasoline",
    "items": [
      {
        "description": "Essence",
        "quantity": 45.5,
        "unit": "L",
        "price": 1.66
      }
    ],
    "tax_deductible": true,
    "deductible_percentage": 100,
    "confidence": 0.85,
    "notes": "",
    "receipt_url": "https://..."
  },
  "ocr_text": "SHELL\n14/02/2026\nEssence...",
  "message": "Receipt scanned successfully. Please review and confirm."
}
```

### Étape 2: Sauvegarder après validation

**Endpoint:** `POST /api/expenses/save`

**Corps de la requête (JSON):**
```json
{
  "user_id": "uuid",
  "date": "2026-02-14",
  "amount": 75.50,
  "vendor": "Shell",
  "category": "fuel",
  "subcategory": "gasoline",
  "description": "Plein d'essence",
  "receipt_url": "https://...",
  "is_tax_deductible": true,
  "deductible_percentage": 100,
  "ai_confidence": 0.85,
  "notes": "Modifié par l'utilisateur"
}
```

**Exemple d'utilisation:**
```javascript
// Après que l'utilisateur a modifié/validé les données
const response = await fetch('/api/expenses/save', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(validatedData)
});

const result = await response.json();
```

**Réponse:**
```json
{
  "success": true,
  "expense": {
    "id": "...",
    "user_id": "...",
    "date": "2026-02-14",
    "amount": 75.50,
    ...
  },
  "message": "Expense saved successfully"
}
```

## Mode ancien (sauvegarde directe)

Si vous ne voulez pas la validation, n'envoyez pas `preview=true`:

```javascript
const formData = new FormData();
formData.append('receipt', fileInput.files[0]);
formData.append('user_id', userId);
// PAS de preview parameter

const response = await fetch('/api/expenses/scan', {
  method: 'POST',
  body: formData
});
```

Cela va scanner ET sauvegarder directement.

## Catégories disponibles

- `fuel` (essence/diesel)
- `maintenance` (entretien, réparations)
- `insurance` (assurances)
- `permits` (permis, certifications)
- `phone` (téléphone)
- `parking` (stationnement)
- `vehicle_payment` (paiement véhicule)
- `other` (autre)

## Interface utilisateur recommandée

1. **Upload** → Afficher un loader "Scan en cours..."
2. **Preview** → Afficher un formulaire pré-rempli avec les données extraites
3. **Validation** → L'utilisateur peut modifier les champs
4. **Confirmation** → Bouton "Enregistrer" qui appelle `/api/expenses/save`
5. **Succès** → Redirection ou message de confirmation

## Gestion des erreurs

- Si `confidence < 0.7` → Afficher un avertissement "Vérification recommandée"
- Si `amount === null` → Demander à l'utilisateur de saisir le montant
- Si l'OCR échoue → Afficher "Image illisible, veuillez réessayer"
