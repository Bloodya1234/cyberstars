// src/app/api/discord/check/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { db } from '@/lib/firebase-admin';
import { getAuthSession } from '@/lib/auth';

/**
 * Возвращает:
 * 200 { ok:true, isMember:boolean }
 * 401 { error:'Unauthorized' }
 * 404 { error:'Discord not linked' }
 */
export async function GET() {
  try {
    // 1) Сессия (кука "session")
    const session = await getAuthSession();
    const uid = session?.user?.uid;
    if (!uid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2) Берём юзера из Firestore
    const snap = await db().collection('users').doc(uid).get();
    if (!snap.exists) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }
    const user = snap.data() || {};
    const discordId = user?.discord?.id;
    if (!discordId) {
      return new Response(JSON.stringify({ error: 'Discord not linked' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3) Спрашиваем бот-сервис: состоит ли в сервере?
    const botUrl = process.env.BOT_SERVER_URL?.replace(/\/+$/, '');
    if (!botUrl) {
      // Если бот-сервиса нет — не валим, просто сообщим «не знаем»
      return new Response(JSON.stringify({ ok: true, isMember: false, note: 'BOT_SERVER_URL missing' }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch(`${botUrl}/check-server-membership`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discordId }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      console.warn('check-server-membership failed:', res.status, txt);
      return new Response(JSON.stringify({ ok: true, isMember: false }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    const { isMember } = await res.json();

    // 4) Запишем флаг в пользователя (удобно для админки/фильтров)
    await db().collection('users').doc(uid).set(
      { joinedDiscordServer: !!isMember },
      { merge: true }
    );

    return new Response(JSON.stringify({ ok: true, isMember: !!isMember }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('/api/discord/check fatal:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
