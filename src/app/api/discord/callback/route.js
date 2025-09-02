// src/app/api/discord/callback/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';

// универсальный fetch с тайм-аутом
async function timedFetch(url, opts = {}, timeoutMs = 8000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: ac.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const origin = url.origin;

    // Базовый URL (ENV или текущий origin), без завершающего /
    const base = (process.env.NEXT_PUBLIC_BASE_URL || origin).replace(/\/+$/, '');
    const redirectUri = `${base}/api/discord/callback`;

    const code = url.searchParams.get('code');
    const stateEncoded = url.searchParams.get('state');

    if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    if (!stateEncoded) return NextResponse.json({ error: 'Missing state' }, { status: 400 });

    // state: { steamId: 'steam:765...', token?: '...' }
    let steamId, token;
    try {
      const stateObj = JSON.parse(Buffer.from(stateEncoded, 'base64').toString('utf8'));
      steamId = stateObj.steamId;
      token = stateObj.token ?? null;
      if (!steamId) throw new Error('steamId is missing in state');
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid state', message: String(e?.message || e) },
        { status: 400 }
      );
    }

    // --- 1) Обмен кода на access_token (тайм-аут 8с) ---
    const tokenParams = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID || '',
      client_secret: process.env.DISCORD_CLIENT_SECRET || '',
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });

    const tokenRes = await timedFetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams,
    }, 8000);

    let tokenJson = {};
    try { tokenJson = await tokenRes.json(); } catch {}
    if (!tokenRes.ok || !tokenJson.access_token) {
      return NextResponse.json(
        { error: 'Token exchange failed', details: tokenJson },
        { status: 502 }
      );
    }

    // --- 2) Профиль Discord (тайм-аут 8с) ---
    const meRes = await timedFetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
      cache: 'no-store',
    }, 8000);

    let discordUser = {};
    try { discordUser = await meRes.json(); } catch {}
    if (!meRes.ok || !discordUser?.id) {
      return NextResponse.json(
        { error: 'Invalid Discord user response', details: discordUser },
        { status: 502 }
      );
    }

    const discordTag =
      discordUser.discriminator && discordUser.discriminator !== '0'
        ? `${discordUser.username}#${discordUser.discriminator}`
        : discordUser.username;

    const docId = steamId.startsWith('steam:') ? steamId : `steam:${steamId}`;

    // --- 3) Запись в Firestore (через ленивый getDb) ---
    const db = getDb();

    const writePromise = db.collection('users').doc(docId).set(
      {
        discord: {
          id: discordUser.id,
          tag: discordTag,
          avatar: discordUser.avatar ?? null,
        },
        joinedDiscordServer: false,
      },
      { merge: true }
    );

    // Простой тайм-аут на запись (8с), чтобы не висеть бесконечно
    const writeTimeout = new Promise((_, rej) =>
      setTimeout(() => rej(new Error('Firestore write timeout')), 8000)
    );

    try {
      await Promise.race([writePromise, writeTimeout]);
    } catch (e) {
      return NextResponse.json(
        { error: 'Firestore write failed', message: String(e?.message || e) },
        { status: 502 }
      );
    }

    // --- 4) Пингуем бот-сервис неблокирующе (1.5с) ---
    try {
      const botUrl = process.env.BOT_SERVER_URL?.replace(/\/+$/, '');
      if (botUrl) {
        const ac = new AbortController();
        const t = setTimeout(() => ac.abort(), 1500);

        fetch(`${botUrl}/auto-invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ discordId: discordUser.id }),
          signal: ac.signal,
          keepalive: true,
        })
          .catch(() => {})
          .finally(() => clearTimeout(t));
      }
    } catch {
      // игнорируем
    }

    // --- 5) Редиректим на join-discord ---
    return NextResponse.redirect(`${base}/join-discord`);
  } catch (err) {
    console.error('Discord OAuth failed:', err);
    return NextResponse.json(
      { error: 'Discord OAuth failed', message: String(err?.message || err) },
      { status: 500 }
    );
  }
}
