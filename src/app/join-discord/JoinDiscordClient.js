// src/app/join-discord/JoinDiscordClient.js
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const INVITE_URL =
  process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || 'https://discord.gg/yourInvite';

export default function JoinDiscordClient() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [checking, setChecking] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/user-info', { credentials: 'include', cache: 'no-store' });
        if (!r.ok) return;
        const j = await r.json();
        if (!cancelled) setMe(j);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const openInvite = useCallback(() => {
    window.open(INVITE_URL, '_blank', 'noopener,noreferrer');
  }, []);

  // Вариант A — сразу уходим на профиль после открытия инвайта
  const openInviteAndGoProfile = useCallback(() => {
    openInvite();
    router.replace('/profile');
  }, [openInvite, router]);

  // Вариант B — ждём подтверждение от бота (polling)
  const openInviteAndWait = useCallback(() => {
    openInvite();
    if (!me?.discord?.id) return;

    setChecking(true);
    let tries = 0;
    const maxTries = 20; // ~60s

    const tick = async () => {
      tries += 1;
      try {
        const params = new URLSearchParams();
        params.set('discordId', me.discord.id);
        if (me.uid) params.set('uid', me.uid);
        const r = await fetch(`/api/discord/check?${params.toString()}`, { cache: 'no-store' });
        const j = await r.json();
        if (j?.isMember) {
          router.replace('/profile');
          return;
        }
      } catch {}
      if (tries < maxTries) {
        timerRef.current = setTimeout(tick, 3000);
      } else {
        setChecking(false);
      }
    };

    tick();
  }, [me, openInvite, router]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-bold mb-3">Join our Discord</h1>
      <p className="opacity-80 mb-6">Please join the Discord server to finish your setup.</p>

      <div className="flex flex-col gap-3">
        <button
          onClick={openInviteAndGoProfile}
          className="px-6 py-3 rounded bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Open Discord Invite & Go to Profile
        </button>

        <button
          onClick={openInviteAndWait}
          disabled={!me?.discord?.id || checking}
          className="px-6 py-3 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {checking ? 'Waiting for membership…' : 'Open Invite & Wait for Check'}
        </button>

        <button
          onClick={() => router.replace('/profile')}
          className="mt-4 px-6 py-3 rounded bg-gray-700 text-white hover:bg-gray-800"
        >
          Go to Profile now
        </button>
      </div>
    </main>
  );
}
