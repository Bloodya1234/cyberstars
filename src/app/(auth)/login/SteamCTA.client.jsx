// src/app/(auth)/login/SteamCTA.client.jsx
'use client';
import React from 'react';

export default function SteamCTA({ className = '' }) {
  // Если путь другой — поменяй ниже
  const href = process.env.NEXT_PUBLIC_STEAM_LOGIN_PATH || '/steam-login';

  return (
    <a
      href={href}
      className={`steam-cta-mini inline-flex items-center gap-2 rounded-lg px-3 py-2 
                  text-sm font-semibold text-white/90 bg-black/35 backdrop-blur 
                  hover:bg-black/45 transition ${className}`}
      aria-label="Login with Steam"
    >
      <span>Login with Steam</span>
    </a>
  );
}
