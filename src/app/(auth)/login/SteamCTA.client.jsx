'use client';

import dynamic from 'next/dynamic';

// fallback на время загрузки кнопки
function Fallback({ className }) {
  return (
    <a
      href="/steam-login"
      className={
        `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold
         bg-white/10 text-white hover:bg-white/15 transition-colors
         ring-1 ring-white/20 backdrop-blur-md ` + (className ?? '')
      }
    >
      🚀 Login with Steam
    </a>
  );
}

// реальная кнопка проекта (если у тебя есть '@/components/SteamLoginButton')
const SteamLoginButton = dynamic(
  async () => {
    const m = await import('@/components/SteamLoginButton');
    return m.default || m;
  },
  { ssr: false, loading: () => <Fallback /> }
);

export default function SteamCTA({ className }) {
  return <SteamLoginButton className={className}>Login with Steam</SteamLoginButton>;
}
