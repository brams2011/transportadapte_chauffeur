-- ====================================
-- Table: tournees (Courses / Tournées)
-- ====================================
-- Stocke les revenus de courses des chauffeurs

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

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_tournees_user_id ON tournees(user_id);
CREATE INDEX IF NOT EXISTS idx_tournees_date ON tournees(date DESC);
CREATE INDEX IF NOT EXISTS idx_tournees_user_date ON tournees(user_id, date DESC);

-- RLS (Row Level Security) - Permettre accès avec anon key
ALTER TABLE tournees ENABLE ROW LEVEL SECURITY;

-- Politique: Tous les utilisateurs authentifiés ou anonymes peuvent lire leurs données
CREATE POLICY "Allow all operations on tournees" ON tournees
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ====================================
-- Table: revenues (si elle n'existe pas déjà)
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
-- Table: expenses (si elle n'existe pas déjà)
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
-- Table: ai_insights (si elle n'existe pas déjà)
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
-- Table: users (si elle n'existe pas déjà)
-- ====================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  transport_company TEXT,
  status TEXT DEFAULT 'owner',
  subscription_tier TEXT DEFAULT 'basic',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on users" ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);
