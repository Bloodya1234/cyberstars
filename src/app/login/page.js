'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/user-info', { cache: 'no-store' });
        if (!r.ok) return;
        const u = await r.json();
        if (u?.uid && u?.discord?.id && u?.joinedDiscordServer === true) {
          router.replace('/profile');
        }
      } catch {}
    })();
  }, [router]);

  // ...остальной UI логина
}

import LoginScreen from './LoginScreen';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'default-no-store';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-white">Loading…</div>}>
      <LoginScreen />
    </Suspense>
  );
}
