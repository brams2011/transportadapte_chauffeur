# 🤖 API Embed Chatbot JotForm - Ino Service

API complète pour générer et gérer des scripts d'embed JotForm personnalisés pour vos clients.

## 🎯 Qu'est-ce que c'est ?

Cette API permet à vos clients d'intégrer facilement le chatbot JotForm sur leur site web avec **une seule ligne de code**, tout en permettant une personnalisation complète via votre interface.

**Exemple d'utilisation:**
```html
<!-- Le client ajoute simplement cette ligne sur son site -->
<script src="https://api.ino-service.ai/embed/emb_abc123.js"></script>
```

Et voilà ! Le chatbot apparaît personnalisé selon sa configuration.

---

## ✨ Fonctionnalités

- ✅ **Génération de scripts personnalisés** - Un script unique par client
- ✅ **Personnalisation complète** - Couleurs, position, messages, comportement
- ✅ **Multi-clients** - Gérez plusieurs clients avec des configurations différentes
- ✅ **Analytics intégrées** - Trackez les chargements, ouvertures, conversations
- ✅ **API RESTful** - CRUD complet pour gérer les embeds
- ✅ **Base de données Supabase** - PostgreSQL robuste et sécurisé
- ✅ **Facile à intégrer** - Compatible tous sites (WordPress, Shopify, React, etc.)

---

## 🚀 Démarrage Rapide

### 1️⃣ Installer

```bash
# Cloner ou extraire le projet
cd ino-embed-api

# Installer les dépendances
npm install
```

### 2️⃣ Configurer Supabase

1. Créer un projet sur https://supabase.com
2. Copier `.env.example` vers `.env`
3. Ajouter vos clés Supabase dans `.env`:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs...
API_URL=http://localhost:3000
```

4. Exécuter le schéma SQL:
   - Aller dans Supabase → SQL Editor
   - Copier le contenu de `database/schema.sql`
   - Exécuter

### 3️⃣ Démarrer

```bash
npm start
```

✅ **API prête sur:** `http://localhost:3000`

---

## 📖 Comment ça marche ?

### Pour vous (Ino Service)

1. **Créer un client** avec une clé API
2. **Le client crée ses embeds** via l'API
3. **Vous recevez les analytics** de tous les embeds

### Pour vos clients

1. **Obtenir leur clé API** (que vous leur fournissez)
2. **Créer un embed** via API:
   ```bash
   curl -X POST https://api.ino-service.ai/api/embeds \
     -H "X-API-Key: leur_cle_api" \
     -d '{
       "name": "Mon Chatbot",
       "jotform_agent_id": "019af1747f74749fae12e693ee2ccd4bf1be"
     }'
   ```

3. **Copier le code** fourni dans la réponse:
   ```html
   <script src="https://api.ino-service.ai/embed/emb_abc123.js"></script>
   ```

4. **Coller sur leur site** avant `</body>`

**C'est tout !** Le chatbot apparaît automatiquement.

---

## 🎨 Exemple de Personnalisation

```json
{
  "name": "Chatbot Support",
  "jotform_agent_id": "019af1747f74749fae12e693ee2ccd4bf1be",
  "configuration": {
    "position": "bottom-right",
    "theme": {
      "primaryColor": "#667eea",
      "buttonText": "💬 Besoin d'aide ?",
      "welcomeMessage": "Bonjour ! Comment puis-je vous aider ?"
    },
    "behavior": {
      "autoOpen": true,
      "autoOpenDelay": 5000,
      "showOnPages": ["/contact", "/support"]
    }
  }
}
```

---

## 🔌 Endpoints API

### Admin (Ino Service)

```bash
# Créer un nouveau client
POST /api/admin/clients
{
  "name": "Client A",
  "email": "client@example.com",
  "company": "Client A Inc"
}
→ Retourne la clé API du client
```

```bash
# Lister tous les clients
GET /api/admin/clients
```

### Client (avec clé API)

```bash
# Créer un embed
POST /api/embeds
X-API-Key: cle_api_client

# Lister ses embeds
GET /api/embeds
X-API-Key: cle_api_client

# Obtenir un embed
GET /api/embeds/{embed_id}
X-API-Key: cle_api_client

# Mettre à jour
PUT /api/embeds/{embed_id}
X-API-Key: cle_api_client

# Désactiver
DELETE /api/embeds/{embed_id}
X-API-Key: cle_api_client

# Voir les analytics
GET /api/embeds/{embed_id}/analytics
X-API-Key: cle_api_client
```

### Public (pour les visiteurs)

```bash
# Charger le script personnalisé
GET /embed/{embed_id}.js

# Tracker un événement
POST /track/{embed_id}
{
  "event_type": "open",
  "metadata": {}
}
```

---

## 📊 Analytics

L'API track automatiquement:

| Événement | Description |
|-----------|-------------|
| `load` | Script chargé sur une page |
| `open` | Chatbot ouvert par un visiteur |
| `close` | Chatbot fermé |
| `conversation_start` | Nouvelle conversation initiée |

**Métriques disponibles:**
- Total de chargements
- Total d'ouvertures
- Total de conversations
- IPs uniques
- Taux de conversion
- Statistiques par jour

---

## 🗄️ Base de Données

### Tables principales

