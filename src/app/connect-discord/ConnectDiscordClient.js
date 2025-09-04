// src/app/connect-discord/ConnectDiscordClient.js
'use client';

import { useEffect, useState, useCallback } from 'react';

function b64(obj) {
  try {
    return typeof window !== 'undefined'
      ? btoa(JSON.stringify(obj))
      : Buffer.from(JSON.stringify(obj)).toString('base64');
  } catch {
    return '';
  }
}

export default function ConnectDiscordClient() {
  const [steamId64, setSteamId64] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  // Подтягиваем данные пользователя (если нужно класть в state)
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/user-info', { cache: 'no-store', credentials: 'include' });
        if (!r.ok) return;
        const u = await r.json();
        setSteamId64(u?.uid?.replace(/^steam:/, '') || null);
        setToken(null); // если хочешь — подтяни ещё что-то
      } catch {}
    })();
  }, []);

  const startDiscordOAuth = useCallback(() => {
    setLoading(true);
    const origin = window.location.origin;
    const redirectUri = encodeURIComponent(`${origin}/api/discord/callback`);
    const state = encodeURIComponent(b64({ steamId: steamId64 ? `steam:${steamId64}` : '' }));

    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const scope = encodeURIComponent('identify');

    const url =
      `https://discord.com/api/oauth2/authorize` +
      `?client_id=${clientId}` +
      `&response_type=code` +
      `&redirect_uri=${redirectUri}` +
      `&scope=${scope}` +
      `&state=${state}`;

    window.location.href = url;
  }, [steamId64]);

  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-bold text-white">Connect Discord</h1>
      <button
        className="glow-button glow-cyan px-6 py-3"
        onClick={startDiscordOAuth}
        disabled={loading}
      >
        {loading ? 'Redirecting…' : 'Connect Discord'}
      </button>
    </main>
  );
}
