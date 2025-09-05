// src/app/team/TeamClient.js
'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { app } from '@/firebase';
import ClientLayout from '@/components/ClientLayout';

const auth = getAuth(app);
const db = getFirestore(app);

// 5 фикс-слотов под участников
const MAX_SLOTS = 5;
const POSITIONS = ['Carry', 'Mid Lane', 'Offlane', 'Support', 'Hard Support'];

// утилита для пересчёта ранга (опционально)
function formatRank(tier) {
  if (!tier) return 'Unranked';
  const map = {
    11: 'Herald I', 12: 'Herald II', 13: 'Herald III', 14: 'Herald IV', 15: 'Herald V',
    21: 'Guardian I', 22: 'Guardian II', 23: 'Guardian III', 24: 'Guardian IV', 25: 'Guardian V',
    31: 'Crusader I', 32: 'Crusader II', 33: 'Crusader III', 34: 'Crusader IV', 35: 'Crusader V',
    41: 'Archon I', 42: 'Archon II', 43: 'Archon III', 44: 'Archon IV', 45: 'Archon V',
    51: 'Legend I', 52: 'Legend II', 53: 'Legend III', 54: 'Legend IV', 55: 'Legend V',
    61: 'Ancient I', 62: 'Ancient II', 63: 'Ancient III', 64: 'Ancient IV', 65: 'Ancient V',
    71: 'Divine I', 72: 'Divine II', 73: 'Divine III', 74: 'Divine IV', 75: 'Divine V',
    80: 'Immortal',
  };
  return map[tier] || 'Unranked';
}

