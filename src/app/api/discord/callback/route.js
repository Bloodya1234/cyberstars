export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getAuthSession } from '@/lib/auth';

function baseUrl(origin) {
  return (process.env.NEXT_PUBLIC_BASE_URL || origin).replace(/\/+$/, '');
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const origin = url.origin;
    const base = baseUrl(origin);
    const redirectUri = `${base}/api/discord/callback`;

    const code = url.searchParams.get('code');
    const stateEncoded = url.searchParams.get('state');
    if (!code || !stateEncoded) {
      return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
    }

    // --- state, steamId не обязателен ---
    let stateObj = {};
    try { stateObj = JSON.parse(Buffer.from(stateEncoded, 'base64').toString('utf8')) || {}; } catch {}
    let steamId = typeof stateObj.steamId === 'string' ? stateObj.steamId : null;

    // 1) exchange code
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

    // 2) discord user
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

    // 3) если нет steamId — берём из текущей сессии
    if (!steamId) {
      try {
        const session = await getAuthSession?.();
        const uid = session?.user?.uid;
        if (uid && typeof uid === 'string') {
          steamId = uid.startsWith('steam:') ? uid : `steam:${uid}`;
        }
      } catch {}
    }

    // 4) id документа
    let docId;
    let needsSteamLink = false;
    if (steamId) {
      docId = steamId.startsWith('steam:') ? steamId : `steam:${steamId}`;
    } else {
      docId = `discord:${discordUser.id}`;
      needsSteamLink = true;
    }

    // 5) сохраняем/мерджим
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

    // 6) проверяем членство и/или шлём инвайт через бот-сервис
    let isMember = false;
    const botUrl = process.env.BOT_SERVER_URL?.replace(/\/+$/, '');
    if (botUrl) {
      try {
        // сначала проверка
        const check = await fetch(`${botUrl}/check-server-membership`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ discordId: discordUser.id }),
        });
        const chk = await check.json().catch(() => ({}));
        isMember = !!chk.isMember;

        if (!isMember) {
          // если не в сервере — автоинвайт
          await fetch(`${botUrl}/auto-invite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ discordId: discordUser.id }),
          });
        }
      } catch (e) {
        console.warn('Bot check/invite failed:', e);
      }
    }

    // 7) если уже член — отметим и на профиль, иначе на join-страницу
    if (isMember) {
      await db().collection('users').doc(docId).set({ joinedDiscordServer: true }, { merge: true });
      return NextResponse.redirect(`${base}/profile`);
    } else {
      const qp = needsSteamLink ? '?needsSteamLink=1' : '';
      return NextResponse.redirect(`${base}/join-discord${qp}`);
    }
  } catch (err) {
    console.error('Discord OAuth failed:', err);
    return NextResponse.json(
      { error: 'Discord OAuth failed', message: String(err?.message || err) },
      { status: 500 }
    );
  }
}
