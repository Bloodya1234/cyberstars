// src/app/connect-discord/page.js
'use client';

import { useEffect, useState, useCallback } from 'react';

export default function ConnectDiscordPage() {
  const [steamId64, setSteamId64] = useState(null);
  const [token, setToken] = useState(null);
  const [busy, setBusy] = useState(false);

  // паблик-ид приложения в Discord
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '';

  // Подтягиваем текущую Steam-сессию (не блокирует кнопку)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/user-info', { credentials: 'include' });
        if (!res.ok) return;

        const me = await res.json(); // ожидаем { uid: 'steam:7656...' }
        if (!me?.uid || typeof me.uid !== 'string') return;

        const id64 = me.uid.startsWith('steam:') ? me.uid.slice(6) : me.uid;
        if (!cancelled) setSteamId64(id64);

        // Одноразовый custom token (опционально)
        const tr = await fetch('/api/steam/steam-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ steamId: id64 }),
        });
        if (tr.ok && !cancelled) {
          const { token: t } = await tr.json();
          setToken(t || null);
        }
      } catch {
        /* молча продолжаем — коннект без state тоже возможен */
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const handleConnectDiscord = useCallback(() => {
    if (!clientId) {
      alert('Discord Client ID отсутствует. Установите NEXT_PUBLIC_DISCORD_CLIENT_ID.');
      return;
    }
    setBusy(true);

    // ✅ Стабильный redirect_uri с учётом прод-домена
    const base = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    const redirectUri = `${base}/api/discord/callback`;

    // Собираем state (если есть данные)
    const stateObj = {};
    if (steamId64) stateObj.steamId = `steam:${steamId64}`;
    if (token) stateObj.token = token;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify',
    });

    if (Object.keys(stateObj).length) {
      params.set('state', btoa(JSON.stringify(stateObj)));
    }

    // Отправляем на Discord OAuth
    window.location.assign(`https://discord.com/oauth2/authorize?${params.toString()}`);
  }, [clientId, steamId64, token]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 text-center">
      <h1 className="text-4xl font-extrabold mb-4">Connect your Discord</h1>
      <p className="text-lg opacity-80 mb-6">
        Connect your Discord account to receive invites to teams and tournaments.
      </p>

      <button
        onClick={handleConnectDiscord}
        disabled={!clientId || busy}
        className="px-6 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        Connect Discord
      </button>
    </div>
  );
}
