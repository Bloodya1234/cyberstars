'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinDiscordPage() {
  const router = useRouter();
  const [discordId, setDiscordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);

  // ✅ Получаем discordId из Firestore-пользователя
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/user-info', { credentials: 'include' });
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const me = await res.json(); // { uid, discord: { id: ... } }
        if (me?.discord?.id) {
          setDiscordId(me.discord.id);
        }
      } catch (e) {
        console.error('Failed to fetch user-info:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ✅ Проверяем членство на сервере
  useEffect(() => {
    if (!discordId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/discord/check?discordId=${discordId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.isMember) {
            clearInterval(interval);
            setIsMember(true);
            router.push('/profile');
          }
        }
      } catch (e) {
        console.error('Check failed:', e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [discordId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Checking your Discord status...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 text-center">
      <h1 className="text-3xl font-bold mb-4">Join our Discord</h1>
      <p className="mb-6">You must join our Discord server to use the platform.</p>

      {!isMember && (
        <a
          href={process.env.NEXT_PUBLIC_DISCORD_INVITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Join Discord Server
        </a>
      )}
    </div>
  );
}
