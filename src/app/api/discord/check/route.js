// src/app/api/discord/check/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getAuthSession } from '@/lib/auth';

/**
 * Проверяет, состоит ли пользователь в Discord-сервере.
 * Источник правды — бот-сервис (BOT_SERVER_URL).
 *
 * Использование:
 *   GET /api/discord/check?discordId=123     // опционально; если не передан — возьмём из Firestore по текущей сессии
 *
 * Ответ:
 *   { isMember: true|false }
 *
 * Побочный эффект:
 *   Если isMember === true и есть сессия — обновляем users/<uid>:
 *     { joinedDiscordServer: true }
 */
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const queryDiscordId = url.searchParams.get('discordId')?.trim() || '';

    const session = await getAuthSession(); // cookie-проверка
    const uid = session?.user?.uid || null;

    // 1) Берём discordId: из query или из Firestore по текущему пользователю
    let discordId = queryDiscordId;
    if (!discordId) {
      if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

      const snap = await db().collection('users').doc(uid).get();
      if (!snap.exists) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      const user = snap.data() || {};
      discordId = user?.discord?.id || '';
      if (!discordId) {
        return NextResponse.json({ error: 'Discord not linked' }, { status: 400 });
      }
    }

    // 2) Пингуем бот-сервис
    const botUrl = process.env.BOT_SERVER_URL?.replace(/\/+$/, '');
    if (!botUrl) {
      console.error('[discord/check] BOT_SERVER_URL is missing');
      return NextResponse.json({ error: 'Bot URL not configured' }, { status: 500 });
    }

    const r = await fetch(`${botUrl}/check-server-membership`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // для простоты передаём только discordId
      body: JSON.stringify({ discordId }),
      // бот-портал публичный, cookie не нужны
    });

    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      console.error('[discord/check] bot responded not OK:', r.status, txt);
      return NextResponse.json({ error: 'Bot check failed' }, { status: 502 });
    }

    const ans = await r.json().catch(() => ({}));
    const isMember = !!ans?.isMember;

    // 3) Если есть валидная сессия и участник сервера — отметим это в Firestore
    if (isMember && uid) {
      await db().collection('users').doc(uid).set(
        { joinedDiscordServer: true },
        { merge: true }
      );
    }

    return NextResponse.json({ isMember });
  } catch (err) {
    console.error('[discord/check] fatal:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
