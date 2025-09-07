'use client';

import dynamic from 'next/dynamic';

// Лоадер на время загрузки кнопки
function SteamLoginFallback({ className, children }) {
  return (
    <a
      href="/steam-login"
      className={
        (className ?? '') +
        ' inline-flex items-center gap-2 rounded-full px-6 py-3 text-base ' +
        'bg-gradient-to-r from-rose-500 to-orange-500 text-white/90 shadow-lg shadow-rose-900/30'
      }
    >
      {children ?? 'Login with Steam'}
    </a>
  );
}

// Подгружаем реальную кнопку как клиентский компонент
const SteamLoginButton = dynamic(
  async () => {
    const m = await import('@/components/SteamLoginButton');
    return m.default || m;
  },
  { ssr: false, loading: () => <SteamLoginFallback /> }
);

export default function SteamCTA({ className, children }) {
  return <SteamLoginButton className={className}>{children}</SteamLoginButton>;
}
