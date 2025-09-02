// src/app/api/sessionLogin/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

export async function POST(req) {
  try {
    const { token } = await req.json(); // idToken от клиента
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

    const auth = getAdminAuth();

    // можно проверить, что токен валидный (опционально):
    const decoded = await auth.verifyIdToken(token);

    // создаём session cookie (например, на 7 дней)
    const expiresIn = 7 * 24 * 60 * 60 * 1000;
    const sessionCookie = await auth.createSessionCookie(token, { expiresIn });

    const res = NextResponse.json({ ok: true });
    res.cookies.set('session', sessionCookie, {
      httpOnly: true,
      secure: true,
      path: '/',
      sameSite: 'lax',
      maxAge: expiresIn / 1000,
    });
    return res;
  } catch (e) {
    console.error('sessionLogin error', e);
    return NextResponse.json({ error: 'sessionLogin failed' }, { status: 500 });
  }
}
