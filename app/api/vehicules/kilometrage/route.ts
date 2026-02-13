import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/vehicules/kilometrage?vehicule_id=xxx
export async function GET(request: NextRequest) {
  try {
    const vehiculeId = request.nextUrl.searchParams.get('vehicule_id');
    if (!vehiculeId) {
      return NextResponse.json({ error: 'vehicule_id requis' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('kilometrage_logs')
      .select('*')
      .eq('vehicule_id', vehiculeId)
      .order('date', { ascending: false })
      .limit(20);

    if (error) throw error;

    return NextResponse.json({ success: true, logs: data || [] });
  } catch (error) {
    console.error('Error fetching km logs:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/vehicules/kilometrage
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vehicule_id, user_id, date, kilometrage, notes } = body;

    if (!vehicule_id || !user_id || !kilometrage) {
      return NextResponse.json({ error: 'vehicule_id, user_id et kilometrage requis' }, { status: 400 });
    }

    const km = parseFloat(kilometrage);

    // Insérer le log
    const { data, error } = await supabase
      .from('kilometrage_logs')
      .insert({
        vehicule_id,
        user_id,
        date: date || new Date().toISOString().split('T')[0],
        kilometrage: km,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Mettre à jour le kilométrage actuel du véhicule
    await supabase
      .from('vehicules')
      .update({ kilometrage_actuel: km })
      .eq('id', vehicule_id);

    return NextResponse.json({ success: true, log: data });
  } catch (error) {
    console.error('Error saving km log:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
