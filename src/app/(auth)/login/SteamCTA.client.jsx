'use client';

export default function SteamCTA({ className = '' }) {
  return (
    <a
      id="steam-login-cta"
      href="/steam-login"
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold
                  text-white no-underline ${className}`}
    >
      🚀 Login with Steam
    </a>
  );
}
