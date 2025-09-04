// src/app/connect-discord/page.js
import { redirectIfReadyToProfile } from '@/lib/redirect-to-profile.server';
import ConnectDiscordClient from './ConnectDiscordClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  await redirectIfReadyToProfile();
  return <ConnectDiscordClient />;
}



import { useEffect, useState, useCallback } from 'react';

function b64(obj) {
  return typeof window !== 'undefined'
    ? btoa(JSON.stringify(obj))
    : Buffer.from(JSON.stringify(obj)).toString('base64');
}

export default function ConnectDiscordPage() {
  const [steamId64, setSteamId64] = useState(null);
  const [token, setToken] = useState(null);
  const [busy, setBusy] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '';

  // Пробуем подтянуть steam-сессию (не блокирует кнопку)
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

        // одноразовый custom token (не обязателен, но используем, если есть)
        try {
          const tr = await fetch('/api/steam/steam-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ steamId: id64 }),
          });
          if (tr.ok) {
            const { token: t } = await tr.json();
            if (!cancelled) setToken(t || null);
          }
        } catch {}
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

    // Базовый url для redirect_uri
    const base =
      (process.env.NEXT_PUBLIC_BASE_URL && process.env.NEXT_PUBLIC_BASE_URL.replace(/\/+$/, '')) ||
      window.location.origin.replace(/\/+$/, '');
    const redirectUri = `${base}/api/discord/callback`;

    // Готовим state — ВСЕГДА отправляем (для безопасности и чтобы бэкенд не ругался)
    const statePayload = {
      // csrf на случай, если steamId/token недоступны:
      csrf: Math.random().toString(36).slice(2) + Date.now().toString(36),
    };
    if (steamId64) statePayload.steamId = `steam:${steamId64}`;
    if (token) statePayload.token = token;

    const url =
      `https://discord.com/oauth2/authorize` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent('identify')}` +
      `&state=${encodeURIComponent(b64(statePayload))}`;

    window.location.href = url;
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
