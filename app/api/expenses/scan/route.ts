import { NextRequest, NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';
import { ClaudeService } from '@/lib/claude-service';
import { supabase } from '@/lib/supabase';
import formidable from 'formidable';
import fs from 'fs';

// Route handler dans App Router - pas besoin de config bodyParser

/**
 * API Route: POST /api/expenses/scan
 * 
 * Scan une facture (photo ou PDF), extrait le texte avec OCR,
 * classifie automatiquement avec Claude AI, et stocke en base de données
 */

export async function POST(request: NextRequest) {
  try {
    // 1. Récupérer le fichier uploadé
    const formData = await request.formData();
    const file = formData.get('receipt') as File;
    const userId = formData.get('user_id') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    console.log('Processing receipt:', file.name, 'Size:', file.size);

    // 2. Convertir le fichier en buffer pour OCR
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 3. OCR avec Tesseract.js (alternative gratuite à Google Vision)
    console.log('Starting OCR...');
    const worker = await createWorker('fra'); // Français
    
    const { data: { text: ocrText } } = await worker.recognize(buffer);
    await worker.terminate();

    console.log('OCR completed. Text length:', ocrText.length);
    
    if (!ocrText || ocrText.length < 10) {
      return NextResponse.json(
        { error: 'Could not extract text from image. Please ensure the image is clear.' },
        { status: 400 }
      );
    }

    // 4. Classification avec Claude AI
    console.log('Classifying receipt with Claude AI...');
    const classification = await ClaudeService.classifyReceipt(ocrText);

    if (!classification.success || !classification.data) {
      return NextResponse.json(
        { error: 'Failed to classify receipt', details: classification.error },
        { status: 500 }
      );
    }

    const expenseData = classification.data;

    // 5. Upload de l'image sur Supabase Storage
    const fileName = `${userId}/${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('receipts')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading receipt:', uploadError);
      // Continue quand même sans l'upload
    }

    const receiptUrl = uploadData 
      ? supabase.storage.from('receipts').getPublicUrl(uploadData.path).data.publicUrl
      : null;

    // 6. Sauvegarder dans la base de données
    const { data: expense, error: dbError } = await supabase
      .from('expenses')
      .insert({
        user_id: userId,
        date: expenseData.date,
        category: expenseData.category,
        subcategory: expenseData.subcategory,
        amount: expenseData.amount,
        vendor: expenseData.vendor,
        description: expenseData.notes || `${expenseData.vendor} - ${expenseData.category}`,
        receipt_url: receiptUrl,
        is_tax_deductible: expenseData.tax_deductible,
        ai_confidence: expenseData.confidence
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

    // 7. Vérifier si c'est une anomalie
    const { data: historicalExpenses } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', userId)
      .eq('category', expenseData.category)
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('date', { ascending: false });

    if (historicalExpenses && historicalExpenses.length > 0) {
      const amounts = historicalExpenses.map(e => e.amount);
      const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const median = amounts.sort((a, b) => a - b)[Math.floor(amounts.length / 2)];

      const anomalyCheck = await ClaudeService.detectAnomaly({
        date: expenseData.date,
        category: expenseData.category,
        amount: expenseData.amount,
        vendor: expenseData.vendor,
        avg_amount: avg,
        median_amount: median,
        min_amount: Math.min(...amounts),
        max_amount: Math.max(...amounts),
        count: amounts.length,
        category_total: amounts.reduce((a, b) => a + b, 0),
        trend: 'stable' // Simplification, à calculer réellement
      });

      // Si anomalie détectée, créer une alerte
      if (anomalyCheck.success && anomalyCheck.data?.is_anomaly) {
        await supabase.from('ai_insights').insert({
          user_id: userId,
          type: 'anomaly',
          severity: anomalyCheck.data.severity,
          title: `Dépense inhabituelle: ${expenseData.category}`,
          message: anomalyCheck.data.reason,
          action_required: anomalyCheck.data.should_alert_user
        });
      }
    }

    // 8. Retourner le résultat
    return NextResponse.json({
      success: true,
      expense: expense,
      classification: {
        category: expenseData.category,
        confidence: expenseData.confidence,
        items: expenseData.items
      },
      ocr_text: ocrText.substring(0, 500), // Premiers 500 chars pour debug
      message: 'Receipt processed successfully'
    });

  } catch (error) {
    console.error('Error processing receipt:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
