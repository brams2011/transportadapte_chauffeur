import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_PROMPTS } from './claude-prompts';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Service pour toutes les interactions avec Claude AI
 */

// Classification automatique de factures
export async function classifyReceipt(ocrText: string) {
  const prompt = CLAUDE_PROMPTS.receiptClassification.replace('{ocr_text}', ocrText);

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.3, // Basse température pour classification précise
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    // Parser le JSON retourné par Claude
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response');
    }

    const classification = JSON.parse(jsonMatch[0]);
    
    return {
      success: true,
      data: classification,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens
      }
    };
  } catch (error) {
    console.error('Error classifying receipt:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    };
  }
}

// Génération d'insights mensuels
export async function generateMonthlyInsights(financialData: {
  current_month: string;
  total_revenue: number;
  revenue_breakdown: Record<string, number>;
  total_hours: number;
  avg_hourly_rate: number;
  total_expenses: number;
  fuel_expenses: number;
  maintenance_expenses: number;
  insurance_expenses: number;
  other_expenses: number;
  net_profit: number;
  profit_margin: number;
  previous_month: string;
  prev_revenue: number;
  prev_expenses: number;
  prev_profit: number;
  historical_data: any[];
}) {
  let prompt = CLAUDE_PROMPTS.monthlyInsights;
  
  // Remplacer toutes les variables
  Object.entries(financialData).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    const replacement = typeof value === 'object' ? JSON.stringify(value) : String(value);
    prompt = prompt.replace(new RegExp(placeholder, 'g'), replacement);
  });

  // Calculer les pourcentages
  const total = financialData.total_expenses;
  prompt = prompt.replace('{fuel_percentage}', ((financialData.fuel_expenses / total) * 100).toFixed(1));
  prompt = prompt.replace('{maintenance_percentage}', ((financialData.maintenance_expenses / total) * 100).toFixed(1));
  prompt = prompt.replace('{insurance_percentage}', ((financialData.insurance_expenses / total) * 100).toFixed(1));
  prompt = prompt.replace('{other_percentage}', ((financialData.other_expenses / total) * 100).toFixed(1));

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.5,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response');
    }

    const insights = JSON.parse(jsonMatch[0]);
    
    return {
      success: true,
      data: insights,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens
      }
    };
  } catch (error) {
    console.error('Error generating insights:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    };
  }
}

// Chatbot conversationnel
export async function chatWithAssistant(
  userQuestion: string,
  userContext: {
    current_month_revenue: number;
    current_month_expenses: number;
    current_profit: number;
    top_expense_categories: string[];
  },
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
) {
  let systemPrompt = CLAUDE_PROMPTS.chatbot;
  
  // Remplacer le contexte
  systemPrompt = systemPrompt.replace('{user_context}', JSON.stringify(userContext));
  systemPrompt = systemPrompt.replace('{current_month_revenue}', userContext.current_month_revenue.toString());
  systemPrompt = systemPrompt.replace('{current_month_expenses}', userContext.current_month_expenses.toString());
  systemPrompt = systemPrompt.replace('{current_profit}', userContext.current_profit.toString());
  systemPrompt = systemPrompt.replace('{top_expense_categories}', userContext.top_expense_categories.join(', '));

  try {
    const messages = [
      ...conversationHistory,
      {
        role: 'user' as const,
        content: userQuestion
      }
    ];

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      temperature: 0.7,
      system: systemPrompt,
      messages: messages
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    return {
      success: true,
      response: responseText,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens
      }
    };
  } catch (error) {
    console.error('Error in chat:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      response: 'Désolé, j\'ai rencontré une erreur. Peux-tu reformuler ta question?'
    };
  }
}

// Détection d'anomalies
export async function detectAnomaly(expenseData: {
  date: string;
  category: string;
  amount: number;
  vendor: string;
  avg_amount: number;
  median_amount: number;
  min_amount: number;
  max_amount: number;
  count: number;
  category_total: number;
  trend: string;
}) {
  let prompt = CLAUDE_PROMPTS.anomalyDetection;
  
  Object.entries(expenseData).forEach(([key, value]) => {
    prompt = prompt.replace(`{${key}}`, String(value));
  });

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response');
    }

    const anomalyResult = JSON.parse(jsonMatch[0]);
    
    return {
      success: true,
      data: anomalyResult
    };
  } catch (error) {
    console.error('Error detecting anomaly:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    };
  }
}

// Optimisation fiscale
export async function analyzeTaxOptimization(taxData: {
  year: number;
  expenses_by_category: Record<string, number>;
  status: string;
  annual_revenue: number;
}) {
  let prompt = CLAUDE_PROMPTS.taxOptimization;
  
  prompt = prompt.replace('{year}', String(taxData.year));
  prompt = prompt.replace('{expenses_by_category}', JSON.stringify(taxData.expenses_by_category, null, 2));
  prompt = prompt.replace('{status}', taxData.status);
  prompt = prompt.replace('{annual_revenue}', String(taxData.annual_revenue));

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      temperature: 0.4,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response');
    }

    const taxAnalysis = JSON.parse(jsonMatch[0]);
    
    return {
      success: true,
      data: taxAnalysis,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens
      }
    };
  } catch (error) {
    console.error('Error analyzing tax optimization:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    };
  }
}

export const ClaudeService = {
  classifyReceipt,
  generateMonthlyInsights,
  chatWithAssistant,
  detectAnomaly,
  analyzeTaxOptimization
};
