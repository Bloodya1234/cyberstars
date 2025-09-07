// src/app/find/FindClient.js
'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n.client';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '@/firebase';
import ClientLayout from '@/components/ClientLayout';
import Link from 'next/link';
import Image from 'next/image';

const db = getFirestore(app);
const auth = getAuth(app);

// ----- Хелпер: строим корректный инвайт-линк -----
function buildInviteLink(teamId) {
  // пробуем BASE_URL из env, иначе берём текущий origin (и убираем хвостовые '/')
  const base =
    (process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : ''))
      .replace(/\/+$/, '');
  // ведём на steam-login, чтобы сразу запустился Steam OAuth и мы поймали inviteTeam
  return `${base}/steam-login?inviteTeam=${encodeURIComponent(teamId)}`;
}

async function fetchWinRateAndRank(uid) {
  try {
    const steamId32 = BigInt(uid.replace('steam:', '')) - BigInt('76561197960265728');
    const [wlRes, profileRes] = await Promise.all([
      fetch(`https://api.opendota.com/api/players/${steamId32}/wl`),
      fetch(`https://api.opendota.com/api/players/${steamId32}`),
    ]);
    const [wlData, profileData] = await Promise.all([wlRes.json(), profileRes.json()]);
    const win = wlData.win || 0;
    const lose = wlData.lose || 0;
    const winRate = win + lose > 0 ? Math.round((win / (win + lose)) * 100) : 'N/A';

    const rankTier = profileData.rank_tier;
    let rank = 'Unranked';
    if (rankTier) {
      const names = {
        1: 'Herald', 2: 'Guardian', 3: 'Crusader', 4: 'Archon',
        5: 'Legend', 6: 'Ancient', 7: 'Divine', 8: 'Immortal',
      };
      const tier = Math.floor(rankTier / 10);
      const division = rankTier % 10;
      rank = `${names[tier] || 'Unknown'}${tier < 8 ? ` ${division}` : ''}`;
    }

    return { winRate, rank };
  } catch {
    return { winRate: 'N/A', rank: 'Unranked' };
  }
}

export default function FindClient() {
  const { t } = useTranslation('common');

  const [view, setView] = useState('teams');
  const [teams, setTeams] = useState([]);
  const [gamers, setGamers] = useState([]);
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [isCaptain, setIsCaptain] = useState(false);

  // Подписка на auth + загрузка своей команды
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) return;

      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;

      const userData = userSnap.data();
      setUser({ ...userData, uid: firebaseUser.uid });

      if (userData.teamId) {
        const teamRef = doc(db, 'teams', userData.teamId);
        const teamSnap = await getDoc(teamRef);
        if (teamSnap.exists()) {
          const teamData = teamSnap.data();
          setTeam({ id: teamSnap.id, ...teamData });
          setIsCaptain(teamData.captainId === firebaseUser.uid);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Загрузка всех команд и игроков
  useEffect(() => {
    const fetchData = async () => {
      try {
        const teamsSnapshot = await getDocs(collection(db, 'teams'));
        const teamsData = teamsSnapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(t => t.name && (t.members?.length > 0 || t.memberIds?.length > 0));
        setTeams(teamsData);

        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = await Promise.all(
          usersSnapshot.docs.map(async d => {
            const data = d.data();
            const { winRate, rank } = await fetchWinRateAndRank(data.steamId || '');
            return {
              id: d.id,
              ...data,
              rank,
              winRate,
            };
          })
        );
        setGamers(usersData);
      } catch (error) {
        console.error('Error loading teams or users:', error);
      }
    };

    fetchData();
  }, []);

  // --- Отправка инвайта через бот-сервер с правильной ссылкой ---
  const handleSendInvite = async (target) => {
    if (!team || !isCaptain) return;
    const discordId = target.discord?.id || target.discordId;
    if (!discordId) return;

    try {
      const inviteLink = buildInviteLink(team.id); // ← ключевая правка

      const res = await fetch('/api/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientDiscordId: discordId,
          teamName: team.name || 'team',
          inviteLink,
        }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || 'Failed to send invite');
      alert('Invite sent!');
    } catch (e) {
      console.error(e);
      alert('Failed to send invite.');
    }
  };

  const handleJoinRequest = async (teamToJoin) => {
    if (!user || user.teamId) return;

    const res = await fetch('/api/send-join-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId: teamToJoin.id,
        userId: user.uid,
        userName: user.name || 'Player',
      }),
    });

    if (res.ok) {
      alert('Join request sent!');
    } else {
      const error = await res.json().catch(() => ({}));
      alert(`Failed: ${error.error || 'Unknown error'}`);
    }
  };

  return (
    <ClientLayout>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">{t('find.title')}</h1>

        <div className="flex gap-4 mb-6">
          <button
            className={`px-4 py-2 rounded ${view === 'teams' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setView('teams')}
          >
            {t('find.teams')}
          </button>
          <button
            className={`px-4 py-2 rounded ${view === 'gamers' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setView('gamers')}
          >
            {t('find.gamers')}
          </button>
        </div>

        {view === 'teams' && (
          <div className="space-y-6">
            {teams.map(teamItem => (
              <div key={teamItem.id} className="border p-4 rounded shadow bg-white">
                <div className="flex justify-between items-center">
                  <div>
                    <Link href={`/team/${teamItem.id}`} className="text-lg font-semibold text-blue-600 hover:underline">
                      {teamItem.name}
                    </Link>
                    <div className="text-sm text-gray-600">
                      {(teamItem.members?.length || teamItem.memberIds?.length || 0)} {t('find.members')}
                    </div>
                  </div>
                  {teamItem.openForRequests && user && !user.teamId && (
                    <button
                      onClick={() => handleJoinRequest(teamItem)}
                      className="bg-green-600 text-white px-3 py-1 rounded"
                    >
                      {t('find.join_request')}
                    </button>
                  )}
                </div>

                {teamItem.members?.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {teamItem.members.map(member => (
                      <div key={member.id} className="border p-2 rounded text-sm text-center">
                        <Image src={member.avatar || '/default-avatar.png'} alt="avatar" width={40} height={40} className="rounded-full mx-auto" />
                        <Link href={`/profile/${member.id}`} className="text-blue-600 hover:underline">
                          {member.username}
                        </Link>
                        <p>{member.rank || 'Unranked'}</p>
                        <p>WR: {member.winRate || 'N/A'}%</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {view === 'gamers' && (
          <div className="space-y-4">
            {gamers.map(g => (
              <div key={g.id} className="border p-4 rounded shadow bg-white flex justify-between items-center">
                <div>
                  <Link href={`/profile/${g.id}`} className="font-medium text-blue-600 hover:underline">
                    {g.name || 'Unnamed User'}
                  </Link>
                  <p className="text-sm">{t('find.rank')}: {g.rank || 'Unranked'}</p>
                  <p className="text-sm">{t('find.win_rate')}: {g.winRate || 'N/A'}%</p>
                </div>
                {g.openForInvites && (
                  <button
                    disabled={!isCaptain}
                    onClick={() => handleSendInvite(g)}
                    className={`ml-4 px-4 py-2 rounded text-white text-sm ${
                      isCaptain ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {t('find.invite')}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
