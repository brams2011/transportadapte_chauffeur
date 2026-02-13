// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { squareClient, SQUARE_LOCATION_ID } from '@/lib/square';

// GET /api/square/transactions?cursor=xxx
export async function GET(request: NextRequest) {
  try {
    const cursor = request.nextUrl.searchParams.get('cursor') || undefined;

    const response = await squareClient.payments.list({
      locationId: SQUARE_LOCATION_ID,
      cursor,
      sortOrder: 'DESC',
    });

    const payments = response.result?.payments || [];

    const transactions = payments.map((p: any) => ({
      id: p.id,
      amount: p.amountMoney ? Number(p.amountMoney.amount) / 100 : 0,
      currency: p.amountMoney?.currency || 'CAD',
      status: p.status,
      sourceType: p.sourceType,
      cardBrand: p.cardDetails?.card?.cardBrand || null,
      cardLast4: p.cardDetails?.card?.last4 || null,
      receiptUrl: p.receiptUrl || null,
      createdAt: p.createdAt,
      note: p.note || null,
    }));

    return NextResponse.json({
      success: true,
      transactions,
      cursor: response.result?.cursor || null,
    });
  } catch (error) {
    console.error('Error fetching Square transactions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur Square' },
      { status: 500 }
    );
  }
}
