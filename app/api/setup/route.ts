import { NextResponse } from 'next/server';

/**
 * GET /api/setup
 * Crée les tables manquantes dans Supabase via l'API SQL
 */
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const sql = `
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

    ALTER TABLE tournees ENABLE ROW LEVEL SECURITY;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'tournees' AND policyname = 'Allow all operations on tournees'
      ) THEN
        CREATE POLICY "Allow all operations on tournees" ON tournees FOR ALL USING (true) WITH CHECK (true);
      END IF;
    END $$;
  `;

  try {
    // Utiliser l'endpoint SQL de Supabase (via pg-meta)
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      // Si l'endpoint RPC ne fonctionne pas, retourner le SQL à exécuter manuellement
      return NextResponse.json({
        success: false,
        message: 'Impossible de créer les tables automatiquement. Veuillez exécuter le SQL ci-dessous dans le SQL Editor de Supabase.',
        sql: sql,
        instructions: [
          '1. Allez sur https://supabase.com/dashboard',
          '2. Sélectionnez votre projet',
          '3. Cliquez sur "SQL Editor" dans le menu de gauche',
          '4. Collez le SQL ci-dessus et cliquez sur "Run"',
        ],
      });
    }

    return NextResponse.json({ success: true, message: 'Tables créées avec succès!' });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Erreur lors de la création des tables. Exécutez le SQL manuellement.',
      sql: sql,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
