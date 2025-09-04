'use client';

import { useEffect, useState, useCallback } from 'react';

function b64(obj) {
  try { return btoa(JSON.stringify(obj)); } catch { return ''; }
}

const BASE =
  process.env.NEXT_PUBLIC_BASE_URL || // <-- если задан, используем его
  (typeof window !== 'undefined' ? window.location.origin : '');

export default function ConnectDiscordClient() {
  const [steamId64, setSteamId64] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/user-info', { cache: 'no-store', credentials: 'include' });
        if (!r.ok) return;
        const u = await r.json();
        setSteamId64(u?.uid?.replace(/^steam:/, '') || null);
      } catch {}
    })();
  }, []);

  const startDiscordOAuth = useCallback(() => {
    setLoading(true);
    const redirectUri = encodeURIComponent(`${BASE}/api/discord/callback`);
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
      <button className="glow-button glow-cyan px-6 py-3" onClick={startDiscordOAuth} disabled={loading}>
        {loading ? 'Redirecting…' : 'Connect Discord'}
      </button>
    </main>
  );
}
