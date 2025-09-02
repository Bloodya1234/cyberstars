// src/app/api/discord/check/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getAuthSession } from '@/lib/auth';

/**
 * Проверяет членство в Discord-гильдии.
 * discordId берём из query (?discordId=) или из Firestore пользователя по сессии.
 * Возвращаем подробные ошибки, чтобы видеть, где именно ломается.
 */
export async function GET(req) {
  const url = new URL(req.url);
  const wantDebug = url.searchParams.get('debug') === '1';

  try {
    // -------- 0) sanity env
    const botUrl = process.env.BOT_SERVER_URL?.replace(/\/+$/, '');
    if (!botUrl) {
      return NextResponse.json(
        { error: 'BOT_SERVER_URL is not set on the server' },
        { status: 500 }
      );
    }

    // -------- 1) session
    const session = await getAuthSession();
    const uid = session?.user?.uid;
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized (no session)' }, { status: 401 });
    }

    // -------- 2) discordId (query or firestore)
    let discordId = url.searchParams.get('discordId');
    if (!discordId) {
      const snap = await db().collection('users').doc(uid).get();
      if (!snap.exists) {
        return NextResponse.json({ error: `User doc not found for ${uid}` }, { status: 404 });
      }
      const user = snap.data() || {};
      discordId = user?.discord?.id || null;
      if (!discordId) {
        return NextResponse.json(
          { error: 'Discord not linked in Firestore (users/{uid}.discord.id missing)' },
          { status: 409 }
        );
      }
    }

    // -------- 3) call bot server with timeout
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), 8000);

    let botResp;
    try {
      botResp = await fetch(`${botUrl}/check-server-membership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordId }),
        signal: controller.signal,
        cache: 'no-store',
      });
    } finally {
      clearTimeout(to);
    }

    const botBodyText = await botResp.text().catch(() => '');
    let botBody;
    try {
      botBody = JSON.parse(botBodyText);
    } catch {
      botBody = botBodyText;
    }

    if (!botResp.ok) {
      return NextResponse.json(
        {
          error: 'Bot responded with non-200',
          botStatus: botResp.status,
          botBody,
        },
        { status: 502 }
      );
    }

    const isMember = !!(botBody && typeof botBody.isMember === 'boolean' ? botBody.isMember : false);

    // -------- 4) save flag (best effort)
    try {
      await db().collection('users').doc(uid).set({ joinedDiscordServer: isMember }, { merge: true });
    } catch (e) {
      // не критично
      if (wantDebug) console.warn('save joinedDiscordServer failed:', e);
    }

    return NextResponse.json({ isMember, debug: wantDebug ? { discordId, botBody } : undefined }, { status: 200 });
  } catch (err) {
    console.error('[/api/discord/check] fatal:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
