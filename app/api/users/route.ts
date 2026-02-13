import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/users?email=xxx
 * Rechercher un utilisateur par email ou lister tous les utilisateurs
 */
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');

    if (email) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        return NextResponse.json({ success: false, user: null });
      }

      return NextResponse.json({ success: true, user: data });
    }

    // Lister tous les utilisateurs
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, users: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Créer un nouvel utilisateur
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, transport_company, status } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Nom et courriel sont obligatoires' },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Un compte existe déjà avec ce courriel' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('users')
      .insert({
        name,
        email,
        phone: phone || null,
        transport_company: transport_company || null,
        status: status || 'owner',
        subscription_tier: 'basic',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
