// src/app/connect-discord/page.js
'use client';

import { useEffect, useState, useCallback } from 'react';

export default function ConnectDiscordPage() {
  const [steamId64, setSteamId64] = useState(null);
  const [token, setToken] = useState(null);
  const [busy, setBusy] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '';
  // фиксированный базовый домен
  const base = (process.env.NEXT_PUBLIC_BASE_URL || window.location.origin).replace(/\/$/, '');

  // тихо пытаемся подтянуть сессию Steam (не обязательно)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/user-info', { credentials: 'include' });
        if (!res.ok) return;
        const me = await res.json(); // { uid: 'steam:7656...' }
        if (!me?.uid) return;
        const id64 = me.uid.startsWith('steam:') ? me.uid.slice(6) : me.uid;
        if (!cancelled) setSteamId64(id64);

        const tok = await fetch('/api/steam/steam-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ steamId: id64 }),
        });
        if (tok.ok && !cancelled) {
          const { token } = await tok.json();
          setToken(token || null);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const handleConnectDiscord = useCallback(() => {
    if (!clientId) {
      alert('Discord client id is missing. Set NEXT_PUBLIC_DISCORD_CLIENT_ID.');
      return;
    }
    setBusy(true);

    const redirectUri = `${base}/api/discord/callback`;

    const stateObj = {};
    if (steamId64) stateObj.steamId = `steam:${steamId64}`;
    if (token) stateObj.token = token;

    const state =
      Object.keys(stateObj).length
        ? `&state=${encodeURIComponent(btoa(JSON.stringify(stateObj)))}`
        : '';

    const url =
      `https://discord.com/oauth2/authorize` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code&scope=identify` +
      state;

    window.location.href = url;
  }, [clientId, base, steamId64, token]);

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
