// src/app/api/sessionLogin/route.js
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { token: idToken } = await req.json();

    if (!idToken) {
      return new Response(JSON.stringify({ error: 'Missing idToken' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1) Попробуем сначала верифицировать токен — это даст нормальную ошибку
    let decoded;
    try {
      decoded = await adminAuth().verifyIdToken(idToken, true);
    } catch (e) {
      console.error('verifyIdToken failed:', e?.errorInfo || e?.message || e);
      return new Response(JSON.stringify({
        error: 'verifyIdToken failed',
        details: e?.errorInfo || e?.message || String(e),
      }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    // 2) Создаём session cookie
    const expiresIn = 7 * 24 * 60 * 60 * 1000; // 7 дней
    let sessionCookie;
    try {
      sessionCookie = await adminAuth().createSessionCookie(idToken, { expiresIn });
    } catch (e) {
      console.error('createSessionCookie failed:', e?.errorInfo || e?.message || e);
      return new Response(JSON.stringify({
        error: 'createSessionCookie failed',
        uid: decoded?.uid,
        details: e?.errorInfo || e?.message || String(e),
      }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const cookieStore = await cookies();
    cookieStore.set('session', sessionCookie, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: expiresIn / 1000,
    });

    return new Response(JSON.stringify({ ok: true, uid: decoded?.uid }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('sessionLogin fatal:', err);
    return new Response(JSON.stringify({
      error: 'Internal Server Error', details: String(err?.message || err),
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
