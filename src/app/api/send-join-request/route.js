// src/app/api/send-join-request/route.js

// Гарантируем Node.js-рантайм и динамическое выполнение (а не статический пререндер)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    // Проверяем, что задан URL бота в переменных окружения
    const botUrl = process.env.BOT_SERVER_URL;
    if (!botUrl) {
      return new Response(
        JSON.stringify({ error: 'BOT_SERVER_URL is not configured on the server' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Читаем тело запроса
    const body = await req.json().catch(() => ({}));
    const discordId = body.discordId || body.discord_id;
    const text = body.message ?? body.messageText;

    if (!discordId || !text) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: discordId and message' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Проксируем в бот-сервис
    const upstream = await fetch(`${botUrl}/send-dm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Нормализуем поле сообщения в "message"
      body: JSON.stringify({ discordId, message: text }),
    });

    // Если бот не ответил 2xx — отдаём 502 с деталями
    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '');
      return new Response(
        JSON.stringify({
          success: false,
          upstreamStatus: upstream.status,
          upstreamError: errText || 'Bot service error',
        }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Успех
    const data = await upstream.json().catch(() => ({}));
    return new Response(JSON.stringify({ success: true, ...data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-join-request error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: String(err?.message || err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
