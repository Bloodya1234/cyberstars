'use client';
import { useSearchParams } from 'next/navigation';

export default function SteamLoginButton({ className = '', children = 'Login with Steam' }) {
  const searchParams = useSearchParams();

  const handleSteamLogin = () => {
    const inviteTeam = searchParams.get('inviteTeam') || '';

    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com'); // подставь домен, если нужно

    const returnToUrl = new URL('/api/steam/return', origin);
    if (inviteTeam) returnToUrl.searchParams.set('inviteTeam', inviteTeam);

    const realm = origin.endsWith('/') ? origin : `${origin}/`;

    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': returnToUrl.toString(),
      'openid.realm': realm,
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    });

    window.location.href = `https://steamcommunity.com/openid/login?${params.toString()}`;
  };

  return (
    <button
      onClick={handleSteamLogin}
      className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold
      bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600
      text-white shadow-lg shadow-rose-900/30 transition-transform hover:scale-[1.03] ${className}`}
    >
      🚀 {children}
    </button>
  );
}
