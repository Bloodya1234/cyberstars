'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '@/firebase';

const auth = getAuth(app);
const db = getFirestore(app);

export default function ConnectDiscordPage() {
  const [steamId, setSteamId] = useState(null);
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedSteamId = sessionStorage.getItem('steamId');
    const storedToken = sessionStorage.getItem('token');

    setSteamId(storedSteamId || null);
    setToken(storedToken || null);

    if (!storedToken) {
      setReady(true);
      return;
    }

    // 1) Firebase sign-in (для установки server-side session cookie)
    signInWithCustomToken(auth, storedToken)
      .then(async (res) => {
        const idToken = await res.user.getIdToken();

        // 2) Просим сервер поставить httpOnly session cookie
        const response = await fetch('/api/sessionLogin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: idToken }),
          credentials: 'include',
        });

        if (!response.ok) {
          setError('Failed to create session cookie');
          setReady(true);
          return;
        }

        // 3) Если Discord уже подключён — ведём на профиль
        const userRef = doc(db, 'users', res.user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.discord?.id) {
            router.push('/profile');
            return;
          }
        }

        setReady(true);
      })
      .catch((err) => {
        console.error('Firebase sign-in failed:', err);
        setError('Firebase sign-in failed');
        setReady(true);
      });
  }, [router]);

  const handleConnectDiscord = () => {
    setError('');

    if (!steamId || !token) {
      setError('Missing Steam session. Please login with Steam again.');
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      setError('Discord env vars are not configured');
      return;
    }

    // Передаём steamId + token в state, чтобы callback смог продолжить сессии
    const state = btoa(JSON.stringify({ steamId, token }));

    // ВАЖНО: /api/ в пути авторизации
    const discordAuthUrl =
      `https://discord.com/api/oauth2/authorize` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=identify` +
      `&state=${encodeURIComponent(state)}`;

    window.location.href = discordAuthUrl;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-6">
      <h1 className="text-3xl font-bold">Connect your Discord</h1>
      <p className="text-gray-400 max-w-md">
        Connect your Discord account to receive invites to teams and tournaments.
      </p>

      {error && (
        <div className="text-red-400 text-sm">{error}</div>
      )}

      <button
        onClick={handleConnectDiscord}
        disabled={!ready}
        className={`px-6 py-3 rounded text-white ${
          ready ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-500 cursor-not-allowed'
        }`}
      >
        {ready ? 'Connect Discord' : 'Preparing…'}
      </button>
    </div>
  );
}
