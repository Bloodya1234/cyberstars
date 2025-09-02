// src/app/api/user-info/route.js
import { db } from '@/lib/firebase-admin';
import { getAuthSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // серверная сессия (cookie "session")
    const session = await getAuthSession();
    const uid = session?.user?.uid;
    if (!uid) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    // читаем Firestore (ВАЖНО: db — функция)
    const snap = await db().collection('users').doc(uid).get();
    if (!snap.exists) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });

    const user = snap.data() || {};
    const payload = {
      uid,
      role: user.role || 'user',
      // добавили ↓↓↓
      discord: user.discord || null,                // { id, tag, avatar } или null
      joinedDiscordServer: !!user.joinedDiscordServer,
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    console.error('[user-info] fatal:', e);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