**clients**
- Stocke les clients avec leur clé API
- Champs: id, name, email, company, api_key, is_active

**embeds**
- Stocke les configurations d'embed
- Champs: embed_id, client_id, name, jotform_agent_id, configuration, total_loads, total_conversations

**embed_analytics**
- Stocke tous les événements
- Champs: embed_id, event_type, metadata, referrer, user_agent, ip_address

---

## 🎯 Cas d'Usage

### 1. Agence Web

Vous gérez 50 sites clients. Créez un embed pour chaque client:

```bash
for client in client-a.com client-b.com client-c.com; do
  curl -X POST https://api.ino-service.ai/api/embeds \
    -H "X-API-Key: votre_cle_admin" \
    -d "{\"name\":\"$client\",\"jotform_agent_id\":\"019af...\"}"
done
```

### 2. SaaS Multi-tenant

Chaque utilisateur de votre SaaS obtient son propre chatbot personnalisé.

### 3. White-label

Revendez cette solution sous votre marque avec votre propre domaine.

---

## 🚀 Déploiement

### Vercel (Recommandé)

```bash
vercel
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_KEY
vercel env add API_URL
```

### Heroku

```bash
heroku create ino-embed-api
heroku config:set SUPABASE_URL=...
heroku config:set SUPABASE_SERVICE_KEY=...
git push heroku main
```

### Docker

```bash
docker build -t ino-embed-api .
docker run -p 3000:3000 --env-file .env ino-embed-api
```

---

## 📚 Documentation

| Fichier | Description |
|---------|-------------|
| **[GUIDE_UTILISATION.md](./GUIDE_UTILISATION.md)** | Guide complet pour vos clients |
| **[database/schema.sql](./database/schema.sql)** | Schéma Supabase |
| **server.js** | Code source de l'API |

---

## 🔒 Sécurité

- ✅ Authentification par clé API
- ✅ CORS configuré
- ✅ Isolation des données par client
- ✅ Row Level Security (Supabase)
- ✅ Validation des entrées

---

## 🛠️ Stack Technique

- **Backend:** Node.js + Express
- **Base de données:** Supabase (PostgreSQL)
- **Embed:** Vanilla JavaScript (léger et rapide)
- **Analytics:** PostgreSQL + JSONB

---

## 📈 Évolutions Futures

- [ ] Dashboard web pour gérer les embeds
- [ ] Webhooks pour les événements
- [ ] A/B testing
- [ ] Templates de personnalisation
- [ ] Intégration CRM
- [ ] Export analytics CSV

---

## 💡 Exemple Complet

### 1. Créer un client (Admin)

```bash
curl -X POST http://localhost:3000/api/admin/clients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Restaurant Le Gourmet",
    "email": "contact@legourmet.com",
    "company": "Le Gourmet"
  }'
```

**Réponse:**
```json
{
  "success": true,
  "client": { ... },
  "api_key": "ino_client_abc123def456..."
}
```

### 2. Le client crée son embed

```bash
curl -X POST http://localhost:3000/api/embeds \
  -H "X-API-Key: ino_client_abc123def456..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Chatbot Réservations",
    "jotform_agent_id": "019af1747f74749fae12e693ee2ccd4bf1be",
    "configuration": {
      "theme": {
        "primaryColor": "#e74c3c",
        "buttonText": "🍽️ Réserver une table",
        "welcomeMessage": "Bonjour ! Souhaitez-vous réserver ?"
      },
      "behavior": {
        "autoOpen": true,
        "autoOpenDelay": 3000
      }
    }
  }'
```

**Réponse:**
```json
{
  "success": true,
  "embed": {
    "embed_id": "emb_xyz789...",
    ...
  },
  "script_url": "http://localhost:3000/embed/emb_xyz789.js",
  "integration_code": "<script src=\"http://localhost:3000/embed/emb_xyz789.js\"></script>"
}
```

### 3. Le client intègre sur son site

```html
<!DOCTYPE html>
<html>
<head>
    <title>Restaurant Le Gourmet</title>
</head>
<body>
    <h1>Bienvenue au Restaurant Le Gourmet</h1>
    
    <!-- Chatbot Ino Service -->
    <script src="http://localhost:3000/embed/emb_xyz789.js"></script>
</body>
</html>
```

### 4. Voir les analytics

```bash
curl -H "X-API-Key: ino_client_abc123def456..." \
  http://localhost:3000/api/embeds/emb_xyz789/analytics
```

---

## ✅ Checklist de Configuration

- [ ] Projet Supabase créé
- [ ] Clés API copiées dans .env
- [ ] Schéma SQL exécuté
- [ ] npm install effectué
- [ ] API démarrée (npm start)
- [ ] Premier client créé
- [ ] Premier embed testé
- [ ] Analytics vérifiées

---

## 📞 Support

- 📧 **Email:** support@ino-service.ai
- 💬 **Chat:** https://ino-service.ai
- 📚 **Docs:** Voir GUIDE_UTILISATION.md

---

## 🎉 Prêt à Utiliser !

Votre API est maintenant opérationnelle. Vous pouvez:

1. Créer des clients
2. Les clients créent leurs embeds
3. Tracker les analytics
4. Déployer en production

**Bon développement ! 🚀**
