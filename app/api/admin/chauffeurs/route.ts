import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/admin/chauffeurs
export async function GET() {
  try {
    // Tous les chauffeurs
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Pour chaque chauffeur, récupérer stats
    const chauffeurs = await Promise.all(
      (users || []).map(async (user: any) => {
        // Revenus
        const { data: revenues } = await supabase
          .from('revenues')
          .select('amount')
          .eq('user_id', user.id);

        const totalRevenus = revenues?.reduce((sum: number, r: any) => sum + (r.amount || 0), 0) || 0;

        // Dépenses
        const { data: expenses } = await supabase
          .from('expenses')
          .select('amount')
          .eq('user_id', user.id);

        const totalDepenses = expenses?.reduce((sum: number, r: any) => sum + (r.amount || 0), 0) || 0;

        // Véhicules
        const { data: vehicules } = await supabase
          .from('vehicules')
          .select('id')
          .eq('user_id', user.id);

        // Tournées
        const { data: tournees } = await supabase
          .from('tournees')
          .select('id')
          .eq('user_id', user.id);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          transport_company: user.transport_company,
          status: user.status,
          actif: user.actif !== false,
          subscription_tier: user.subscription_tier,
          created_at: user.created_at,
          stats: {
            totalRevenus,
            totalDepenses,
            profit: totalRevenus - totalDepenses,
            nbVehicules: vehicules?.length || 0,
            nbTournees: tournees?.length || 0,
          },
        };
      })
    );

    return NextResponse.json({ success: true, chauffeurs });
  } catch (error) {
    console.error('Admin chauffeurs error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/chauffeurs — Modifier chauffeur (actif, abonnement, etc.)
export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    // Filtrer les champs autorisés
    const allowedFields = ['actif', 'subscription_tier', 'status'];
    const safeUpdates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in updates) safeUpdates[key] = updates[key];
    }

    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json({ error: 'Aucun champ à modifier' }, { status: 400 });
    }

    const { error } = await supabase
      .from('users')
      .update(safeUpdates)
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin update chauffeur error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/chauffeurs?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    // Supprimer le chauffeur (les cascades s'occupent des données liées)
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete chauffeur error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
