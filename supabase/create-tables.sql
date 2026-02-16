-- ====================================================================
-- SCHÉMA COMPLET - Ino-Service (Transport Adapté)
-- Nouveau projet Supabase - Février 2026
-- Compatible avec Supabase Auth (mot de passe + OTP SMS)
-- ====================================================================
-- INSTRUCTIONS :
-- 1. Allez dans votre dashboard Supabase → SQL Editor
-- 2. Collez tout ce fichier et exécutez-le
-- ====================================================================

-- ====================================
-- Table: users (Profils des chauffeurs)
-- ====================================
-- Liée à auth.users via l'ID UUID de Supabase Auth
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  transport_company TEXT,
  status TEXT DEFAULT 'owner',
  subscription_tier TEXT DEFAULT 'basic',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on users" ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ====================================
-- Table: tournees (Courses / Tournées)
-- ====================================
CREATE TABLE IF NOT EXISTS tournees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL DEFAULT 'Revenu de tournée',
  montant DECIMAL(10,2) NOT NULL,
  compagnie TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tournees_user_id ON tournees(user_id);
CREATE INDEX IF NOT EXISTS idx_tournees_date ON tournees(date DESC);
CREATE INDEX IF NOT EXISTS idx_tournees_user_date ON tournees(user_id, date DESC);

ALTER TABLE tournees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on tournees" ON tournees
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ====================================
-- Table: revenues (Revenus)
-- ====================================
CREATE TABLE IF NOT EXISTS revenues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  company TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'regular',
  amount DECIMAL(10,2) NOT NULL,
  hours_worked DECIMAL(5,2),
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenues_user_id ON revenues(user_id);
CREATE INDEX IF NOT EXISTS idx_revenues_date ON revenues(date DESC);

ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on revenues" ON revenues
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ====================================
-- Table: expenses (Dépenses)
-- ====================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL,
  subcategory TEXT,
  amount DECIMAL(10,2) NOT NULL,
  vendor TEXT,
  description TEXT,
  receipt_url TEXT,
  is_tax_deductible BOOLEAN DEFAULT false,
  ai_confidence DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on expenses" ON expenses
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ====================================
-- Table: ai_insights (Insights IA)
-- ====================================
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'recommendation',
  severity TEXT DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_required BOOLEAN DEFAULT false,
  dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id);

ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on ai_insights" ON ai_insights
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ====================================
-- Table: vehicules (Véhicules des chauffeurs)
-- ====================================
CREATE TABLE IF NOT EXISTS vehicules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  nom TEXT NOT NULL,
  marque TEXT,
  modele TEXT,
  annee INTEGER,
  plaque TEXT,
  vin TEXT,
  couleur TEXT,
  kilometrage_actuel DECIMAL(10,1) DEFAULT 0,
  date_achat DATE,
  statut TEXT DEFAULT 'actif',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicules_user_id ON vehicules(user_id);

ALTER TABLE vehicules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on vehicules" ON vehicules
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ====================================
-- Table: entretiens (Entretiens véhicules)
-- ====================================
CREATE TABLE IF NOT EXISTS entretiens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicule_id UUID REFERENCES vehicules(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  date_effectue DATE,
  date_prochain DATE,
  km_effectue DECIMAL(10,1),
  km_prochain DECIMAL(10,1),
  cout DECIMAL(10,2) DEFAULT 0,
  statut TEXT DEFAULT 'planifie',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entretiens_vehicule_id ON entretiens(vehicule_id);
CREATE INDEX IF NOT EXISTS idx_entretiens_user_id ON entretiens(user_id);

ALTER TABLE entretiens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on entretiens" ON entretiens
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ====================================
-- Table: kilometrage_logs (Suivi kilométrage)
-- ====================================
CREATE TABLE IF NOT EXISTS kilometrage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicule_id UUID REFERENCES vehicules(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  kilometrage DECIMAL(10,1) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_km_logs_vehicule_id ON kilometrage_logs(vehicule_id);
CREATE INDEX IF NOT EXISTS idx_km_logs_date ON kilometrage_logs(date DESC);

ALTER TABLE kilometrage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on kilometrage_logs" ON kilometrage_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ====================================
-- Table: chat_history (Historique chatbot)
-- ====================================
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);

ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on chat_history" ON chat_history
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ====================================
-- Storage bucket: receipts (Photos de factures)
-- ====================================
-- Note: Créez le bucket manuellement dans Supabase → Storage → New Bucket
-- Nom: receipts | Public: Oui

-- ====================================
-- FIN DU SCHÉMA
-- ====================================
