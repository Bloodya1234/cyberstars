// src/app/join-discord/JoinDiscordClient.js
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const INVITE_URL =
  process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || 'https://discord.gg/yourInvite';

export default function JoinDiscordClient() {
  const router = useRouter();
  const [me, setMe] = useState(null);

  // Тянем текущего пользователя (uid + discord.id)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/user-info', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!r.ok) return;
        const j = await r.json();
        if (!cancelled) setMe(j);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openInvite = useCallback(() => {
    try {
      window.open(INVITE_URL, '_blank', 'noopener,noreferrer');
    } catch {
      // ignore
    }
  }, []);

  // Открываем инвайт, неблокирующе пингуем чекер и затем уходим в профиль
  const openInviteAndGoProfile = useCallback(() => {
    openInvite();

    // Если знаем discordId и uid — дергаем чекер, чтобы выставить флаг в Firestore
    if (me?.discord?.id && me?.uid) {
      const params = new URLSearchParams();
      params.set('discordId', me.discord.id);
      params.set('uid', me.uid);

      // keepalive — чтобы запрос не оборвался при навигации
      fetch(`/api/discord/check?${params.toString()}`, {
        cache: 'no-store',
        keepalive: true,
      }).catch(() => {});
    }

    // Небольшая пауза, чтобы запрос успел уйти, затем переходим в профиль
    setTimeout(() => router.replace('/profile'), 500);
  }, [openInvite, me, router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-bold mb-3">Join our Discord</h1>
      <p className="opacity-80 mb-6">
        Please join the Discord server to finish your setup.
      </p>

      <div className="flex flex-col gap-3">
        <button
          onClick={openInviteAndGoProfile}
          className="px-6 py-3 rounded bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Open Discord Invite &amp; Go to Profile
        </button>
      </div>
    </main>
  );
}
