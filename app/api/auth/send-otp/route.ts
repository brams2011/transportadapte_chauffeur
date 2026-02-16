import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { otpStore, sendRateLimit } from '@/lib/otp-store';

function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function normalizePhone(phone: string): string {
  // Nettoyer et normaliser le numéro
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  // Ajouter +1 pour les numéros canadiens/US sans indicatif
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
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: 'Numéro de téléphone requis' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(phone);

    // Rate limiting : max 3 envois par 10 minutes
    const now = Date.now();
    const recentSends = (sendRateLimit.get(normalizedPhone) || [])
      .filter(t => now - t < 10 * 60 * 1000);

    if (recentSends.length >= 3) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessayez dans quelques minutes.' },
        { status: 429 }
      );
    }

    // Générer le code OTP
    const code = generateOtp();
    const expiresAt = now + 5 * 60 * 1000; // 5 minutes

    // Stocker l'OTP
    otpStore.set(normalizedPhone, {
      code,
      expiresAt,
      attempts: 0,
      sentAt: now,
    });

    // Mettre à jour le rate limiting
    recentSends.push(now);
    sendRateLimit.set(normalizedPhone, recentSends);

    // Envoyer le SMS via Twilio
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      console.error('Twilio non configuré');
      return NextResponse.json(
        { error: 'Service SMS non disponible' },
        { status: 503 }
      );
    }

    const twilio = (await import('twilio')).default;
    const client = twilio(accountSid, authToken);

    console.log(`[OTP] Envoi SMS à: ${normalizedPhone} depuis: ${fromNumber}`);

    const message = await client.messages.create({
      body: `Ino-Service : Votre code de vérification est ${code}. Il expire dans 5 minutes.`,
      from: fromNumber,
      to: normalizedPhone,
    });

    console.log(`[OTP] Twilio SID: ${message.sid}, Status: ${message.status}, To: ${message.to}, From: ${message.from}`);

    // Masquer le numéro pour l'affichage (ex: +1514***1234)
    const maskedPhone = normalizedPhone.slice(0, 4) + '***' + normalizedPhone.slice(-4);

    return NextResponse.json({
      success: true,
      maskedPhone,
      expiresIn: 300, // 5 minutes en secondes
    });
  } catch (error) {
    console.error('Erreur envoi OTP:', error);
    return NextResponse.json(
      { error: 'Impossible d\'envoyer le code SMS' },
      { status: 500 }
    );
  }
}
