// src/app/join-discord/page.js
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Страница приглашает в Discord и параллельно пингует /api/discord/check.
 * Как только видим, что юзер уже в сервере — сразу перекидываем на /profile.
 */
export default function JoinDiscordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const inviteUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL; // <- обычный инвайт discord.gg/...

  const timerRef = useRef(null);

  async function checkNow() {
    try {
      setChecking(true);
      const r = await fetch('/api/discord/check', { credentials: 'include' });
      const data = await r.json().catch(() => ({}));
      setLastResult({ status: r.status, data });

      if (r.ok && data?.ok && data?.isMember) {
        router.replace('/profile');
      }
    } catch (e) {
      setLastResult({ status: 0, data: { error: String(e?.message || e) } });
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    // мгновенно проверим один раз
    checkNow();

    // потом — автоповтор каждые 4 секунды
    timerRef.current = setInterval(checkNow, 4000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-5xl font-extrabold mb-6">Join our Discord</h1>
      <p className="text-xl opacity-80 mb-8">
        You must join our Discord server to use the platform.
      </p>

      <a
        href={inviteUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="px-6 py-3 rounded bg-cyan-500/30 ring-2 ring-cyan-400 hover:bg-cyan-500/40"
      >
        Join Discord Server
      </a>

      <div className="mt-6 text-sm opacity-70">
        {checking ? 'Checking your membership…' : 'Waiting for your join…'}
      </div>

      {/* В отладочных целях можно показать последний ответ */}
      {/* <pre className="mt-4 text-xs opacity-60">{JSON.stringify(lastResult, null, 2)}</pre> */}
    </div>
  );
}
