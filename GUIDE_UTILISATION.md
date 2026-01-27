# 📘 Guide d'Utilisation - API Embed Ino Service

Guide complet pour intégrer le chatbot JotForm personnalisé sur votre site web via l'API Ino Service.

---

## 🚀 Démarrage Rapide

### Étape 1: Obtenir votre clé API

Contactez Ino Service pour obtenir votre clé API unique:
```
X-API-Key: ino_client_abc123def456...
```

### Étape 2: Créer votre premier embed

```bash
curl -X POST https://api.ino-service.ai/api/embeds \
  -H "X-API-Key: VOTRE_CLE_API" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Chatbot Site Principal",
    "jotform_agent_id": "019af1747f74749fae12e693ee2cfd4bf1be",
    "configuration": {
      "position": "bottom-right",
      "theme": {
        "primaryColor": "#667eea",
        "buttonText": "💬 Besoin d'\''aide ?",
        "welcomeMessage": "Bonjour ! Comment puis-je vous aider ?"
      }
    }
  }'
```

**Réponse:**
```json
{
  "success": true,
  "embed": {
    "embed_id": "emb_abc123...",
    "name": "Chatbot Site Principal",
    ...
  },
  "script_url": "https://api.ino-service.ai/embed/emb_abc123.js",
  "integration_code": "<script src=\"https://api.ino-service.ai/embed/emb_abc123.js\"></script>"
}
```

### Étape 3: Intégrer sur votre site

Copiez le code d'intégration fourni et collez-le **juste avant la balise `</body>`** de votre site:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Mon Site</title>
</head>
<body>
    <!-- Votre contenu -->
    
    <!-- Chatbot Ino Service -->
    <script src="https://api.ino-service.ai/embed/emb_abc123.js"></script>
</body>
</html>
```

**C'est tout ! 🎉** Votre chatbot est maintenant actif.

---

## 🎨 Personnalisation

### Configuration de base

```json
{
  "position": "bottom-right",
  "theme": {
    "primaryColor": "#667eea",
    "buttonText": "💬 Besoin d'aide ?",
    "welcomeMessage": "Bonjour ! Comment puis-je vous aider ?"
  },
  "behavior": {
    "autoOpen": false,
    "autoOpenDelay": 5000,
    "showOnPages": "*"
  }
}
```

### Options de position

- `bottom-right` - Coin inférieur droit (défaut)
- `bottom-left` - Coin inférieur gauche
- `top-right` - Coin supérieur droit
- `top-left` - Coin supérieur gauche

### Options de thème

```json
{
  "theme": {
    "primaryColor": "#667eea",
    "buttonText": "💬 Besoin d'aide ?",
    "welcomeMessage": "Bonjour ! Comment puis-je vous aider ?"
  }
}
```

### Comportement

```json
{
  "behavior": {
    "autoOpen": true,           // Ouvrir automatiquement
    "autoOpenDelay": 5000,      // Délai avant ouverture (ms)
    "showOnPages": "*"          // Pages où afficher
  }
}
```

**Exemples de filtrage de pages:**

```json
// Afficher partout
"showOnPages": "*"

// Afficher seulement sur /contact
"showOnPages": "/contact"

// Afficher sur plusieurs pages
"showOnPages": ["/contact", "/support", "/aide"]

// Utiliser des regex
"showOnPages": ["/products/.*", "/services/.*"]
```

---

## 🔧 API Endpoints

### Créer un embed

```
POST /api/embeds
```

**Headers:**
```
X-API-Key: votre_cle_api
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Nom de l'embed",
  "jotform_agent_id": "019af1747f74749fae12e693ee2cfd4bf1be",
  "configuration": { ... }
}
```

---

### Lister vos embeds

```
GET /api/embeds
```

**Headers:**
```
X-API-Key: votre_cle_api
```

**Réponse:**
```json
{
  "total": 3,
  "embeds": [
    {
      "embed_id": "emb_abc123",
      "name": "Chatbot Site Principal",
      "jotform_agent_id": "019af1747f74749fae12e693ee2cfd4bf1be",
      "configuration": { ... },
      "total_loads": 1523,
      "total_conversations": 287,
      "is_active": true,
      "created_at": "2025-01-25T10:00:00Z",
      "script_url": "https://api.ino-service.ai/embed/emb_abc123.js",
      "integration_code": "<script src=\"...\"></script>"
    }
  ]
}
```

---

### Obtenir un embed spécifique

```
GET /api/embeds/{embed_id}
```

**Headers:**
```
X-API-Key: votre_cle_api
```

---

### Mettre à jour un embed

```
PUT /api/embeds/{embed_id}
```

**Headers:**
```
X-API-Key: votre_cle_api
Content-Type: application/json
```

**Body:**
```json
{
  "configuration": {
    "theme": {
      "primaryColor": "#ff6b6b"
    }
  }
}
```

---

### Obtenir les analytics

```
GET /api/embeds/{embed_id}/analytics?from=2025-01-01&to=2025-01-31
```

**Headers:**
```
X-API-Key: votre_cle_api
```

**Réponse:**
```json
{
  "stats": {
    "total_loads": 1523,
    "total_opens": 456,
    "total_conversations": 287,
    "by_event_type": {
      "load": 1523,
      "open": 456,
      "close": 421,
      "conversation_start": 287
    },
    "by_date": {
      "2025-01-25": {
        "loads": 89,
        "opens": 34,
        "conversations": 21
      }
    }
  },
  "recent_events": [ ... ]
}
```

---

### Désactiver un embed

```
DELETE /api/embeds/{embed_id}
```

**Headers:**
```
X-API-Key: votre_cle_api
```

---

## 📊 Analytics et Tracking

L'API track automatiquement:

- 📈 **Chargements** (`load`) - Nombre de fois où le script est chargé
- 👁️ **Ouvertures** (`open`) - Nombre de fois où le chatbot est ouvert
- 💬 **Conversations** (`conversation_start`) - Nombre de conversations initiées
- 🔒 **Fermetures** (`close`) - Nombre de fois où le chatbot est fermé

### Métriques disponibles

- Total de chargements
- Total d'ouvertures
- Total de conversations
- IPs uniques
- Taux de conversion (conversations / chargements)
- Statistiques par jour
- Statistiques par type d'événement

---

## 💡 Exemples d'intégration

### WordPress

Ajouter dans le **footer.php** de votre thème:

```php
<script src="https://api.ino-service.ai/embed/emb_abc123.js"></script>
```

Ou utiliser un plugin comme "Insert Headers and Footers".

---

### Shopify

1. Aller dans **Boutique en ligne → Thèmes**
2. **Actions → Modifier le code**
3. Ouvrir **theme.liquid**
4. Ajouter avant `</body>`:

```liquid
<script src="https://api.ino-service.ai/embed/emb_abc123.js"></script>
```

---

### React

```jsx
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://api.ino-service.ai/embed/emb_abc123.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  
  return <div>Mon App</div>;
}
```

---

### Next.js

Dans `pages/_app.js`:

```jsx
import Script from 'next/script';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Script 
        src="https://api.ino-service.ai/embed/emb_abc123.js"
        strategy="lazyOnload"
      />
    </>
  );
}
```

---

### Vue.js

Dans `App.vue`:

```vue
<template>
  <div id="app">
    <!-- Votre contenu -->
  </div>
