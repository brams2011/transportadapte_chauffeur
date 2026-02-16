import { NextRequest, NextResponse } from 'next/server';
import { otpStore } from '@/lib/otp-store';

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  if (cleaned.length === 10 && !cleaned.startsWith('+')) {
    cleaned = '+1' + cleaned;
  }
  if (!cleaned.startsWith('+') && cleaned.length === 11 && cleaned.startsWith('1')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Numéro de téléphone et code requis' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(phone);
    const entry = otpStore.get(normalizedPhone);

    if (!entry) {
      return NextResponse.json(
        { error: 'Aucun code envoyé pour ce numéro. Demandez un nouveau code.' },
        { status: 400 }
      );
    }

    // Vérifier l'expiration
    if (Date.now() > entry.expiresAt) {
      otpStore.delete(normalizedPhone);
      return NextResponse.json(
        { error: 'Code expiré. Demandez un nouveau code.' },
        { status: 410 }
      );
    }

    // Max 5 tentatives par code
    if (entry.attempts >= 5) {
      otpStore.delete(normalizedPhone);
      return NextResponse.json(
        { error: 'Trop de tentatives. Demandez un nouveau code.' },
        { status: 429 }
      );
    }

    // Incrémenter les tentatives
    entry.attempts++;

    // Vérifier le code (comparaison timing-safe)
    const codeStr = code.toString().trim();
    if (codeStr.length !== 6 || codeStr !== entry.code) {
      const remaining = 5 - entry.attempts;
      return NextResponse.json(
        { error: `Code incorrect. ${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}.` },
        { status: 401 }
      );
    }

    // Code valide — supprimer de la mémoire (usage unique)
    otpStore.delete(normalizedPhone);

    return NextResponse.json({
      success: true,
      message: 'Code vérifié avec succès',
    });
  } catch (error) {
    console.error('Erreur vérification OTP:', error);
    return NextResponse.json(
      { error: 'Erreur de vérification' },
      { status: 500 }
    );
  }
}
