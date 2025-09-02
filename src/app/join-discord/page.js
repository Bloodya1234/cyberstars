// src/app/join-discord/page.js
'use client';

import { useEffect, useState } from 'react';

export default function JoinDiscordPage() {
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  // Автопроверка членства каждые 5 секунд
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        setChecking(true);
        const r = await fetch('/api/discord/check', { cache: 'no-store', credentials: 'include' });
        if (!alive) return;
        if (r.ok) {
          const j = await r.json();
          if (j?.isMember) {
            window.location.replace('/profile');
            return;
          }
        }
      } catch (e) {
        if (alive) setError('Check failed, retrying…');
      } finally {
        if (alive) setChecking(false);
        setTimeout(() => alive && tick(), 5000);
      }
    };
    tick();
    return () => { alive = false; };
  }, []);

  const manualInvite = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-bold mb-2">Join our Discord</h1>
      <p className="opacity-80 mb-4">
        Please join the Discord server to continue. This page will auto-continue once you join.
      </p>

      {manualInvite && (
        <a
          href={manualInvite}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 underline mb-4"
        >
          Click here to join manually
        </a>
      )}

      <div className="text-sm opacity-70">
        {checking ? 'Checking membership…' : 'Waiting for join…'}
        {error && <div className="text-red-400 mt-2">{error}</div>}
      </div>
    </div>
  );
}
