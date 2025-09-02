// src/app/api/user-info/route.js
import { db } from '@/lib/firebase-admin';
import { getAuthSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const missing = [];
    if (!process.env.FIREBASE_PRIVATE_KEY_BASE64) missing.push('FIREBASE_PRIVATE_KEY_BASE64');
    if (!process.env.FIREBASE_PROJECT_ID)        missing.push('FIREBASE_PROJECT_ID');
    if (!process.env.FIREBASE_CLIENT_EMAIL)      missing.push('FIREBASE_CLIENT_EMAIL');
    if (missing.length) {
      console.error('[user-info] Missing env:', missing.join(', '));
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    const session = await getAuthSession();
    const uid = session?.user?.uid;
    if (!uid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const snap = await db().collection('users').doc(uid).get();
    if (!snap.exists) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = snap.data() || {};
    const role = user.role || 'user';
    const discord = user.discord || null;
    const joinedDiscordServer = !!user.joinedDiscordServer;

    return new Response(JSON.stringify({ uid, role, discord, joinedDiscordServer }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[user-info] Fatal:', err?.stack || err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
