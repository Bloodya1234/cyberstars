// src/app/api/discord/check/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getAuthSession } from '@/lib/auth';

/**
 * Проверяет, состоит ли пользователь в гильдии Discord.
 * Источники discordId:
 *  - query ?discordId=... (опционально)
 *  - если нет — по текущей сессии находим users/{uid}.discord.id
 *
 * Возвращает: { isMember: boolean }
 */
export async function GET(req) {
  try {
    const url = new URL(req.url);
    let discordId = url.searchParams.get('discordId');

    // Если discordId не передали — вытаскиваем из текущей сессии (users/{uid}.discord.id)
    if (!discordId) {
      const session = await getAuthSession();
      const uid = session?.user?.uid;
      if (!uid) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const snap = await db().collection('users').doc(uid).get();
      if (!snap.exists) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const user = snap.data() || {};
      discordId = user?.discord?.id || null;
      if (!discordId) {
        return NextResponse.json({ error: 'Discord not linked' }, { status: 409 });
      }
    }

    // дергаем бот-сервис
    const botUrl = process.env.BOT_SERVER_URL?.replace(/\/+$/, '');
    if (!botUrl) {
      return NextResponse.json({ error: 'BOT_SERVER_URL is not set' }, { status: 500 });
    }

    const resp = await fetch(`${botUrl}/check-server-membership`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discordId }),
      cache: 'no-store',
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return NextResponse.json({ error: 'Bot check failed', details: text }, { status: 502 });
    }

    const { isMember } = await resp.json();

    // Опционально — отметим в Firestore
    try {
      const session = await getAuthSession();
      const uid = session?.user?.uid;
      if (uid && typeof isMember === 'boolean') {
        await db()
          .collection('users')
          .doc(uid)
          .set({ joinedDiscordServer: !!isMember }, { merge: true });
      }
    } catch { /* мягко игнорируем */ }

    return NextResponse.json({ isMember: !!isMember }, { status: 200 });
  } catch (err) {
    console.error('[/api/discord/check] error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
