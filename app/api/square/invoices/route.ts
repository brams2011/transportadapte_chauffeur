// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { squareClient, SQUARE_LOCATION_ID } from '@/lib/square';

// GET /api/square/invoices
export async function GET() {
  try {
    const response = await squareClient.invoices.list({
      locationId: SQUARE_LOCATION_ID,
    } as any);

    const invoices = (response.result?.invoices || []).map((inv: any) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      status: inv.status,
      title: inv.title || null,
      description: inv.description || null,
      amount: inv.paymentRequests?.[0]?.computedAmountMoney
        ? Number(inv.paymentRequests[0].computedAmountMoney.amount) / 100
        : 0,
      currency: inv.paymentRequests?.[0]?.computedAmountMoney?.currency || 'CAD',
      dueDate: inv.paymentRequests?.[0]?.dueDate || null,
      publicUrl: inv.publicUrl || null,
      createdAt: inv.createdAt,
      recipientName: inv.primaryRecipient?.givenName
        ? `${inv.primaryRecipient.givenName} ${inv.primaryRecipient.familyName || ''}`
        : inv.primaryRecipient?.companyName || 'N/A',
    }));

    return NextResponse.json({ success: true, invoices });
  } catch (error) {
    console.error('Error fetching Square invoices:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur Square' },
      { status: 500 }
    );
  }
}

// POST /api/square/invoices — Créer une facture
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerName, customerEmail, amount, description, dueDate } = body;

    if (!amount || !customerEmail) {
      return NextResponse.json({ error: 'Montant et email requis' }, { status: 400 });
    }

    const amountInCents = Math.round(parseFloat(amount) * 100);

    // Chercher ou créer le client
    let customerId: string;

    const searchRes = await squareClient.customers.search({
      query: {
        filter: {
          emailAddress: { exact: customerEmail },
        },
      },
    });

    if (searchRes.result?.customers && searchRes.result.customers.length > 0) {
      customerId = searchRes.result.customers[0].id!;
    } else {
      const nameParts = (customerName || '').split(' ');
      const createRes = await squareClient.customers.create({
        givenName: nameParts[0] || 'Client',
        familyName: nameParts.slice(1).join(' ') || '',
        emailAddress: customerEmail,
      });
      customerId = createRes.result?.customer?.id!;
    }

    // Créer la facture
    const invoiceRes = await squareClient.invoices.create({
      invoice: {
        locationId: SQUARE_LOCATION_ID,
        primaryRecipient: { customerId },
        paymentRequests: [
          {
            requestType: 'BALANCE',
            dueDate: dueDate || undefined,
          },
        ],
        title: description || 'Service de transport',
        deliveryMethod: 'EMAIL',
      },
      idempotencyKey: `inv-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    });

    const invoiceId = invoiceRes.result?.invoice?.id;

    if (!invoiceId) {
      throw new Error('Facture créée mais ID manquant');
    }

    // Ajouter un line item via orders n'est pas nécessaire pour les factures simples
    // On publie directement la facture
    const publishRes = await squareClient.invoices.publish({
      invoiceId,
      version: invoiceRes.result?.invoice?.version || 0,
      idempotencyKey: `pub-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    });

    return NextResponse.json({
      success: true,
      invoice: {
        id: publishRes.result?.invoice?.id,
        invoiceNumber: publishRes.result?.invoice?.invoiceNumber,
        status: publishRes.result?.invoice?.status,
        publicUrl: publishRes.result?.invoice?.publicUrl,
      },
    });
  } catch (error) {
    console.error('Error creating Square invoice:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la création' },
      { status: 500 }
    );
  }
}
