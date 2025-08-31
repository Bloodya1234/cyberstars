// src/app/api/discord/callback/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

function normalizeBase(u) {
  return (u || '').replace(/\/+$/, '');
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const origin = url.origin;

    // 0) Строим redirect_uri, который ДОЛЖЕН совпадать со строкой в DDP
    //    Приоритет: DISCORD_REDIRECT_URI -> BASE_URL -> NEXT_PUBLIC_BASE_URL -> origin
    const base =
      normalizeBase(process.env.BASE_URL) ||
      normalizeBase(process.env.NEXT_PUBLIC_BASE_URL) ||
      normalizeBase(origin);

    const redirectUri =
      process.env.DISCORD_REDIRECT_URI
        ? normalizeBase(process.env.DISCORD_REDIRECT_URI) // уже полный путь до /api/discord/callback
        : `${base}/api/discord/callback`;

    // 1) Параметры из запроса
    const code = url.searchParams.get('code');
    const stateEncoded = url.searchParams.get('state');

    if (!code) {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    // state мы ждём (из фронта), но дадим понятную ошибку, если он отсутствует/битый
    let steamId = null;
    let passedToken = null;
    if (!stateEncoded) {
      return NextResponse.json({ error: 'Missing state' }, { status: 400 });
    }
    try {
      const stateObj = JSON.parse(Buffer.from(stateEncoded, 'base64').toString('utf8'));
      steamId = stateObj?.steamId || null;       // ожидаем вида 'steam:7656...'
      passedToken = stateObj?.token ?? null;     // можем не использовать
      if (!steamId) throw new Error('steamId is missing in state');
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid state', message: String(e?.message || e) },
        { status: 400 }
      );
    }

    // 2) Обмен кода на access_token
    const params = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID || '',
      client_secret: process.env.DISCORD_CLIENT_SECRET || '',
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri, // ← ДОЛЖЕН совпадать с тем, что был в authorize
    });

    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params, // можно передавать URLSearchParams напрямую
    });

    const tokenJson = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !tokenJson?.access_token) {
      return NextResponse.json(
        {
          error: 'Token exchange failed',
          details: tokenJson,
          hint: 'Check DISCORD_REDIRECT_URI / Redirects in DDP match exactly',
        },
        { status: 500 }
      );
    }

    // 3) Профиль пользователя из Discord
    const meRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    const discordUser = await meRes.json().catch(() => ({}));

    if (!discordUser?.id || !discordUser?.username) {
      return NextResponse.json(
        { error: 'Invalid Discord user response', details: discordUser },
        { status: 500 }
      );
    }

    const discordTag =
      discordUser.discriminator && discordUser.discriminator !== '0'
        ? `${discordUser.username}#${discordUser.discriminator}`
        : discordUser.username;

    const docId = steamId.startsWith('steam:') ? steamId : `steam:${steamId}`;

    // 4) Сохраняем связку в Firestore
    await db().collection('users').doc(docId).set(
      {
        discord: {
          id: discordUser.id,
          tag: discordTag,
          avatar: discordUser.avatar ?? null,
        },
        joinedDiscordServer: false,
        // можно сохранить отметку времени / passedToken при желании
      },
      { merge: true }
    );

    // 5) Пингуем бот-сервис (best-effort)
    try {
      const botUrl = normalizeBase(process.env.BOT_SERVER_URL);
      if (botUrl) {
        await fetch(`${botUrl}/auto-invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ discordId: discordUser.id }),
        }).catch(() => {});
      }
    } catch (_) {}

    // 6) Редиректим на профиль
    return NextResponse.redirect(`${base}/profile`);
  } catch (err) {
    console.error('Discord OAuth failed:', err);
    return NextResponse.json(
      { error: 'Discord OAuth failed', message: String(err?.message || err) },
      { status: 500 }
    );
  }
}
