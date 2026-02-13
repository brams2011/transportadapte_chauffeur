import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/admin/vehicules — Tous les véhicules de tous les chauffeurs
export async function GET() {
  try {
    const { data: vehicules, error } = await supabase
      .from('vehicules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Récupérer les infos chauffeur pour chaque véhicule
    const userIds = Array.from(new Set((vehicules || []).map((v: any) => v.user_id)));

    const { data: users } = await supabase
      .from('users')
      .select('id, name, email, transport_company')
      .in('id', userIds);

    const usersMap = new Map((users || []).map((u: any) => [u.id, u]));

    // Récupérer le dernier entretien pour chaque véhicule
    const { data: entretiens } = await supabase
      .from('entretiens')
      .select('vehicule_id, type, date_effectue, statut')
      .order('created_at', { ascending: false });

    const dernierEntretienMap = new Map<string, any>();
    (entretiens || []).forEach((e: any) => {
      if (!dernierEntretienMap.has(e.vehicule_id)) {
        dernierEntretienMap.set(e.vehicule_id, e);
      }
    });

    const flotte = (vehicules || []).map((v: any) => {
      const chauffeur = usersMap.get(v.user_id);
      const dernierEntretien = dernierEntretienMap.get(v.id);

      return {
        id: v.id,
        nom: v.nom,
        marque: v.marque,
        modele: v.modele,
        annee: v.annee,
        plaque: v.plaque,
        couleur: v.couleur,
        kilometrage: v.kilometrage_actuel,
        statut: v.statut,
        chauffeur: chauffeur ? {
          name: chauffeur.name,
          email: chauffeur.email,
          company: chauffeur.transport_company,
        } : null,
        dernierEntretien: dernierEntretien ? {
          type: dernierEntretien.type,
          date: dernierEntretien.date_effectue,
          statut: dernierEntretien.statut,
        } : null,
      };
    });

    return NextResponse.json({ success: true, flotte });
  } catch (error) {
    console.error('Admin vehicules error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
