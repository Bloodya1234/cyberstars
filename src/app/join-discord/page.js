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
    'https://discord.com';

  const poll = async () => {
    try {
      setChecking(true);
      setError('');

      // добавь ?debug=1 на время отладки, потом можно убрать
      const res = await fetch('/api/discord/check?debug=1', {
        cache: 'no-store',
        credentials: 'include',
      });

      const text = await res.text();
      let data = {};
      try { data = JSON.parse(text); } catch { /* no-op */ }

      if (!res.ok) {
        // Быстрое ветвление по статусам
        if (res.status === 401) return router.replace('/login');
        if (res.status === 409) return router.replace('/connect-discord');
        setError(text || `HTTP ${res.status}`);
        return;
      }

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

  useEffect(() => {
    poll();
    timerRef.current = setInterval(poll, 5000);
    return () => timerRef.current && clearInterval(timerRef.current);
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

      {error && (
        <pre className="text-red-400 text-xs max-w-2xl whitespace-pre-wrap break-words">
          {error}
        </pre>
      )}
    </div>
  );
}
