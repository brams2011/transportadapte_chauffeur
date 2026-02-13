import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/vehicules?user_id=xxx
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('user_id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('vehicules')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, vehicules: data || [] });
  } catch (error) {
    console.error('Error fetching vehicules:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/vehicules
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, nom, marque, modele, annee, plaque, vin, couleur, kilometrage_actuel, date_achat } = body;

    if (!user_id || !nom) {
      return NextResponse.json({ error: 'User ID et nom requis' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('vehicules')
      .insert({
        user_id,
        nom,
        marque: marque || null,
        modele: modele || null,
        annee: annee ? parseInt(annee) : null,
        plaque: plaque || null,
        vin: vin || null,
        couleur: couleur || null,
        kilometrage_actuel: kilometrage_actuel ? parseFloat(kilometrage_actuel) : 0,
        date_achat: date_achat || null,
        statut: 'actif',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, vehicule: data });
  } catch (error) {
    console.error('Error creating vehicule:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT /api/vehicules
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('vehicules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, vehicule: data });
  } catch (error) {
    console.error('Error updating vehicule:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/vehicules?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const { error } = await supabase
      .from('vehicules')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vehicule:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
