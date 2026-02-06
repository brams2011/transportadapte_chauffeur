import { NextRequest, NextResponse } from 'next/server';
import { ClaudeService } from '@/lib/claude-service';
import { supabase } from '@/lib/supabase';
import { startOfMonth, endOfMonth } from 'date-fns';

/**
 * API Route: POST /api/chat
 * 
 * Chatbot conversationnel pour répondre aux questions sur les finances
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, question, conversation_history = [] } = body;

    if (!user_id || !question) {
      return NextResponse.json(
        { error: 'User ID and question required' },
        { status: 400 }
      );
    }

    console.log('Chat question from user:', user_id, '- Question:', question);

    // 1. Récupérer le contexte financier actuel de l'utilisateur
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());

    // Revenus du mois
    const { data: revenues } = await supabase
      .from('revenues')
      .select('amount')
      .eq('user_id', user_id)
      .gte('date', monthStart.toISOString())
      .lte('date', monthEnd.toISOString());

    const currentMonthRevenue = revenues?.reduce((sum, r) => sum + r.amount, 0) || 0;

    // Dépenses du mois
    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount, category')
      .eq('user_id', user_id)
      .gte('date', monthStart.toISOString())
      .lte('date', monthEnd.toISOString());

    const currentMonthExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
    const currentProfit = currentMonthRevenue - currentMonthExpenses;

    // Top 3 catégories de dépenses
    const categoryTotals = expenses?.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>) || {};

    const topExpenseCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category, amount]) => `${category}: ${amount.toFixed(2)}$`);

    const userContext = {
      current_month_revenue: currentMonthRevenue,
      current_month_expenses: currentMonthExpenses,
      current_profit: currentProfit,
      top_expense_categories: topExpenseCategories
    };

    // 2. Appeler Claude pour répondre
    const chatResponse = await ClaudeService.chatWithAssistant(
      question,
      userContext,
      conversation_history
    );

    if (!chatResponse.success) {
      return NextResponse.json(
        { error: 'Failed to get response', details: chatResponse.error },
        { status: 500 }
      );
    }

    // 3. Enregistrer la conversation (optionnel)
    await supabase.from('chat_history').insert({
      user_id: user_id,
      question: question,
      answer: chatResponse.response,
      context: userContext
    });

    return NextResponse.json({
      success: true,
      response: chatResponse.response,
      context: userContext,
      usage: chatResponse.usage
    });

  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
