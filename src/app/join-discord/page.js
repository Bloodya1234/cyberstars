// src/app/join-discord/page.js
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinDiscordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef(null);

  const inviteUrl =
    process.env.NEXT_PUBLIC_DISCORD_INVITE_URL ||
    'https://discord.com'; // подставь свою постоянную ссылку-приглашение

  // Функция опроса сервера
  const poll = async () => {
    try {
      setChecking(true);
      setError('');

      // НЕ передаём discordId — сервер сам найдёт по сессии/Firestore
      const res = await fetch('/api/discord/check', { cache: 'no-store', credentials: 'include' });
      if (!res.ok) {
        // если нет привязки или нет сессии — отправим человека под привязку/логин
        if (res.status === 401) return router.replace('/login');
        if (res.status === 409) return router.replace('/connect-discord');

        const text = await res.text();
        setError(text || 'Check failed');
        return;
      }

      const data = await res.json();
      if (data?.isMember) {
        router.replace('/profile');
        return;
      }
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setChecking(false);
    }
  };

  // Первый запрос и последующий поллинг
  useEffect(() => {
    poll(); // сразу проверим один раз

    timerRef.current = setInterval(poll, 5000); // затем каждые 5 сек
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-6">
      <h1 className="text-5xl font-extrabold">Join our Discord</h1>

      <p className="opacity-80">
        You must join our Discord server to use the platform.
      </p>

      <a
        href={inviteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-6 py-3 rounded bg-cyan-500 text-black font-semibold hover:opacity-90"
      >
        Join Discord Server
      </a>

      <div className="opacity-70 text-sm">
        {checking ? 'Waiting for your join…' : 'We check every 5s automatically.'}
      </div>

      {error && <div className="text-red-400 text-sm max-w-xl break-words">{error}</div>}
    </div>
  );
}
