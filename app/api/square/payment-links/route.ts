// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { squareClient } from '@/lib/square';

// GET /api/square/payment-links
export async function GET() {
  try {
    const response = await squareClient.checkout.paymentLinks.list();

    const links = (response.result?.paymentLinks || []).map((link: any) => ({
      id: link.id,
      url: link.url || link.longUrl,
      description: link.description || null,
      amount: link.checkoutOptions?.acceptedPaymentMethods ? null :
        link.orderTemplate?.lineItems?.[0]?.basePriceMoney
          ? Number(link.orderTemplate.lineItems[0].basePriceMoney.amount) / 100
          : null,
      createdAt: link.createdAt,
    }));

    return NextResponse.json({ success: true, links });
  } catch (error) {
    console.error('Error fetching payment links:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur Square' },
      { status: 500 }
    );
  }
}

// POST /api/square/payment-links — Créer un lien de paiement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, description, customerName } = body;

    if (!amount) {
      return NextResponse.json({ error: 'Montant requis' }, { status: 400 });
    }

    const amountInCents = Math.round(parseFloat(amount) * 100);

    const response = await squareClient.checkout.paymentLinks.create({
      idempotencyKey: `pl-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      quickPay: {
        name: description || `Transport - ${customerName || 'Client'}`,
        priceMoney: {
          amount: BigInt(amountInCents),
          currency: 'CAD',
        },
        locationId: process.env.SQUARE_LOCATION_ID!,
      },
    });

    return NextResponse.json({
      success: true,
      link: {
        id: response.result?.paymentLink?.id,
        url: response.result?.paymentLink?.url || response.result?.paymentLink?.longUrl,
      },
    });
  } catch (error) {
    console.error('Error creating payment link:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la création' },
      { status: 500 }
    );
  }
}
