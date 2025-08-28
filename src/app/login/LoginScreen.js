'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { app } from '@/firebase';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function LoginScreen() {
  const searchParams = useSearchParams();
  const { t } = useTranslation('common');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // сохранить инвайт до логина
    const inviteTeam = searchParams.get('inviteTeam');
    if (inviteTeam) sessionStorage.setItem('inviteTeam', inviteTeam);

    const auth = getAuth(app);
    const db = getFirestore(app);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const storedInviteTeam = sessionStorage.getItem('inviteTeam');
      if (storedInviteTeam) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data();
            const incoming = data.invites?.incoming || [];
            if (!incoming.includes(storedInviteTeam)) {
              await updateDoc(userRef, { invites: { incoming: [...incoming, storedInviteTeam] } });
            }
          }
        } catch (e) {
          console.error('Failed to update invite info:', e);
        } finally {
          sessionStorage.removeItem('inviteTeam');
        }
      }

      // после логина — на подключение Discord
      window.location.href = '/connect-discord';
    });

    return () => unsubscribe();
  }, [searchParams]);

  const handleSteamLogin = () => {
    const inviteTeam = searchParams.get('inviteTeam') || '';
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_BASE_URL || 'https://dota-platform-cyberstars.vercel.app');

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

        {/* … блоки с правилами и режимами … */}
      </div>
    </div>
  );
}
