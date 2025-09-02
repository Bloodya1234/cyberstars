// src/app/api/user-info/route.js
import { db } from '@/lib/firebase-admin';
import { getAuthSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Серверная сессия по cookie "session"
    const session = await getAuthSession();
    const uid = session?.user?.uid;               // ожидаем "steam:7656..."
    if (!uid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Читаем документ пользователя
    const snap = await db().collection('users').doc(uid).get();
    const data = snap.exists ? (snap.data() || {}) : {};

    // Формируем ответ (всегда возвращаем discord и joinedDiscordServer)
    const res = {
      uid,
      role: data.role || 'user',
      discord: data.discord || null, // {id, tag, avatar} | null
      joinedDiscordServer:
        typeof data.joinedDiscordServer === 'boolean'
          ? data.joinedDiscordServer
          : false,
    };

    return new Response(JSON.stringify(res), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[user-info] Fatal:', err?.stack || err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