</template>

<script>
export default {
  mounted() {
    const script = document.createElement('script');
    script.src = 'https://api.ino-service.ai/embed/emb_abc123.js';
    script.async = true;
    document.body.appendChild(script);
  }
}
</script>
```

---

## 🎯 Cas d'usage avancés

### Créer un embed par client

Si vous gérez plusieurs clients:

```bash
# Client A
curl -X POST https://api.ino-service.ai/api/embeds \
  -H "X-API-Key: VOTRE_CLE_API" \
  -d '{
    "name": "Client A - Site Principal",
    "jotform_agent_id": "019af1747f74749fae12e693ee2cfd4bf1be",
    "configuration": {
      "theme": {
        "primaryColor": "#667eea"
      }
    }
  }'

# Client B
curl -X POST https://api.ino-service.ai/api/embeds \
  -H "X-API-Key: VOTRE_CLE_API" \
  -d '{
    "name": "Client B - Site Principal",
    "jotform_agent_id": "019af1747f74749fae12e693ee2cfd4bf1be",
    "configuration": {
      "theme": {
        "primaryColor": "#ff6b6b"
      }
    }
  }'
```

### Afficher sur certaines pages uniquement

```json
{
  "behavior": {
    "showOnPages": ["/contact", "/support"]
  }
}
```

### Auto-ouvrir après 10 secondes

```json
{
  "behavior": {
    "autoOpen": true,
    "autoOpenDelay": 10000
  }
}
```

---

## 🛠️ Dépannage

### Le chatbot ne s'affiche pas

1. **Vérifier que le script est chargé:**
   - Ouvrir la console (F12)
   - Chercher des erreurs

2. **Vérifier la configuration:**
   - `showOnPages` est-il correctement configuré?
   - L'embed est-il actif (`is_active: true`)?

3. **Tester sur une page simple:**
   ```html
   <!DOCTYPE html>
   <html>
   <body>
     <h1>Test</h1>
     <script src="https://api.ino-service.ai/embed/emb_abc123.js"></script>
   </body>
   </html>
   ```

### Le chatbot ne se charge pas correctement

1. **Vérifier l'ID JotForm:**
   - Est-ce que `jotform_agent_id` est correct?
   - Format: `019af1747f74749fae12e693ee2cfd4bf1be`

2. **Vérifier CORS:**
   - L'API permet tous les domaines
   - Pas de restriction CORS

### Problème de performance

- Le script est optimisé et léger
- Chargement asynchrone par défaut
- Cache de 1 heure sur le script

---

## 📞 Support

- 📧 **Email:** support@ino-service.ai
- 💬 **Chat:** Utilisez notre chatbot sur le site !
- 📚 **Documentation:** https://docs.ino-service.ai

---

## ✅ Checklist d'intégration

- [ ] Clé API obtenue
- [ ] Embed créé via l'API
- [ ] Code d'intégration copié
- [ ] Script inséré avant `</body>`
- [ ] Site publié/mis à jour
- [ ] Chatbot visible et fonctionnel
- [ ] Personnalisation testée
- [ ] Analytics vérifiées

---

## 🎉 Vous êtes prêt !

Votre chatbot Ino Service est maintenant intégré.

**Prochaines étapes:**
1. Personnaliser l'apparence
2. Configurer le comportement
3. Analyser les conversations
4. Optimiser l'engagement

---

**Besoin d'aide ? Contactez-nous à support@ino-service.ai** 🚀
