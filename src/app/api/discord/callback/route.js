// src/app/api/discord/callback/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin'; // <-- единый модуль

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  const url = new URL(req.url);
  const origin = url.origin;

  const code = url.searchParams.get('code');
  const stateEncoded = url.searchParams.get('state');
  if (!code || !stateEncoded) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
  }

  let steamId, token;
  try {
    const stateObj = JSON.parse(Buffer.from(stateEncoded, 'base64').toString('utf8'));
    steamId = stateObj.steamId;
    token = stateObj.token;
    if (!steamId || !token) throw new Error('Missing steamId or token in state');
  } catch (err) {
    return NextResponse.json({ error: 'Invalid state', message: err.message }, { status: 400 });
  }

  try {
    // 1) Обмениваем code на access_token
    const params = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.DISCORD_REDIRECT_URI || `${origin}/api/discord/callback`,
    });

    const discordRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      body: params,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const discordData = await discordRes.json();
    if (!discordRes.ok || !discordData.access_token) {
      return NextResponse.json({ error: 'Token exchange failed', details: discordData }, { status: 500 });
    }

    // 2) Получаем /users/@me
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${discordData.access_token}` },
    });
    const discordUser = await userRes.json();
    if (!discordUser.id || !discordUser.username) {
      return NextResponse.json({ error: 'Invalid Discord user response', details: discordUser }, { status: 500 });
    }

    const discordTag =
      discordUser.discriminator && discordUser.discriminator !== '0'
        ? `${discordUser.username}#${discordUser.discriminator}`
        : discordUser.username; // для новых дискордов без discriminator
    const docId = steamId.startsWith('steam:') ? steamId : `steam:${steamId}`;

    // 3) Сохраняем в Firestore
    await db.collection('users').doc(docId).set(
      {
        discord: {
          id: discordUser.id,
          tag: discordTag,
          avatar: discordUser.avatar,
        },
        joinedDiscordServer: false,
      },
      { merge: true }
    );

    // 4) Пингуем бот-сервер (не падаем, если нет соединения)
    try {
      const botUrl = process.env.BOT_SERVER_URL;
      if (botUrl) {
        const botRes = await fetch(`${botUrl}/auto-invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ discordId: discordUser.id }),
        });
        // можно прочитать ответ, но не делаем фатальной ошибкой
        await botRes.json().catch(() => {});
      }
    } catch {}

    // 5) Редиректим на профиль (или куда нужно)
    return NextResponse.redirect(`${origin}/profile`);
  } catch (err) {
    return NextResponse.json(
      { error: 'Discord OAuth failed', message: err.message },
      { status: 500 }
    );
  }
}
