// src/app/connect-discord/ConnectDiscordClient.js
'use client';

import { useEffect, useState, useCallback } from 'react';

function b64(obj) {
  try {
    return btoa(JSON.stringify(obj));
  } catch {
    return '';
  }
}

export default function ConnectDiscordClient() {
  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(false);

  // Подтягиваем текущего пользователя, чтобы положить uid в state Discord OAuth
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/user-info', { cache: 'no-store', credentials: 'include' });
        if (!r.ok) return;
        const j = await r.json();
        setUid(j?.uid || null);
      } catch {}
    })();
  }, []);

  const startDiscordOAuth = useCallback(() => {
    setLoading(true);
    const origin = window.location.origin;
    const redirectUri = encodeURIComponent(`${origin}/api/discord/callback`);
    const state = encodeURIComponent(b64({ steamId: uid || '' }));

    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const scope = encodeURIComponent('identify'); // добавь/измени при необходимости

    const url =
      `https://discord.com/api/oauth2/authorize` +
      `?client_id=${clientId}` +
      `&response_type=code` +
      `&redirect_uri=${redirectUri}` +
      `&scope=${scope}` +
      `&state=${state}`;

    window.location.href = url;
  }, [uid]);

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
