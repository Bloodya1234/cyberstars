'use client';

import dynamic from 'next/dynamic';

// Фолбэк на время загрузки
function Fallback({ className, children }) {
  return (
    <a
      href="/steam-login"
      className={
        `inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold
         bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-lg
         shadow-rose-900/30 transition-transform hover:scale-[1.03] ` + (className ?? '')
      }
    >
      🚀 {children ?? 'Login with Steam'}
    </a>
  );
}

// Реальная кнопка из проекта, грузим без SSR
const SteamLoginButton = dynamic(
  async () => {
    const mod = await import('@/components/SteamLoginButton');
    return mod.default || mod;
  },
  { ssr: false, loading: () => <Fallback /> }
);

export default function SteamCTA({ className, children }) {
  return <SteamLoginButton className={className}>{children}</SteamLoginButton>;
}
