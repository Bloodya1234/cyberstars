// src/app/api/discord/check/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

// безопасный fetch с тайм-аутом
async function timedFetch(url, opts = {}, timeoutMs = 9000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    // важно выключить кеш
    const res = await fetch(url, { ...opts, signal: ac.signal, cache: 'no-store' });
    return res;
  } finally {
    clearTimeout(t);
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const discordId = searchParams.get('discordId');

    if (!discordId) {
      // не считаем это ошибкой — просто нечего проверять
      return NextResponse.json({ isMember: false, reason: 'missing_discordId' }, { status: 200 });
    }

    const botUrl = process.env.BOT_SERVER_URL?.replace(/\/+$/, '');
    if (!botUrl) {
      // если бот не настроен — тоже не ломаемся
      return NextResponse.json({ isMember: false, reason: 'no_bot_url' }, { status: 200 });
    }

    // дергаем бота — у бота должен быть эндпоинт /check-server-membership
    // тело запроса — { discordId }
    let botRes;
    try {
      botRes = await timedFetch(`${botUrl}/check-server-membership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordId }),
      }, 9000); // 9 сек: хватит даже на холодный старт Render
    } catch (e) {
      // Тайм-аут/abort/сеть. Не роняем — возвращаем false и продолжаем polling.
      return NextResponse.json(
        { isMember: false, reason: 'bot_timeout', details: String(e?.message || e) },
        { status: 200 }
      );
    }

    // Пытаемся прочитать JSON бота
    let json = {};
    try { json = await botRes.json(); } catch {}

    // Если бот ответил 200 и дал поле isMember — доверяем
    if (botRes.ok && typeof json.isMember === 'boolean') {
      return NextResponse.json({ isMember: json.isMember }, { status: 200 });
    }

    // Иначе считаем "пока не член", не ломая UX
    return NextResponse.json(
      { isMember: false, reason: 'bot_bad_response', details: json },
      { status: 200 }
    );
  } catch (err) {
    // На всякий: никогда не 500 — чтобы UI не пугался
    return NextResponse.json(
      { isMember: false, reason: 'server_error', details: String(err?.message || err) },
      { status: 200 }
    );
  }
}
