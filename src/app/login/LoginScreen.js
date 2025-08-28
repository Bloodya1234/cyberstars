'use client';

// src/app/login/LoginScreen.js
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { app } from '@/firebase';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function LoginClient() {
  const searchParams = useSearchParams();
  const { t } = useTranslation('common');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // сохраняем инвайт, обработаем после логина
    const inviteTeam = searchParams.get('inviteTeam');
    if (inviteTeam) sessionStorage.setItem('inviteTeam', inviteTeam);

    const auth = getAuth(app);
    const db = getFirestore(app);

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const storedInviteTeam = sessionStorage.getItem('inviteTeam');
      if (storedInviteTeam) {
        try {
          const ref = doc(db, 'users', user.uid);
          const snap = await getDoc(ref);

          if (snap.exists()) {
            const data = snap.data();
            const current = data.invites?.incoming || [];
            if (!current.includes(storedInviteTeam)) {
              await updateDoc(ref, {
                invites: { incoming: [...current, storedInviteTeam] },
              });
            }
          }
        } catch (e) {
          console.error('❌ Failed to update invite info:', e);
        } finally {
          sessionStorage.removeItem('inviteTeam');
        }
      }

      // после логина — подключение Discord
      window.location.href = '/connect-discord';
    });

    return () => unsub();
  }, [searchParams]);

  const handleSteamLogin = () => {
    const inviteTeam = searchParams.get('inviteTeam') || '';

    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_BASE_URL || 'https://dota-platform-cyberstars.vercel.app');

    // return_to и realm строим от текущего домена
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

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-800 to-gray-900 flex items-start justify-center px-4 py-10 relative">
      <div className="absolute top-6 right-6 z-50">
        <LanguageSwitcher />
      </div>

      <div className="max-w-5xl w-full bg-white/10 backdrop-blur-lg border border-white/10 shadow-2xl rounded-2xl p-6 md:p-12 space-y-10 text-white">
        <div className="flex justify-end">
          <button
            onClick={handleSteamLogin}
            className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white px-6 py-3 rounded-full text-lg font-bold shadow-lg transition transform hover:scale-105"
          >
            {t('login_button')}
          </button>
        </div>

        <div>
          <h1 className="text-4xl font-extrabold text-white mb-2">{t('welcome_title')}</h1>
          <p className="text-lg text-gray-200 max-w-3xl">{t('intro_text')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/10 rounded-xl p-6 border border-white/10 shadow-inner hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-3 text-blue-300">{t('modes_title')}</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-200">
              <li>{t('mode_1')}</li>
              <li>{t('mode_2')}</li>
              <li>{t('mode_3')}</li>
              <li>{t('mode_4')}</li>
            </ul>
          </div>

          <div className="bg-white/10 rounded-xl p-6 border border-white/10 shadow-inner hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-3 text-green-300">{t('fairplay_title')}</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-200">
              <li>{t('fair_1')}</li>
              <li>{t('fair_2')}</li>
              <li>{t('fair_3')}</li>
              <li>{t('fair_4')}</li>
              <li>{t('fair_5')}</li>
            </ul>
          </div>
        </div>

        <div className="text-center text-gray-300 text-md border-t border-white/10 pt-6">
          {t('footer_text')} <br />
          <span className="font-bold text-white">{t('footer_glhf')}</span>
        </div>
      </div>
    </div>
  );
}