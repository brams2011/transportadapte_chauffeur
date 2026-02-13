import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/tournees?user_id=xxx
 * Récupère toutes les tournées d'un utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tournees')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching tournees:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, tournees: data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tournees
 * Crée une nouvelle tournée
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, date, type, montant, heures, compagnie, notes, transport_type } = body;

    if (!user_id || !montant) {
      return NextResponse.json(
        { error: 'user_id and montant are required' },
        { status: 400 }
      );
    }

    const tourneeDate = date || new Date().toISOString().split('T')[0];
    const tourneeType = type || 'Revenu de tournée';
    const tourneeMontant = parseFloat(montant);

    const transportType = transport_type || 'adapte';

    const { data, error } = await supabase
      .from('tournees')
      .insert({
        user_id,
        date: tourneeDate,
        type: tourneeType,
        montant: tourneeMontant,
        heures: heures ? parseFloat(heures) : null,
        compagnie: compagnie || null,
        notes: notes || null,
        transport_type: transportType,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating tournee:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Synchroniser avec la table revenues pour le Dashboard
    await supabase.from('revenues').insert({
      user_id,
      date: tourneeDate,
      company: compagnie || 'Transport',
      type: 'regular',
      amount: tourneeMontant,
      hours_worked: heures ? parseFloat(heures) : null,
      description: `${tourneeType}${notes ? ' - ' + notes : ''}`,
      status: 'paid',
      transport_type: transportType,
    });

    return NextResponse.json({ success: true, tournee: data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tournees?id=xxx
 * Supprime une tournée
 */
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    // Récupérer la tournée avant suppression pour sync revenues
    const { data: tournee } = await supabase
      .from('tournees')
      .select('user_id, date, montant')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('tournees')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting tournee:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Supprimer le revenu correspondant
    if (tournee) {
      await supabase
        .from('revenues')
        .delete()
        .eq('user_id', tournee.user_id)
        .eq('date', tournee.date)
        .eq('amount', tournee.montant);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
