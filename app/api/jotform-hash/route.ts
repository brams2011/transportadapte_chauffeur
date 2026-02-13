import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const JOTFORM_SECRET = 'MDE5YzUzZDdkYTUzN2UxOGFhZmUzMjFiY2FiZDUwZGJmNDQ3';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId requis' }, { status: 400 });
    }

    const userHash = crypto.createHmac('sha256', JOTFORM_SECRET).update(userId).digest('hex');

    return NextResponse.json({ success: true, userHash });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
