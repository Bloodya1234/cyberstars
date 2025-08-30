// src/app/connect-discord/page.js
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function ConnectDiscordPage() {
  const router = useRouter();

  const [uid, setUid] = useState(null);        // firebase uid: steam:7656...
  const [steamId64, setSteamId64] = useState(null);
  const [token, setToken] = useState(null);    // кастомный токен (для state; опционально)
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [errorText, setErrorText] = useState('');

  // Проверяем серверную сессию по httpOnly-cookie
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErrorText('');

        const res = await fetch('/api/user-info', { credentials: 'include' });
        if (!res.ok) {
          setNeedsLogin(true);
          return;
        }

        const me = await res.json(); // ожидаем { uid: 'steam:...' }
        if (!me?.uid || typeof me.uid !== 'string') {
          setNeedsLogin(true);
          return;
        }

        if (cancelled) return;

        setUid(me.uid);
        const id64 = me.uid.startsWith('steam:') ? me.uid.slice('steam:'.length) : me.uid;
        setSteamId64(id64);

        // пробуем получить разовый custom token — не критично, если не получится
        try {
          const tokRes = await fetch('/api/steam/steam-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ steamId: id64 }),
          });
          if (tokRes.ok) {
            const { token: t } = await tokRes.json();
            if (!cancelled) setToken(t || null);
          }
        } catch {/* ignore */}
      } catch (e) {
        console.error(e);
        if (!cancelled) setErrorText('Unexpected error. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const handleConnectDiscord = useCallback(() => {
    // Если нет сессии Steam — отправляем на логин и возвращаемся назад
    if (needsLogin || !uid) {
      router.push('/login?next=/connect-discord');
      return;
    }

    // state для callback-а
    const stateObj = { steamId: `steam:${steamId64}` };
    if (token) stateObj.token = token;
    const state = btoa(JSON.stringify(stateObj));

    // redirect_uri строим от текущего origin,
    // clientId берём из PUBLIC-переменной окружения
    const redirectUri = `${window.location.origin}/api/discord/callback`;
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '';

    if (!clientId) {
      console.error('NEXT_PUBLIC_DISCORD_CLIENT_ID is missing!');
      alert('Discord Client ID is not configured on this deployment.');
      return;
    }

    const url =
      `https://discord.com/oauth2/authorize` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code&scope=identify` +
      `&state=${encodeURIComponent(state)}`;

    console.log('🔗 Redirecting to Discord:', url);
    window.location.href = url;
  }, [needsLogin, uid, steamId64, token, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 text-center">
      <h1 className="text-4xl font-extrabold mb-4">Connect your Discord</h1>
      <p className="text-lg opacity-80 mb-6">
        Connect your Discord account to receive invites to teams and tournaments.
      </p>

      {loading ? (
        <div className="opacity-80">Checking session…</div>
      ) : (
        <>
          {needsLogin && (
            <div className="text-yellow-400 mb-4">
              You&apos;ll be asked to login with Steam first.
            </div>
          )}
          {errorText && <div className="text-red-400 mb-4">{errorText}</div>}

          <button
            onClick={handleConnectDiscord}
            className="px-6 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Connect Discord
          </button>

          {uid && (
            <div className="mt-3 text-sm opacity-70">
              Signed in as <span className="font-mono">{uid}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
