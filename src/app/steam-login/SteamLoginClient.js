'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { app } from '@/firebase';

export default function SteamLoginClient() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // 1) Токен/steamId из query или sessionStorage
        const ss = typeof window !== 'undefined' ? window.sessionStorage : null;
        let token = sp.get('token') || (ss ? ss.getItem('token') : '');
        let steamId = sp.get('steamId') || (ss ? ss.getItem('steamId') : '');

        if (!token) {
          router.replace('/login');
          return;
        }

        // 2) Логин в Firebase по кастомному токену
        const auth = getAuth(app);
        const cred = await signInWithCustomToken(auth, token);
        if (!cred?.user) {
          router.replace('/login');
          return;
        }

        // 3) Обмениваем idToken на session cookie
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

        // 4) Узнаём состояние пользователя
        const uRes = await fetch('/api/user-info', { credentials: 'include', cache: 'no-store' });
        if (!uRes.ok) {
          router.replace('/login');
          return;
        }
        const me = await uRes.json();

        // 5) Если Discord не привязан — отправляем коннектить
        if (!me?.discord?.id) {
          router.replace('/connect-discord');
          return;
        }

        // 6) Если привязан — проверяем членство на сервере Discord
        const chk = await fetch(`/api/discord/check?discordId=${encodeURIComponent(me.discord.id)}`, {
          cache: 'no-store',
        });

        if (chk.ok) {
          const j = await chk.json();
          if (j?.isMember) {
            router.replace('/profile');
            return;
          }
        }

        // Привязан, но не вступил — ведём на страницу приглашения
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
