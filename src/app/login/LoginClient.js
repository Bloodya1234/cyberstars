'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n.client';
import Header from '@/components/Header';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function LoginScreen() {
  const searchParams = useSearchParams();
  const { t } = useTranslation('common');

  // сохраняем инвайт в localStorage, чтоб после логина использовать
  useEffect(() => {
    const inviteTeam = searchParams.get('inviteTeam');
    if (inviteTeam) {
      try {
        localStorage.setItem('inviteTeam', inviteTeam);
      } catch {}
    }
  }, [searchParams]);

  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_BASE_URL;

  const handleSteamLogin = () => {
    window.location.href = `${origin}/api/steam/login`;
  };

  const handleDiscordLogin = () => {
    window.location.href = `${origin}/api/discord/login`;
  };

  return (
    <>
      <Header />
      <div className="min-h-[calc(100vh-80px)] bg-black text-white flex justify-center">
        <div className="w-full max-w-3xl px-6 py-10">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Cyberstars — {t('login.title', 'Login')}</h1>
            <LanguageSwitcher />
          </div>

          <p className="text-gray-300 mb-6">
            {t(
              'login.subtitle',
              'Sign in with Steam to link your Dota account. Then connect Discord to join teams and tournaments.'
            )}
          </p>

          <div className="flex flex-col gap-3 mb-12">
            <button
              onClick={handleSteamLogin}
              className="bg-[#1b2838] hover:bg-[#16202a] text-white px-5 py-3 rounded-md text-lg"
            >
              {t('login.continue_steam', 'Continue with Steam')}
            </button>

            <button
              onClick={handleDiscordLogin}
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-5 py-3 rounded-md"
            >
              {t('login.continue_discord', 'Continue with Discord')}
            </button>
          </div>

          <div className="space-y-4 text-sm text-gray-300">
            <p className="font-semibold">{t('login.how_it_works', 'How it works')}</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>{t('login.step_1', 'Sign in with Steam')}</li>
              <li>{t('login.step_2', 'We read your Dota stats from OpenDota')}</li>
              <li>{t('login.step_3', 'Connect Discord to receive invites and DM')}</li>
              <li>{t('login.step_4', 'Join a team or create your own')}</li>
            </ol>

            <p className="font-semibold pt-2">{t('login.fairplay_title', 'Fair Play')}</p>
            <ul className="list-disc list-inside space-y-1">
              <li>{t('login.fair_1', 'No smurfing, no cheating')}</li>
              <li>{t('login.fair_2', 'Keep your match history public')}</li>
              <li>{t('login.fair_3', 'Be respectful in chats')}</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
