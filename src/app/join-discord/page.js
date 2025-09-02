// src/app/join-discord/page.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinDiscordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  // ⚠️ discordId нужно знать. Мы берём его из /api/user-info (куки-сессия уже должна быть)
  const [discordId, setDiscordId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const meRes = await fetch('/api/user-info', { credentials: 'include', cache: 'no-store' });
        if (!meRes.ok) return;
        const me = await meRes.json();
        if (!cancelled) setDiscordId(me?.discord?.id || null);
      } catch {}
    })();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!discordId) return;

    let cancelled = false;
    let timer;

    async function tick() {
      try {
        setChecking(true);
        const r = await fetch(`/api/discord/check?discordId=${encodeURIComponent(discordId)}`, {
          cache: 'no-store',
        });
        const j = await r.json().catch(() => ({}));
        // не показываем ошибки — просто ждём, пока станет true
        if (j?.isMember) {
          router.replace('/profile');
          return;
        }
      } catch {}
      finally {
        setChecking(false);
        // запускаем следующий опрос
        if (!cancelled) {
          timer = setTimeout(tick, 5000);
        }
      }
    }

    tick();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [discordId, router]);

  // Ссылка-инвайт — та же, что у тебя в настройках
  const inviteUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || 'https://discord.gg/zeU7RPskKg';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <h1 className="text-5xl font-extrabold mb-6">Join our Discord</h1>
      <p className="opacity-80 mb-6">You must join our Discord server to use the platform.</p>

      <a
        href={inviteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-cyan-400 underline text-3xl mb-4"
      >
        Join Discord Server
      </a>

      <div className="opacity-60">{checking ? 'Checking…' : 'We check every 5s automatically.'}</div>
    </div>
  );
}
