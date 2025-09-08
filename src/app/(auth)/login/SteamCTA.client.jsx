'use client';

export default function SteamCTA({ className = '' }) {
  return (
    <a
      id="steam-login-cta"
      href="/steam-login"
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold
                  bg-gradient-to-r from-rose-500 to-orange-500
                  hover:from-rose-600 hover:to-orange-600
                  text-white shadow-lg shadow-rose-900/40
                  transition-transform hover:scale-[1.05] ${className}`}
    >
      🚀 Login with Steam
    </a>
  );
}
