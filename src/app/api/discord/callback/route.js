// src/app/api/discord/callback/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getAuthSession } from '@/lib/auth'; // если есть; иначе убери эту строку и блок сессии

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const origin = url.origin;

    const base = (process.env.NEXT_PUBLIC_BASE_URL || origin).replace(/\/+$/, '');
    const redirectUri = `${base}/api/discord/callback`;

    const code = url.searchParams.get('code');
    const stateEncoded = url.searchParams.get('state');
    if (!code || !stateEncoded) {
      return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
    }

    // --- читаем state, но НЕ требуем обязательный steamId ---
    let stateObj = {};
    try {
      stateObj = JSON.parse(Buffer.from(stateEncoded, 'base64').toString('utf8')) || {};
    } catch (e) {
      // некритично — просто оставим пустой объект
    }
    let steamId = typeof stateObj.steamId === 'string' ? stateObj.steamId : null;

    // 1) Обмен кода на токен
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

    // 2) Профиль пользователя Discord
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

    // 3) Если steamId не пришёл в state — попробуем достать его из текущей сессии
    if (!steamId) {
      try {
        const session = await getAuthSession();
        const uid = session?.user?.uid;
        if (uid && typeof uid === 'string') {
          steamId = uid.startsWith('steam:') ? uid : `steam:${uid}`;
        }
      } catch {}
    }

    // 4) Готовим ID документа: если steamId есть — пишем в users/<steam:...>,
    // иначе — пишем в users/discord:<discordId> и помечаем, что нужно связать со Steam позже
    let docId;
    let needsSteamLink = false;
    if (steamId) {
      docId = steamId.startsWith('steam:') ? steamId : `steam:${steamId}`;
    } else {
      docId = `discord:${discordUser.id}`;
      needsSteamLink = true;
    }

    // 5) Сохраняем / мержим
    await db().collection('users').doc(docId).set(
      {
        discord: {
          id: discordUser.id,
          tag: discordTag,
          avatar: discordUser.avatar ?? null,
        },
        joinedDiscordServer: false,
        ...(needsSteamLink ? { needsSteamLink: true } : {}),
      },
      { merge: true }
    );

    // 6) Пингуем бот-сервис (не критично)
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

    // 7) Редиректим на профиль
    const redirectTo = needsSteamLink ? `${base}/profile?needsSteamLink=1` : `${base}/profile`;
    return NextResponse.redirect(redirectTo);
  } catch (err) {
    console.error('Discord OAuth failed:', err);
    return NextResponse.json(
      { error: 'Discord OAuth failed', message: String(err?.message || err) },
      { status: 500 }
    );
  }
}
