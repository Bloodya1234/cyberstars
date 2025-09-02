// src/app/join-discord/page.js
'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinDiscordPage() {
  const router = useRouter();

  // инвайт берём из ENV
  const inviteUrl = useMemo(() => {
    const v = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL?.trim();
    return v && !v.startsWith('http') ? `https://${v}` : v || '';
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 text-center gap-8">
      <div>
        <h1 className="text-5xl font-extrabold mb-4">Join our Discord</h1>
        <p className="opacity-80 text-xl">
          You must join our Discord server to use the platform.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        {inviteUrl ? (
          <a
            href={inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded bg-cyan-500 text-black font-semibold hover:bg-cyan-400"
          >
            Join Discord Server
          </a>
        ) : (
          <div className="px-6 py-3 rounded bg-gray-700 text-white">
            Invite link is not configured
          </div>
        )}

        <button
          onClick={() => router.replace('/profile')}
          className="px-6 py-3 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-500"
        >
          Go to Profile
        </button>
      </div>

      {inviteUrl && (
        <p className="opacity-70 text-sm">The invite opens in a new tab.</p>
      )}
    </div>
  );
}
