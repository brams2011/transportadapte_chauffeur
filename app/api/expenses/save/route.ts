import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/expenses/save
 * Sauvegarde une dépense après révision par l'utilisateur
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, vendor, date, amount, category, subcategory, tax_deductible, confidence, notes } = body;

    if (!user_id || !amount || !category) {
      return NextResponse.json(
        { error: 'user_id, amount et category sont requis' },
        { status: 400 }
      );
    }

    const { data: expense, error: dbError } = await supabase
      .from('expenses')
      .insert({
        user_id,
        date: date || new Date().toISOString().split('T')[0],
        category,
        subcategory: subcategory || null,
        amount: parseFloat(amount),
        vendor: vendor || 'Inconnu',
        description: notes || `${vendor || 'Inconnu'} - ${category}`,
        is_tax_deductible: tax_deductible ?? true,
        ai_confidence: confidence || null
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error saving expense:', dbError);
      return NextResponse.json(
        { error: 'Erreur lors de la sauvegarde', details: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      expense
    });
  } catch (error) {
    console.error('Error saving expense:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
