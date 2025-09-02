// src/app/api/discord/check/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getAuthSession } from '@/lib/auth';

// универсальный fetch с таймаутом
async function fetchWithTimeout(url, opts = {}, ms = 7000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(new Error('timeout')), ms);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

export async function GET(req) {
  try {
    const url = new URL(req.url);

    // 1) Определяем discordId: либо из query, либо из Firestore по текущей сессии
    let discordId = url.searchParams.get('discordId')?.trim() || '';
    let uid = null;

    if (!discordId) {
      const session = await getAuthSession();
      uid = session?.user?.uid || null;
      if (!uid) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const snap = await db().collection('users').doc(uid).get();
      if (!snap.exists) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      const user = snap.data() || {};
      discordId = user?.discord?.id || '';
      if (!discordId) {
        return NextResponse.json({ error: 'Discord not linked' }, { status: 400 });
      }
    }

    // 2) BOT URL
    const botUrl = process.env.BOT_SERVER_URL?.replace(/\/+$/, '');
    if (!botUrl) {
      console.error('[discord/check] BOT_SERVER_URL is missing on server');
      return NextResponse.json({ error: 'Bot URL not configured' }, { status: 500 });
    }

    // 3) Пробуем "разбудить" Render (не критично, игнорим ошибки)
    try {
      await fetchWithTimeout(`${botUrl}/`, { method: 'GET' }, 4000);
    } catch { /* ignore */ }

    // 4) Запрос к боту с таймаутом и понятной ошибкой
    let r;
    try {
      r = await fetchWithTimeout(`${botUrl}/check-server-membership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordId }),
      }, 8000);
    } catch (e) {
      console.error('[discord/check] bot fetch failed:', e?.message || e);
      return NextResponse.json({ error: 'bot_unreachable' }, { status: 502 });
    }

    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      console.error('[discord/check] bot responded not OK:', r.status, txt);
      return NextResponse.json({ error: 'bot_bad_response', status: r.status }, { status: 502 });
    }

    const ans = await r.json().catch(() => ({}));
    const isMember = !!ans?.isMember;

    // 5) Сохраняем флаг, если есть uid
    if (isMember && uid) {
      await db().collection('users').doc(uid).set({ joinedDiscordServer: true }, { merge: true });
    }

    return NextResponse.json({ isMember });
  } catch (err) {
    console.error('[discord/check] fatal:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
