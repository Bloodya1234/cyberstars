// src/app/steam-login/page.js
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { app } from '@/firebase';

export default function SteamLoginPage() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // токен может прийти в query (после /api/steam/return) или быть в sessionStorage
        let token = sp.get('token') || (typeof window !== 'undefined' ? sessionStorage.getItem('token') : '');
        let steamId = sp.get('steamId') || (typeof window !== 'undefined' ? sessionStorage.getItem('steamId') : '');

        if (!token) {
          // если нет токена — просто перебросим на /login
          router.replace('/login');
          return;
        }

        // 1) логинимся в Firebase клиентом
        const auth = getAuth(app);
        const cred = await signInWithCustomToken(auth, token);
        if (!cred?.user) {
          router.replace('/login');
          return;
        }

        // 2) получаем свежий idToken и ставим session cookie
        const idToken = await cred.user.getIdToken(true);
        const resp = await fetch('/api/sessionLogin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: idToken }),
          credentials: 'include',
        });
        if (!resp.ok) {
          router.replace('/login');
          return;
        }

        // 3) узнаем состояние пользователя
        const u = await fetch('/api/user-info', { credentials: 'include' });
        if (!u.ok) {
          router.replace('/login');
          return;
        }
        const me = await u.json();

        // если нет привязки Discord — ведём привязать
        if (!me?.discord?.id) {
          router.replace('/connect-discord');
          return;
        }

        // если привязка есть — проверяем членство
        const chk = await fetch(`/api/discord/check?discordId=${me.discord.id}`, { cache: 'no-store' });
        if (chk.ok) {
          const j = await chk.json();
          if (j.isMember) {
            router.replace('/profile');
            return;
          }
        }

        // привязан, но ещё не вступил — на /join-discord
        router.replace('/join-discord');
      } catch (e) {
        console.error('steam-login error:', e);
        router.replace('/login');
      }
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      Finishing login…
    </div>
  );
}