export default function TeamClient() {
  const [me, setMe] = useState(null);              // firebase user
  const [userDoc, setUserDoc] = useState(null);    // firestore users/<uid>
  const [team, setTeam] = useState(null);          // firestore teams/<id>
  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState('');

  const isCaptain = useMemo(
    () => !!team && !!me && team.captainId === me.uid,
    [team, me]
  );

  // загрузка юзера + команды
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setMe(null);
        setUserDoc(null);
        setTeam(null);
        setLoading(false);
        return;
      }

      setMe(u);

      const uRef = doc(db, 'users', u.uid);
      const uSnap = await getDoc(uRef);
      if (!uSnap.exists()) {
        setUserDoc(null);
        setTeam(null);
        setLoading(false);
        return;
      }

      const uData = uSnap.data();
      setUserDoc({ id: u.uid, ...uData });

      if (uData.teamId) {
        const tRef = doc(db, 'teams', uData.teamId);
        const tSnap = await getDoc(tRef);
        if (tSnap.exists()) {
          setTeam({ id: tSnap.id, ...tSnap.data() });
        } else {
          // команда удалена — почистим user
          await updateDoc(uRef, { teamId: null, team: null });
          setTeam(null);
        }
      } else {
        setTeam(null);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  // создание команды
  const createTeam = async () => {
    if (!me || !userDoc) return;
    const name = teamName.trim();
    if (!name) return;

    // структура команды
    const teamId = crypto.randomUUID();
    const data = {
      name,
      logoUrl: '',
      captainId: me.uid,
      memberIds: [me.uid],
      members: [
        {
          id: me.uid,
          username: userDoc.name || 'Captain',
          avatar: userDoc.avatar || '',
          role: 'captain',
          position: '',
          // для красоты (если есть в users)
          rank: formatRank(userDoc.rankTier),
          winRate: userDoc.winRate ?? 'N/A',
        },
      ],
      openForRequests: true,
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'teams', teamId), data);
    await updateDoc(doc(db, 'users', me.uid), {
      teamId,
      team: { name, role: 'captain', position: '' },
    });

    setTeam({ id: teamId, ...data });
    setTeamName('');
  };

  // выход участника
  const leaveTeam = async () => {
    if (!me || !team) return;

    // капитан — не может "выйти", только расформировать
    if (isCaptain) return;

    const newMembers = (team.members || []).filter((m) => m.id !== me.uid);
    const newIds = (team.memberIds || []).filter((id) => id !== me.uid);

    await updateDoc(doc(db, 'teams', team.id), {
      members: newMembers,
      memberIds: newIds,
    });

    await updateDoc(doc(db, 'users', me.uid), {
      teamId: null,
      team: null,
    });

    setTeam({ ...team, members: newMembers, memberIds: newIds });
    setUserDoc({ ...userDoc, teamId: null, team: null });
  };

  // капитан — расформировать
  const disbandTeam = async () => {
    if (!isCaptain) return;
    const memberIds = team.memberIds || [];

    // обнулим у всех users ссылку на команду
    await Promise.all(
      memberIds.map((uid) =>
        updateDoc(doc(db, 'users', uid), { teamId: null, team: null }).catch(() => {})
      )
    );

    await deleteDoc(doc(db, 'teams', team.id));

    setTeam(null);
    setUserDoc((prev) => (prev ? { ...prev, teamId: null, team: null } : prev));
  };

  // смена позиции (капитан может всем, игрок — только себе)
  const updatePosition = async (memberId, pos) => {
    if (!team) return;
    const can =
      isCaptain || (me && memberId === me.uid);
    if (!can) return;

    const updated = (team.members || []).map((m) =>
      m.id === memberId ? { ...m, position: pos } : m
    );

    await updateDoc(doc(db, 'teams', team.id), { members: updated });
    setTeam((t) => (t ? { ...t, members: updated } : t));

    // если меняем себе — синхронизируем users/<uid>.team.position
    if (me && memberId === me.uid) {
      const next = { ...(userDoc?.team || {}), position: pos };
      await updateDoc(doc(db, 'users', me.uid), { team: next });
      setUserDoc((u) => (u ? { ...u, team: next } : u));
    }
  };

  if (loading) {
    return <div className="p-6 text-white">Loading…</div>;
  }

  return (
    <ClientLayout>
      <div className="max-w-5xl mx-auto p-6 text-white">
        {!team && (
          <>
            <h1 className="text-3xl font-bold mb-6">Create a Team</h1>
            <div className="flex gap-3 max-w-lg">
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Team name"
                className="flex-1 rounded bg-black/40 border border-cyan-500 px-3 py-2 outline-none"
              />
              <button
                onClick={createTeam}
                className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-700 font-semibold"
              >
                Create
              </button>
            </div>
          </>
        )}

        {team && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Image
                  src={team.logoUrl || '/default-logo.png'}
                  alt="Team Logo"
                  width={60}
                  height={60}
                  className="rounded"
                />
                <div>
                  <h1 className="text-3xl font-bold">{team.name}</h1>
                  {isCaptain ? (
                    <p className="text-cyan-400">You are the captain</p>
                  ) : (
                    <p className="text-gray-400">You are a team member</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isCaptain ? (
                  <button
                    onClick={disbandTeam}
                    className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 font-semibold"
                  >
                    Disband Team
                  </button>
                ) : (
                  <button
                    onClick={leaveTeam}
                    className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 font-semibold"
                  >
                    Leave Team
                  </button>
                )}
              </div>
            </div>

            {/* 5 слотов участников */}
            <h2 className="text-2xl font-semibold mb-4">Members</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: MAX_SLOTS }).map((_, idx) => {
                const m = team.members?.[idx];

                if (!m) {
                  return (
                    <div
                      key={idx}
                      className="border border-cyan-700/50 rounded p-4 h-[200px] flex items-center justify-center text-gray-500 italic bg-black/30"
                    >
                      Empty Slot
                    </div>
                  );
                }

                const self = me && m.id === me.uid;

                return (
                  <div
                    key={m.id}
                    className="border border-cyan-700/60 rounded p-4 bg-black/30"
                  >
                    <Image
                      src={m.avatar || '/default-avatar.png'}
                      alt="Avatar"
                      width={64}
                      height={64}
                      className="rounded-full mx-auto"
                    />
                    <p className="mt-2 text-center font-bold">{m.username || 'Unknown'}</p>
                    <p className="text-center text-sm text-gray-400">
                      {m.role === 'captain' ? '👑 Captain' : 'Member'}
                    </p>
                    <p className="text-center text-sm text-gray-300">
                      {m.rank || formatRank(m.rankTier)}
                    </p>
                    <p className="text-center text-sm">
                      WR: {typeof m.winRate === 'number' ? `${m.winRate}%` : (m.winRate || 'N/A')}
                    </p>

                    {/* позиция */}
                    <select
                      value={m.position || ''}
                      onChange={(e) => updatePosition(m.id, e.target.value)}
                      disabled={!(isCaptain || self)}
                      className="mt-2 w-full rounded bg-black/40 border border-cyan-700 px-2 py-1 text-sm outline-none disabled:opacity-50"
                    >
                      <option value="">Select Position</option>
                      {POSITIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>

                    {/* кик только у капитана и не самого себя */}
                    {isCaptain && !self && (
                      <button
                        onClick={async () => {
                          const newMembers = (team.members || []).filter(
                            (x) => x.id !== m.id
                          );
                          const newIds = (team.memberIds || []).filter(
                            (id) => id !== m.id
                          );
                          await updateDoc(doc(db, 'teams', team.id), {
                            members: newMembers,
                            memberIds: newIds,
                          });
                          await updateDoc(doc(db, 'users', m.id), {
                            teamId: null,
                            team: null,
                          });
                          setTeam((t) =>
                            t ? { ...t, members: newMembers, memberIds: newIds } : t
                          );
                        }}
                        className="mt-3 w-full text-red-500 hover:text-red-400 text-sm"
                      >
                        Kick
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </ClientLayout>
  );
}
