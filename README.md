# 🚕 Dashboard IA - Transport Adapté Québec

Application complète de gestion financière avec Intelligence Artificielle pour chauffeurs de transport adapté au Québec.

## 📋 Table des Matières

- [Fonctionnalités](#fonctionnalités)
- [Technologies](#technologies)
- [Installation Rapide](#installation-rapide)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Déploiement](#déploiement)
- [Workflow Make.com](#workflow-makecom)
- [FAQ](#faq)

---

## ✨ Fonctionnalités

### 🤖 IA Powered
- **Scan automatique de factures** avec OCR (Tesseract.js)
- **Classification intelligente** avec Claude AI (Anthropic)
- **Détection d'anomalies** en temps réel
- **Insights mensuels** générés automatiquement
- **Chatbot conversationnel** pour questions finances
- **Optimisation fiscale** avec recommandations

### 📊 Dashboard Complet
- Vue d'ensemble revenus/dépenses/profits
- Graphiques interactifs (Recharts)
- Comparaisons mois par mois
- Taux horaire et performance
- Analyse par catégorie

### 💬 Notifications
- WhatsApp Business API (Twilio)
- Alertes anomalies
- Rappels entretien véhicule
- Rapports mensuels automatiques

### 🔄 Automatisation (Make.com)
- Import factures par email
- Génération rapports comptables
- Exports Excel pour comptable
- Workflow complet sans intervention

---

## 🛠️ Technologies

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Recharts (graphiques)

**Backend:**
- Next.js API Routes
- Supabase (PostgreSQL + Storage + Auth)
- Anthropic Claude API
- Tesseract.js (OCR)

**Intégrations:**
- Make.com (automatisation)
- Twilio (WhatsApp)
- Google Vision (OCR alternatif)

---

## 🚀 Installation Rapide

### Prérequis
- Node.js 18+
- Compte Supabase (gratuit)
- Clé API Anthropic
- Compte Twilio (optionnel)

### 1. Cloner et installer

\`\`\`bash
git clone <votre-repo>
cd transport-adapte-dashboard
npm install
\`\`\`

### 2. Configuration Supabase

#### a) Créer un projet sur [supabase.com](https://supabase.com)

#### b) Exécuter le SQL suivant dans l'éditeur SQL:

\`\`\`sql
-- Table Utilisateurs
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  name VARCHAR(100),
  transport_company VARCHAR(100),
  status VARCHAR(20) DEFAULT 'owner',
  subscription_tier VARCHAR(20) DEFAULT 'basic',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table Revenus
CREATE TABLE revenues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  company VARCHAR(50),
  type VARCHAR(30) DEFAULT 'regular',
  amount DECIMAL(10,2) NOT NULL,
  hours_worked DECIMAL(5,2),
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table Dépenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category VARCHAR(50),
  subcategory VARCHAR(50),
  amount DECIMAL(10,2) NOT NULL,
  vendor VARCHAR(100),
  description TEXT,
  receipt_url VARCHAR(500),
  is_tax_deductible BOOLEAN DEFAULT true,
  ai_confidence DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table Véhicules
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  make VARCHAR(50),
  model VARCHAR(50),
  year INT,
  license_plate VARCHAR(20),
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  current_mileage INT,
  last_maintenance_date DATE,
  next_maintenance_mileage INT
);

-- Table AI Insights
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50),
  severity VARCHAR(20),
  title VARCHAR(200),
  message TEXT,
  action_required BOOLEAN DEFAULT false,
  dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table Historique Chat
CREATE TABLE chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question TEXT,
  answer TEXT,
  context JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Créer le bucket pour les factures
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true);

-- Index pour performance
CREATE INDEX idx_expenses_user_date ON expenses(user_id, date);
CREATE INDEX idx_revenues_user_date ON revenues(user_id, date);
CREATE INDEX idx_expenses_category ON expenses(category);
\`\`\`

### 3. Variables d'environnement

Copier `.env.example` vers `.env.local`:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Remplir avec vos vraies clés:

\`\`\`bash
# Supabase (depuis Settings > API dans votre projet)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Anthropic (depuis console.anthropic.com)
ANTHROPIC_API_KEY=sk-ant-api03-xxx

# Twilio (optionnel - depuis console.twilio.com)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+15551234567

# Make.com (optionnel)
MAKE_WEBHOOK_URL=https://hook.make.com/xxx
\`\`\`

### 4. Lancer en développement

\`\`\`bash
npm run dev
\`\`\`

Ouvrir [http://localhost:3000](http://localhost:3000)

---

## 📖 Utilisation

### Scanner une facture

1. Aller sur le dashboard
2. Cliquer "Scanner une facture"
3. Prendre photo ou uploader image
4. L'IA va automatiquement:
   - Extraire le texte (OCR)
   - Identifier date, montant, vendeur
   - Classifier la catégorie
   - Sauvegarder en base de données
   - Détecter si c'est une anomalie

### Voir les insights mensuels

1. Les insights sont générés automatiquement
2. Affichés sur le dashboard principal
3. Incluent:
   - Détection d'anomalies
   - Comparaisons vs mois précédent
   - Recommandations actionnables
   - Prévisions mois prochain

### Poser des questions (Chatbot)

Interface chat disponible pour:
- "Combien j'ai fait cette semaine?"
- "Pourquoi mes dépenses d'essence ont augmenté?"
- "Suis-je rentable ce mois?"

---

## 🚀 Déploiement

### Vercel (Recommandé)

\`\`\`bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# En production
vercel --prod
\`\`\`

### Variables d'environnement sur Vercel

1. Aller dans Project Settings > Environment Variables
2. Ajouter toutes les variables de `.env.local`
3. Redéployer

---

## 🔄 Workflow Make.com

Le fichier `make-workflow-blueprint.json` contient 5 scénarios:

### Scenario 1: Scan Automatique
- Reçoit factures par email
- Scanne et classifie avec IA
- Envoie confirmation WhatsApp

### Scenario 2: Insights Mensuels
- Lance le 1er de chaque mois
- Génère insights pour tous
- Envoie rapports WhatsApp + Email

### Scenario 3: Alertes Anomalies
- Détection temps réel
- Notification immédiate
- Suggestions d'action

### Scenario 4: Rappels Entretien
- Basé sur kilométrage/date
- Rappels automatiques
- Planning proactif

### Scenario 5: Export Comptable
- Fin de mois automatique
- Génère Excel complet
- Envoie au comptable

### Installation Make.com

1. Créer compte sur [make.com](https://make.com)
2. Importer `make-workflow-blueprint.json`
3. Configurer connexions (Supabase, Twilio, Email)
4. Remplacer URLs par votre domaine de production
5. Tester chaque scénario
6. Activer

---

## 💰 Modèle de Monétisation

### Tiers proposés

**Basic - 39$/mois**
- Dashboard complet
- Scan manuel factures
- Insights mensuels
- Support email

**Pro - 59$/mois** (Recommandé)
- Tout Basic +
- Scan automatique par email
- Chatbot IA illimité
- Alertes anomalies temps réel
- Notifications WhatsApp
- Support prioritaire

**Premium - 99$/mois**
- Tout Pro +
- Export comptable automatique
- Optimisation fiscale IA
- Rappels entretien
- Rapports personnalisés
- Conseiller dédié

### Calcul de rentabilité

**À 100 utilisateurs (mix 40% Basic, 50% Pro, 10% Premium):**

Revenus: `(40 × 39$) + (50 × 59$) + (10 × 99$) = 5,440$/mois`

Coûts estimés:
- Infrastructure: 200$/mois
- APIs (Claude, OCR): 300$/mois
- Twilio: 100$/mois
- Support: 500$/mois
**Total:** 1,100$/mois

**Profit net: 4,340$/mois (79% de marge)**

---

## 🎯 Roadmap

### Phase 1 (MVP - Mois 1-2) ✅
- [x] Dashboard basique
- [x] Scan factures avec IA
- [x] Insights mensuels
- [x] API complètes

### Phase 2 (Mois 3-4)
- [ ] App mobile (React Native)
- [ ] Intégration bancaire (Plaid)
- [ ] Prévisions IA avancées
- [ ] Marketplace d'assurances

### Phase 3 (Mois 5-6)
- [ ] Plateforme multi-utilisateurs
- [ ] Tableau de bord gestionnaire de flotte
- [ ] API publique pour partenaires
- [ ] Programme de parrainage

---

## 🤝 Support

**Email:** support@votreapp.com
**WhatsApp:** +1-XXX-XXX-XXXX
**Documentation:** docs.votreapp.com

---

## 📄 Licence

Propriétaire - Tous droits réservés

---

## 👨‍💻 Développé par

Brams - AI Agency Morocco/Québec

Pour questions techniques: dev@votreapp.com
\`\`\`

---

**🎉 Vous êtes prêt à lancer!**

Suivez le guide d'installation ci-dessus et vous aurez une application fonctionnelle en moins de 30 minutes.
