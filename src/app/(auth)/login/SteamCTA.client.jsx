'use client';

import dynamic from 'next/dynamic';

function Fallback({ className }) {
  return (
    <a
      href="/steam-login"
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold
                  bg-gradient-to-r from-rose-500 to-orange-500
                  hover:from-rose-600 hover:to-orange-600
                  text-white shadow-lg shadow-rose-900/40
                  transition-transform hover:scale-[1.05] ${className ?? ''}`}
    >
      🚀 Login with Steam
    </a>
  );
}

const SteamLoginButton = dynamic(
  async () => {
    const m = await import('@/components/SteamLoginButton');
    return m.default || m;
  },
  { ssr: false, loading: () => <Fallback /> }
);

export default function SteamCTA({ className }) {
  return (
    <SteamLoginButton
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold
                  bg-gradient-to-r from-rose-500 to-orange-500
                  hover:from-rose-600 hover:to-orange-600
                  text-white shadow-lg shadow-rose-900/40
                  transition-transform hover:scale-[1.05] ${className ?? ''}`}
    >
      🚀 Login with Steam
    </SteamLoginButton>
  );
}
