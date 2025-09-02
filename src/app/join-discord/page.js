// src/app/join-discord/page.js
'use client';

import Link from 'next/link';
import { useMemo } from 'react';

export default function JoinDiscordPage() {
  // Берём инвайт из ENV; если забыли https:// — добавим
  const inviteUrl = useMemo(() => {
    const raw = (process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || '').trim();
    if (!raw) return '';
    return raw.startsWith('http') ? raw : `https://${raw}`;
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 text-center gap-8">
      <div>
        <h1 className="text-5xl font-extrabold mb-4">Join our Discord</h1>
        <p className="opacity-80 text-xl">
          You must join our Discord server to use the platform.
        </p>
      </div>

      {/* Кнопки РЯДОМ; на маленьких экранах аккуратно переносятся */}
      <div className="flex flex-row flex-wrap items-center justify-center gap-4">
        {inviteUrl ? (
          <a
            href={inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded bg-cyan-500 text-black font-semibold hover:bg-cyan-400 inline-flex items-center justify-center"
          >
            Join Discord Server
          </a>
        ) : (
          <span className="px-6 py-3 rounded bg-gray-700 text-white">
            Invite link is not configured
          </span>
        )}

        {/* НАДЁЖНЫЙ переход без JS через Link */}
        <Link
          href="/profile"
          prefetch={false}
          className="px-6 py-3 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-500 inline-flex items-center justify-center"
        >
          Go to Profile
        </Link>
      </div>

      {inviteUrl && (
        <p className="opacity-70 text-sm">The invite opens in a new tab.</p>
      )}
    </div>
  );
}
