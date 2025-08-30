// src/app/api/discord/callback/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const origin = url.origin;

    // Базовый URL (либо из ENV, либо текущий origin)
    const base = (process.env.NEXT_PUBLIC_BASE_URL || origin).replace(/\/+$/, '');
    const redirectUri = `${base}/api/discord/callback`;

    const code = url.searchParams.get('code');
    const stateEncoded = url.searchParams.get('state');
    if (!code || !stateEncoded) {
      return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
    }

    // state: { steamId: 'steam:765...', token?: '...' }
    let steamId, token;
    try {
      const stateObj = JSON.parse(Buffer.from(stateEncoded, 'base64').toString('utf8'));
      steamId = stateObj.steamId;
      token = stateObj.token ?? null;
      if (!steamId) throw new Error('Missing steamId in state');
    } catch (e) {
      return NextResponse.json({ error: 'Invalid state', message: String(e?.message || e) }, { status: 400 });
    }

    // 1) Обмен кода на access_token
    const params = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID || '',
      client_secret: process.env.DISCORD_CLIENT_SECRET || '',
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });

    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || !tokenJson.access_token) {
      return NextResponse.json({ error: 'Token exchange failed', details: tokenJson }, { status: 500 });
    }

    // 2) Получаем профиль пользователя
    const meRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    const discordUser = await meRes.json();
    if (!discordUser?.id || !discordUser?.username) {
      return NextResponse.json({ error: 'Invalid Discord user response', details: discordUser }, { status: 500 });
    }

    const discordTag =
      discordUser.discriminator && discordUser.discriminator !== '0'
        ? `${discordUser.username}#${discordUser.discriminator}`
        : discordUser.username;

    const docId = steamId.startsWith('steam:') ? steamId : `steam:${steamId}`;

    // 3) Сохраняем в Firestore (через db())
    await db().collection('users').doc(docId).set(
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

    // 4) Пингуем бот-сервис (не критично, если упадёт)
    try {
      const botUrl = process.env.BOT_SERVER_URL?.replace(/\/+$/, '');
      if (botUrl) {
        await fetch(`${botUrl}/auto-invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ discordId: discordUser.id }),
        });
      }
    } catch (e) {
      console.warn('Bot invite ping failed:', e);
    }

    // 5) Редиректим на профиль
    return NextResponse.redirect(`${base}/profile`);
  } catch (err) {
    console.error('Discord OAuth failed:', err);
    return NextResponse.json(
      { error: 'Discord OAuth failed', message: String(err?.message || err) },
      { status: 500 }
    );
  }
}
