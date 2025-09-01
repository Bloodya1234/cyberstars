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
        // Токен и steamId могут прийти в query (после /api/steam/return)
        // или лежать в sessionStorage (для совместимости со старым потоком)
        const fromQS = {
          token: sp.get('token') || '',
          steamId: sp.get('steamId') || '',
        };

        let token = fromQS.token;
        let steamId = fromQS.steamId;

        if (typeof window !== 'undefined') {
          if (!token) token = sessionStorage.getItem('token') || '';
          if (!steamId) steamId = sessionStorage.getItem('steamId') || '';
        }

        if (!token) {
          router.replace('/login');
          return;
        }

        // 1) Логинимся в Firebase на клиенте
        const auth = getAuth(app);
        const cred = await signInWithCustomToken(auth, token);
        if (!cred?.user) {
          router.replace('/login');
          return;
        }

        // 2) Получаем свежий idToken и просим сервер поставить session cookie
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

        // 3) Узнаём состояние пользователя
        const u = await fetch('/api/user-info', { credentials: 'include' });
        if (!u.ok) {
          router.replace('/login');
          return;
        }
        const me = await u.json();

        // Если Discord ещё не привязан — отправляем коннектить
        if (!me?.discord?.id) {
          router.replace('/connect-discord');
          return;
        }

        // Если привязан — проверяем членство на сервере
        const chk = await fetch(`/api/discord/check?discordId=${me.discord.id}`, { cache: 'no-store' });
        if (chk.ok) {
          const j = await chk.json();
          if (j.isMember) {
            router.replace('/profile');
            return;
          }
        }

        // Привязан, но ещё не вступил — ведём на страницу с приглашением
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
