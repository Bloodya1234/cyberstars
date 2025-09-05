// src/app/api/send-invite/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

/**
 * Body:
 * {
 *   recipientDiscordId: string,  // кому слать инвайт
 *   teamName: string,            // имя команды
 *   inviteLink: string           // ссылка, которую отправляем
 * }
 */
export async function POST(req) {
  try {
    const { recipientDiscordId, teamName, inviteLink } = await req.json();

    if (!recipientDiscordId || !teamName || !inviteLink) {
      return NextResponse.json(
        { error: 'Missing fields: recipientDiscordId, teamName, inviteLink' },
        { status: 400 }
      );
    }

    const base = process.env.BOT_SERVER_URL?.replace(/\/+$/, '');
    if (!base) {
      // На Vercel ОБЯЗАТЕЛЬНО задайте BOT_SERVER_URL в Project → Settings → Environment Variables
      return NextResponse.json(
        { error: 'BOT_SERVER_URL is not configured on the server' },
        { status: 503 }
      );
    }

    // Сообщение, которое отправит бот
    const message =
      `You have been invited to the team **${teamName}**.\n` +
      `Join here: ${inviteLink}`;

    // Таймаут на запрос к бот-серверу (6с)
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 6000);

    const res = await fetch(`${base}/send-dm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discordId: recipientDiscordId, message }),
      signal: ac.signal,
    }).catch((e) => {
      throw new Error(`Fetch to bot failed: ${e?.message || e}`);
    });
    clearTimeout(t);

    // Если бот вернул ошибку — пробрасываем тело для логов
    if (!res.ok) {
      let txt = '';
      try { txt = await res.text(); } catch {}
      return NextResponse.json(
        { error: 'Bot server error', details: txt || res.statusText },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, sent: true });
  } catch (err) {
    // Смотрите логи на Vercel → Deployments → View Function Logs
    console.error('Error sending Discord invite:', err);
    return NextResponse.json(
      { error: 'Failed to send invite', details: String(err?.message || err) },
      { status: 500 }
    );
    }
}
