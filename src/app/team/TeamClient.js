// src/app/team/TeamClient.js
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ClientLayout from '@/components/ClientLayout';

import { app } from '@/firebase';
import {
  getAuth,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

const auth = getAuth(app);
const db = getFirestore(app);

export default function TeamClient() {
  const router = useRouter();

  const [me, setMe] = useState(null);            // Firebase user
  const [meDoc, setMeDoc] = useState(null);      // Firestore user doc
  const [team, setTeam] = useState(null);        // team data (if exists)
  const [members, setMembers] = useState([]);    // resolved members
  const [loading, setLoading] = useState(true);

  const [teamName, setTeamName] = useState('');
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ---- load current user + his Firestore doc
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setMe(u || null);
      if (!u) {
        setLoading(false);
        return;
      }
      try {
        const uref = doc(db, 'users', u.uid);
        const usnap = await getDoc(uref);
        const udata = usnap.exists() ? usnap.data() : null;
        setMeDoc(udata || {});
      } catch (e) {
        console.error('Failed to load user doc:', e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // ---- when meDoc loaded → if there is teamId, load team + members
  useEffect(() => {
    if (!me || !meDoc?.teamId) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const tref = doc(db, 'teams', meDoc.teamId);
        const tsnap = await getDoc(tref);
        if (!tsnap.exists()) {
          setTeam(null);
          setMembers([]);
          return;
        }
        const tdata = { id: tsnap.id, ...tsnap.data() };
        if (!cancelled) setTeam(tdata);

        // Resolve members via your API /api/users/[uid]
        const ids = Array.isArray(tdata.memberIds) ? tdata.memberIds : [];
        const resolved = await Promise.all(
          ids.map(async (uid) => {
            try {
              const r = await fetch(`/api/users/${uid}`, { cache: 'no-store' });
              if (!r.ok) throw new Error('User API failed');
              const j = await r.json();
              return {
                id: uid,
                name: j.name || 'Unknown',
                avatar: j.avatar || '/default-avatar.png',
                rankTier: j.rankTier || null,
                winRate: j.winRate ?? null,
              };
            } catch {
              return {
                id: uid,
                name: 'Unknown',
                avatar: '/default-avatar.png',
                rankTier: null,
                winRate: null,
              };
            }
          })
        );
        if (!cancelled) setMembers(resolved);
      } catch (e) {
        console.error('Failed to load team:', e);
        if (!cancelled) {
          setTeam(null);
          setMembers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [me, meDoc?.teamId]);

  const isCaptain = useMemo(() => {
    return !!(me && team && team.captainId === me.uid);
  }, [me, team]);

  // ---- create team
  const onCreateTeam = useCallback(async () => {
    setErrorMsg('');
    if (!me) {
      setErrorMsg('Please log in first.');
      return;
    }
    const name = teamName.trim();
    if (!name) {
      setErrorMsg('Enter team name.');
      return;
    }
    if (meDoc?.teamId) {
      setErrorMsg('You are already in a team.');
      return;
    }

    try {
      setCreating(true);

      // Create team doc with auto ID
      const teamId = crypto.randomUUID();
      const teamRef = doc(db, 'teams', teamId);
      await setDoc(teamRef, {
        name,
        captainId: me.uid,
        memberIds: [me.uid],
        createdAt: serverTimestamp(),
        logoUrl: null,
      });

      // Update user -> attach teamId
      const userRef = doc(db, 'users', me.uid);
      await updateDoc(userRef, {
        teamId,
        team: {
          id: teamId,
          name,
          role: 'captain',
        },
      });

      // soft redirect to refresh UI
      router.replace('/team');
    } catch (e) {
      console.error('Create team failed:', e);
      setErrorMsg(e?.message || 'Create team failed');
    } finally {
      setCreating(false);
    }
  }, [me, meDoc?.teamId, teamName, router]);

  // ---- UI
  if (loading) {
    return (
      <ClientLayout>
        <div className="p-6">Loading…</div>
      </ClientLayout>
    );
  }

  if (!me) {
    return (
      <ClientLayout>
        <div className="p-6 text-red-400">Please log in to manage your team.</div>
      </ClientLayout>
    );
  }

  // If user already has a team → show team card
  if (team) {
    return (
      <ClientLayout>
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Image
              src={team.logoUrl || '/default-logo.png'}
              width={64}
              height={64}
              alt="Team Logo"
              className="rounded"
            />
            <div>
              <h1 className="text-2xl font-bold">{team.name}</h1>
              <p className="text-sm text-gray-400">
                {isCaptain ? 'You are the captain' : 'Member'}
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">Members</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {members.map((m) => (
                <div key={m.id} className="border border-white/10 rounded-lg p-4 bg-white/5">
                  <div className="flex items-center gap-3">
                    <Image
                      src={m.avatar}
                      width={44}
                      height={44}
                      alt="Avatar"
                      className="rounded-full"
                    />
                    <div>
                      <div className="font-semibold">{m.name}</div>
                      <div className="text-xs text-gray-400">
                        {formatRank(m.rankTier) || 'Unranked'}{m.winRate != null ? ` • WR ${m.winRate}%` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Можешь добавить кнопки управления, если уже были */}
          {/* {isCaptain && (<button className="glow-button glow-orange">Invite player</button>)} */}
        </div>
      </ClientLayout>
    );
  }

  // No team → creation form
  return (
    <ClientLayout>
      <div className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Create your team</h1>

        <div className="space-y-4">
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Team name"
            className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 outline-none"
          />
          {errorMsg && (
            <div className="text-red-400 text-sm">{errorMsg}</div>
          )}
          <button
            onClick={onCreateTeam}
            disabled={creating}
            className="glow-button glow-green px-5 py-2 disabled:opacity-60"
          >
            {creating ? 'Creating…' : 'Create Team'}
          </button>
        </div>
      </div>
    </ClientLayout>
  );
}

// ---- helpers
function formatRank(tier) {
  if (!tier) return '';
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
  return map[tier] || '';
}
