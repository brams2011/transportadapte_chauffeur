import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * API Route: POST /api/expenses/save
 *
 * Sauvegarde une dépense après validation par l'utilisateur
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      date,
      category,
      subcategory,
      amount,
      vendor,
      description,
      receipt_url,
      is_tax_deductible,
      deductible_percentage,
      ai_confidence,
      notes
    } = body;

    // Validation des champs requis
    if (!user_id || !date || !category || !amount || !vendor) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Saving expense:', { user_id, category, amount, vendor });

    // Sauvegarder dans la base de données
    const { data: expense, error: dbError } = await supabase
      .from('expenses')
      .insert({
        user_id,
        date,
        category,
        subcategory,
        amount: parseFloat(amount),
        vendor,
        description: description || `${vendor} - ${category}`,
        receipt_url: receipt_url || null,
        is_tax_deductible: is_tax_deductible !== false,
        ai_confidence: ai_confidence || 0.8
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error saving expense:', dbError);
      return NextResponse.json(
        { error: 'Failed to save expense', details: dbError.message },
        { status: 500 }
      );
    }

    // Vérifier si c'est une anomalie (détection simple)
    const { data: historicalExpenses } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', user_id)
      .eq('category', category)
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('date', { ascending: false });

    if (historicalExpenses && historicalExpenses.length > 3) {
      const amounts = historicalExpenses.map(e => e.amount);
      const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;

      // Détection simple: si montant > 150% de la moyenne
      if (amount > avg * 1.5) {
        const percentage = ((amount / avg - 1) * 100).toFixed(0);
        await supabase.from('ai_insights').insert({
          user_id,
          type: 'anomaly',
          severity: amount > avg * 2 ? 'critical' : 'warning',
          title: `Dépense inhabituelle: ${category}`,
          message: `Cette dépense (${amount}$) est ${percentage}% plus élevée que votre moyenne (${avg.toFixed(2)}$)`,
          action_required: amount > avg * 2
        });
      }
    }

    return NextResponse.json({
      success: true,
      expense,
      message: 'Expense saved successfully'
    });

  } catch (error) {
    console.error('Error in save expense:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
