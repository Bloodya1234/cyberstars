// src/app/connect-discord/page.js
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function ConnectDiscordPage() {
  const router = useRouter();
  const [steamId, setSteamId] = useState(null);          // steamId64 без префикса
  const [uid, setUid] = useState(null);                  // firebase uid вида steam:7656...
  const [token, setToken] = useState(null);              // custom token для state (опционально)
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  // Получаем пользователя по session cookie
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErrorText('');

        // 1) спрашиваем сервер "кто я?"
        const meRes = await fetch('/api/user-info', { credentials: 'include' });
        if (!meRes.ok) {
          setErrorText('Missing Steam session. Please login with Steam again.');
          setLoading(false);
          return;
        }
        const me = await meRes.json(); // ожидаем { uid: 'steam:7656...', ... }
        if (!me?.uid || typeof me.uid !== 'string') {
          setErrorText('Session is invalid. Please login with Steam again.');
          setLoading(false);
          return;
        }

        if (cancelled) return;

        setUid(me.uid);
        const id64 = me.uid.startsWith('steam:') ? me.uid.slice('steam:'.length) : me.uid;
        setSteamId(id64);

        // 2) получаем свежий custom token (для передачи в state, если нужно)
        const tokRes = await fetch('/api/steam/steam-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ steamId: id64 }),
        });

        if (tokRes.ok) {
          const { token: t } = await tokRes.json();
          if (!cancelled) setToken(t || null);
        } else {
          // токен для state — не критичен, просто продолжим без него
          console.warn('Could not mint custom token for state');
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setErrorText('Unexpected error. Please login again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSteamLogin = useCallback(() => {
    // Отправляем пользователя на /login, там он снова нажмёт Steam-кнопку
    router.push('/login');
  }, [router]);

  const handleConnectDiscord = useCallback(() => {
    // Если нет uid/steamId — просим залогиниться через Steam
    if (!uid || !steamId) {
      handleSteamLogin();
      return;
    }

    // Составляем state (steamId обязателен; token — nice-to-have)
    const stateObj = { steamId: `steam:${steamId}` };
    if (token) stateObj.token = token;
    const state = btoa(JSON.stringify(stateObj));

    // Берём публичные переменные окружения
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI;

    const discordAuthUrl =
      `https://discord.com/oauth2/authorize` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code&scope=identify` +
      `&state=${encodeURIComponent(state)}`;

    window.location.href = discordAuthUrl;
  }, [uid, steamId, token, handleSteamLogin]);

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
          {errorText && (
            <div className="text-red-400 mb-4">{errorText}</div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleConnectDiscord}
              className="px-6 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              disabled={!uid}
            >
              Connect Discord
            </button>

            {!uid && (
              <button
                onClick={handleSteamLogin}
                className="px-6 py-3 bg-gray-700 text-white rounded hover:bg-gray-800"
              >
                Login with Steam
              </button>
            )}
          </div>

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
// src/app/connect-discord/page.js
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function ConnectDiscordPage() {
  const router = useRouter();
  const [steamId, setSteamId] = useState(null);          // steamId64 без префикса
  const [uid, setUid] = useState(null);                  // firebase uid вида steam:7656...
  const [token, setToken] = useState(null);              // custom token для state (опционально)
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  // Получаем пользователя по session cookie
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErrorText('');

        // 1) спрашиваем сервер "кто я?"
        const meRes = await fetch('/api/user-info', { credentials: 'include' });
        if (!meRes.ok) {
          setErrorText('Missing Steam session. Please login with Steam again.');
          setLoading(false);
          return;
        }
        const me = await meRes.json(); // ожидаем { uid: 'steam:7656...', ... }
        if (!me?.uid || typeof me.uid !== 'string') {
          setErrorText('Session is invalid. Please login with Steam again.');
          setLoading(false);
          return;
        }

        if (cancelled) return;

        setUid(me.uid);
        const id64 = me.uid.startsWith('steam:') ? me.uid.slice('steam:'.length) : me.uid;
        setSteamId(id64);

        // 2) получаем свежий custom token (для передачи в state, если нужно)
        const tokRes = await fetch('/api/steam/steam-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ steamId: id64 }),
        });

        if (tokRes.ok) {
          const { token: t } = await tokRes.json();
          if (!cancelled) setToken(t || null);
        } else {
          // токен для state — не критичен, просто продолжим без него
          console.warn('Could not mint custom token for state');
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setErrorText('Unexpected error. Please login again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSteamLogin = useCallback(() => {
    // Отправляем пользователя на /login, там он снова нажмёт Steam-кнопку
    router.push('/login');
  }, [router]);

  const handleConnectDiscord = useCallback(() => {
    // Если нет uid/steamId — просим залогиниться через Steam
    if (!uid || !steamId) {
      handleSteamLogin();
      return;
    }

    // Составляем state (steamId обязателен; token — nice-to-have)
    const stateObj = { steamId: `steam:${steamId}` };
    if (token) stateObj.token = token;
    const state = btoa(JSON.stringify(stateObj));

    // Берём публичные переменные окружения
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI;

    const discordAuthUrl =
      `https://discord.com/oauth2/authorize` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code&scope=identify` +
      `&state=${encodeURIComponent(state)}`;

    window.location.href = discordAuthUrl;
  }, [uid, steamId, token, handleSteamLogin]);

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
          {errorText && (
            <div className="text-red-400 mb-4">{errorText}</div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleConnectDiscord}
              className="px-6 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              disabled={!uid}
            >
              Connect Discord
            </button>

            {!uid && (
              <button
                onClick={handleSteamLogin}
                className="px-6 py-3 bg-gray-700 text-white rounded hover:bg-gray-800"
              >
                Login with Steam
              </button>
            )}
          </div>

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
