import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/vehicules/entretiens?vehicule_id=xxx ou ?user_id=xxx
export async function GET(request: NextRequest) {
  try {
    const vehiculeId = request.nextUrl.searchParams.get('vehicule_id');
    const userId = request.nextUrl.searchParams.get('user_id');

    if (!vehiculeId && !userId) {
      return NextResponse.json({ error: 'vehicule_id ou user_id requis' }, { status: 400 });
    }

    let query = supabase.from('entretiens').select('*');

    if (vehiculeId) {
      query = query.eq('vehicule_id', vehiculeId);
    } else if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, entretiens: data || [] });
  } catch (error) {
    console.error('Error fetching entretiens:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/vehicules/entretiens
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vehicule_id, user_id, type, description, date_effectue, date_prochain, km_effectue, km_prochain, cout, statut, notes } = body;

    if (!vehicule_id || !user_id || !type) {
      return NextResponse.json({ error: 'vehicule_id, user_id et type requis' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('entretiens')
      .insert({
        vehicule_id,
        user_id,
        type,
        description: description || null,
        date_effectue: date_effectue || null,
        date_prochain: date_prochain || null,
        km_effectue: km_effectue ? parseFloat(km_effectue) : null,
        km_prochain: km_prochain ? parseFloat(km_prochain) : null,
        cout: cout ? parseFloat(cout) : 0,
        statut: statut || 'planifie',
        notes: notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, entretien: data });
  } catch (error) {
    console.error('Error creating entretien:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT /api/vehicules/entretiens
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('entretiens')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, entretien: data });
  } catch (error) {
    console.error('Error updating entretien:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/vehicules/entretiens?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const { error } = await supabase
      .from('entretiens')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting entretien:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
