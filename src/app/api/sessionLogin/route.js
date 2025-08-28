// src/app/api/sessionLogin/route.js
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { token } = await req.json();
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing token' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const expiresIn = 7 * 24 * 60 * 60 * 1000; // 7 дней
    const sessionCookie = await adminAuth().createSessionCookie(token, { expiresIn });

    const cookieStore = await cookies();
    cookieStore.set('session', sessionCookie, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: expiresIn / 1000,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('sessionLogin error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: String(err?.message || err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
