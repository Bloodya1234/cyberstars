// src/app/api/user-info/route.js
import { db } from '@/lib/firebase-admin';
import { getAuthSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session?.user?.uid) {
      console.warn('[user-info] No valid session cookie');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const uid = session.user.uid; // "steam:7656..."
    const snap = await db.collection('users').doc(uid).get();

    if (!snap.exists) {
      console.warn('[user-info] User doc not found for UID:', uid);
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = snap.data();

    return new Response(
      JSON.stringify({
        uid,
        name: user.name || null,
        teamId: user.teamId || null,
        role: user.role || 'user',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('🔥 /api/user-info error:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
