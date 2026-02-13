import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function generateToken(timestamp: number): string {
  const secret = process.env.ADMIN_PASSWORD! + process.env.ADMIN_EMAIL!;
  return crypto.createHash('sha256').update(`${secret}:${timestamp}`).digest('hex');
}

// POST /api/admin/login
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return NextResponse.json({ error: 'Configuration admin manquante' }, { status: 500 });
    }

    if (email !== adminEmail || password !== adminPassword) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }

    const timestamp = Date.now();
    const token = generateToken(timestamp);

    return NextResponse.json({
      success: true,
      token,
      timestamp,
      expiresAt: timestamp + 24 * 60 * 60 * 1000,
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// GET /api/admin/login?token=xxx&ts=xxx — Vérifier le token
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const ts = request.nextUrl.searchParams.get('ts');

  if (!token || !ts) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  const timestamp = parseInt(ts);
  const now = Date.now();

  // Vérifier expiration (24h)
  if (now - timestamp > 24 * 60 * 60 * 1000) {
    return NextResponse.json({ valid: false, reason: 'expired' }, { status: 401 });
  }

  const expectedToken = generateToken(timestamp);

  if (token === expectedToken) {
    return NextResponse.json({ valid: true });
  }

  return NextResponse.json({ valid: false }, { status: 401 });
}
