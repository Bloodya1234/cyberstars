// src/app/api/discord/callback/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const origin = url.origin;

    // --- 0) Параметры запроса от Discord ---
    const code = url.searchParams.get('code');
    const stateEncoded = url.searchParams.get('state');

    if (!code || !stateEncoded) {
      console.error('Discord callback: missing code/state');
      return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
    }

    // --- 1) Разбираем state (требуем только steamId) ---
    let steamId; // может быть "7656..." или "steam:7656..."
    try {
      const stateObj = JSON.parse(Buffer.from(stateEncoded, 'base64').toString('utf8'));
      steamId = stateObj?.steamId;
      if (!steamId) throw new Error('steamId missing in state');
    } catch (err) {
      console.error('Discord callback: invalid state:', err?.message || err);
      return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
    }

    // Нормализуем uid для Firestore
    const docId = String(steamId).startsWith('steam:') ? String(steamId) : `steam:${steamId}`;

    // --- 2) Должны использовать ТОТ ЖЕ redirect_uri, что и в authorize ---
    // Порядок приоритета: DISCORD_REDIRECT_URI -> NEXT_PUBLIC_DISCORD_REDIRECT_URI -> {origin}/api/discord/callback
    const redirectUri =
      process.env.DISCORD_REDIRECT_URI ||
      process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI ||
      `${origin}/api/discord/callback`;

    // Полезно проверить, что реально пришли на этот же URL (чисто лог)
    if (!redirectUri.startsWith(origin)) {
      console.warn(
        'Discord callback: redirect_uri env does not match current origin.',
        'origin=', origin,
        'redirectUri=', redirectUri
      );
    }

    // --- 3) Обмениваем code -> access_token ---
    const params = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID || '',
      client_secret: process.env.DISCORD_CLIENT_SECRET || '',
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri, // ДОЛЖЕН совпадать с тем, что было в authorize
    });

    const discordRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      body: params,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const discordData = await discordRes.json().catch(() => ({}));
    if (!discordRes.ok || !discordData?.access_token) {
      console.error('Discord token exchange failed:', discordData);
      return NextResponse.json({ error: 'Token exchange failed' }, { status: 500 });
    }

    // --- 4) Получаем профиль пользователя Discord ---
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${discordData.access_token}` },
    });
    const discordUser = await userRes.json().catch(() => ({}));

    if (!discordRes.ok && userRes.status === 401) {
      console.error('Discord /users/@me unauthorized');
      return NextResponse.json({ error: 'Discord auth failed' }, { status: 401 });
    }

    if (!discordUser?.id || !discordUser?.username) {
      console.error('Invalid Discord user response:', discordUser);
      return NextResponse.json({ error: 'Invalid Discord user response' }, { status: 500 });
    }

    const discordTag =
      discordUser.discriminator && discordUser.discriminator !== '0'
        ? `${discordUser.username}#${discordUser.discriminator}`
        : discordUser.username;

    // --- 5) Сохраняем/обновляем в Firestore ---
    await db.collection('users').doc(docId).set(
      {
        discord: {
          id: discordUser.id,
          tag: discordTag,
          avatar: discordUser.avatar || null,
        },
        joinedDiscordServer: false,
      },
      { merge: true }
    );

    // --- 6) (опционально) Пингуем ваш бот-сервер ---
    try {
      const botUrl = process.env.BOT_SERVER_URL;
      if (botUrl) {
        await fetch(`${botUrl}/auto-invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ discordId: discordUser.id }),
        }).catch(() => {});
      }
    } catch {
      // не фейлим, если бот недоступен
    }

    // --- 7) Готово — отправляем пользователя в профиль ---
    return NextResponse.redirect(`${origin}/profile`, { status: 302 });
  } catch (err) {
    console.error('Discord OAuth failed:', err?.message || err);
    return NextResponse.json({ error: 'Discord OAuth failed' }, { status: 500 });
  }
}
