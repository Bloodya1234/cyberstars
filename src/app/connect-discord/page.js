// src/app/connect-discord/page.js
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { app } from '@/firebase';

const auth = getAuth(app);

export default function ConnectDiscordPage() {
  const router = useRouter();
  const [steamId, setSteamId] = useState(null);  // SteamID64 без префикса
  const [uid, setUid] = useState(null);          // Firebase UID: steam:xxxx
  const [token, setToken] = useState(null);      // custom token (для state)
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  // Пытаемся получить сессию. Если её нет — пробуем «дожать» из sessionStorage.
  useEffect(() => {
    let cancelled = false;

    const whoAmI = async () => {
      const res = await fetch('/api/user-info', { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    };

    const bootstrapFromSessionStorage = async () => {
      // Пробуем токен и steamId, положенные /api/steam/return
      const ssToken = sessionStorage.getItem('token');
      const ssSteam = sessionStorage.getItem('steamId'); // steam:7656... или 7656...
      if (!ssToken) return null;

      try {
        const cred = await signInWithCustomToken(auth, ssToken);
        const idToken = await cred.user.getIdToken();

        // Создаём серверную сессию (httpOnly cookie)
        const resp = await fetch('/api/sessionLogin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token: idToken }),
        });
        if (!resp.ok) return null;

        // Вернём данные пользователя
        const me = await whoAmI();
        return me;
      } catch (e) {
        console.error('Bootstrap from sessionStorage failed:', e);
        return null;
      }
    };

    (async () => {
      try {
        setLoading(true);
        setErrorText('');

        // 1) Пытаемся узнать, кто мы, по серверной куке.
        let me = await whoAmI();

        // 2) Если серверая сессия отсутствует — пробуем восстановить из sessionStorage.
        if (!me) {
          me = await bootstrapFromSessionStorage();
        }

        if (!me || !me.uid) {
          setErrorText('Missing Steam session. Please login with Steam again.');
          return;
        }

        if (cancelled) return;

        // Устанавливаем uid и steamId
        setUid(me.uid);
        const id64 = me.uid.startsWith('steam:') ? me.uid.slice('steam:'.length) : me.uid;
        setSteamId(id64);

        // Опционально — запросим новый custom token для передачи в state Discord
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
        } catch {}
      } catch (e) {
        console.error(e);
        if (!cancelled) setErrorText('Unexpected error. Please login again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSteamLogin = useCallback(() => {
    router.push('/login');
  }, [router]);

  const handleConnectDiscord = useCallback(() => {
    // Если всё ещё нет uid/steamId — ведём на логин Steam
    if (!uid || !steamId) {
      handleSteamLogin();
      return;
    }

    const stateObj = { steamId: `steam:${steamId}` };
    if (token) stateObj.token = token;
    const state = btoa(JSON.stringify(stateObj));

    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI;

    const url =
      `https://discord.com/oauth2/authorize` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code&scope=identify` +
      `&state=${encodeURIComponent(state)}`;

    window.location.href = url;
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
          {errorText && <div className="text-red-400 mb-4">{errorText}</div>}

          <div className="flex gap-3">
            <button
              onClick={handleConnectDiscord}
              className="px-6 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              title={!uid ? 'Click to login with Steam first' : 'Connect your Discord account'}
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
