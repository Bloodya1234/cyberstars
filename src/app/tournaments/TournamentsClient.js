// src/app/tournaments/TournamentsClient.js
'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';

export default function TournamentsClient() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinedTournaments, setJoinedTournaments] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState(null);

  // поля формы
  const [fName, setFName] = useState('');
  const [fType, setFType] = useState('1v1');
  const [fBracket, setFBracket] = useState('Herald');
  const [fMaxSlots, setFMaxSlots] = useState('8');
  const [fPrize, setFPrize] = useState('0');
  const [fRules, setFRules] = useState('');

  async function fetchUserAndTournaments() {
    try {
      const tourRes = await fetch('/api/tournaments', { cache: 'no-store' });
      const tourData = await tourRes.json();
      setTournaments(tourData);

      // узнаём юзера и его док
      const userRes = await fetch('/api/user-info', { credentials: 'include', cache: 'no-store' });
      const user = await userRes.json();
      const userDocRes = await fetch(`/api/users/${user.uid}`, { cache: 'no-store' });
      const userDoc = await userDocRes.json();

      // админ?
      const role = String(userDoc.role || '').toLowerCase();
      setIsAdmin(role === 'admin');

      // отмечаем где юзер уже состоит
      const joined = {};
      for (const t of tourData) {
        if (t.type === '1v1') {
          joined[t.id] = t.players?.includes(user.uid);
        } else if (['5v5', 'turbo'].includes(t.type)) {
          joined[t.id] = t.teams?.includes(userDoc.teamId);
        }
      }
      setJoinedTournaments(joined);
    } catch (err) {
      console.warn('⚠️ Could not load tournaments:', err?.message);
    } finally {
      setLoading(false);
    }
  }

  // alias для переиспользования
  const reloadTournaments = fetchUserAndTournaments;

  useEffect(() => {
    fetchUserAndTournaments();
  }, []);

  const handleJoin = async (tournamentId) => {
    try {
      const tournament = tournaments.find((t) => t.id === tournamentId);
      if (!tournament) throw new Error('Tournament not found');

      const userRes = await fetch('/api/user-info', { credentials: 'include', cache: 'no-store' });
      const user = await userRes.json();
      const userDocRes = await fetch(`/api/users/${user.uid}`, { cache: 'no-store' });
      const userDoc = await userDocRes.json();

      const errors = [];

      // ranked matches (ваша проверка)
      const matchCount = parseInt(userDoc.rankedMatchCount ?? userDoc.matchCount ?? 0, 10);
      if (matchCount < 200) {
        errors.push(`❌ You need at least 200 ranked matches. You have ${matchCount}.`);
      }

      const rankTier = parseInt(userDoc.rankTier ?? 0);
      const userRank = getRankFromTier(rankTier);
      const bracket = (tournament.bracket || '').toLowerCase();

      const bracketToRanks = {
        'herald only': ['herald'],
        'guardian only': ['guardian'],
        'archon-legend': ['archon', 'legend'],
        'ancient-divine': ['ancient', 'divine'],
        'immortal only': ['immortal'],
        'all ranks': ['herald','guardian','crusader','archon','legend','ancient','divine','immortal'],
      };

      const allowed = bracketToRanks[bracket] || [];
      if (!allowed.includes(userRank)) {
        errors.push(`❌ Your rank "${userRank}" is not allowed. This tournament is for: ${allowed.join(', ')}`);
      }

      if (errors.length > 0) {
        alert(`🚫 You are not eligible to join this tournament:\n\n${errors.join('\n')}`);
        return;
      }

      const res = await fetch('/api/tournaments/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId }),
        credentials: 'include',
      });

      const result = await res.json();
      if (!res.ok) {
        const reasonList = result.reasons?.length
          ? `\n\nDetails:\n• ${result.reasons.join('\n• ')}`
          : '';
        throw new Error(result.message + reasonList);
      }

      alert('✅ Successfully joined tournament');
      setJoinedTournaments((prev) => ({ ...prev, [tournamentId]: true }));
      window.open(`/tournaments/${tournamentId}`, '_blank');
    } catch (err) {
      alert(`❌ ${err.message}`);
    }
  };

  const getRankFromTier = (tier) => {
    if (!tier) return '';
    const base = Math.floor(tier / 10);
    return ['', 'herald','guardian','crusader','archon','legend','ancient','divine','immortal'][base] || '';
  };

  // ↓↓↓ НОВЫЕ ФУНКЦИИ ДЛЯ СОЗДАНИЯ ТУРНИРА ↓↓↓

  const handleCreate = async (e) => {
    e.preventDefault();
    const form = {
      title: fName,
      mode: fType,
      rank: fBracket,
      maxTeams: Number(fMaxSlots),
      prize: fPrize,     // можно строкой или числом — на сервере приводим к строке
      rules: fRules,
    };
    await createTournament(form);
  };

  async function createTournament(form) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tournaments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        cache: 'no-store',
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.details?.join(', ') || data?.message || data?.error || 'Failed');
      }

      alert('✅ Tournament created!');
      // очистим форму
      setFName('');
      setFType('1v1');
      setFBracket('Herald');
      setFMaxSlots('8');
      setFPrize('0');
      setFRules('');
      // обновим список
      await reloadTournaments();
    } catch (e) {
      setError(String(e.message || e));
      alert(`Failed to create tournament: ${String(e.message || e)}`);
    } finally {
      setLoading(false);
    }
  }

  // ↑↑↑ НОВЫЕ ФУНКЦИИ ДЛЯ СОЗДАНИЯ ТУРНИРА ↑↑↑

  if (loading) {
    return (
      <>
        <Header />
        <div className="p-6 text-white">Loading tournaments...</div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="p-6 text-white">
        <h1 className="text-2xl font-bold mb-4">Tournaments</h1>

        {isAdmin && (
          <form onSubmit={handleCreate} className="mb-8 grid gap-3 max-w-xl">
            <h2 className="text-xl font-semibold">Create New Tournament</h2>

            {error && (
              <div className="p-2 rounded bg-red-600/20 border border-red-600 text-red-300 text-sm">
                {error}
              </div>
            )}

            <input
              className="px-3 py-2 rounded bg-black/40 border border-gray-700"
              placeholder="Name"
              value={fName}
              onChange={(e) => setFName(e.target.value)}
              required
            />
            <select
              className="px-3 py-2 rounded bg-black/40 border border-gray-700"
              value={fType}
              onChange={(e) => setFType(e.target.value)}
            >
              <option value="1v1">1v1</option>
              <option value="5v5">5v5</option>
              <option value="turbo">Turbo</option>
            </select>
            <input
              className="px-3 py-2 rounded bg-black/40 border border-gray-700"
              placeholder="Bracket (e.g., Herald, Ancient-Divine, All Ranks)"
              value={fBracket}
              onChange={(e) => setFBracket(e.target.value)}
              required
            />
            <input
              className="px-3 py-2 rounded bg-black/40 border border-gray-700"
              type="number"
              min="1"
              placeholder="Max slots"
              value={fMaxSlots}
              onChange={(e) => setFMaxSlots(e.target.value)}
            />
            <input
              className="px-3 py-2 rounded bg-black/40 border border-gray-700"
              placeholder="Prize (number or text)"
              value={fPrize}
              onChange={(e) => setFPrize(e.target.value)}
            />
            <textarea
              className="px-3 py-2 rounded bg-black/40 border border-gray-700"
              rows={3}
              placeholder="Rules (optional)"
              value={fRules}
              onChange={(e) => setFRules(e.target.value)}
            />
            <button
              type="submit"
              className="self-start bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded text-white"
            >
              Create Tournament
            </button>
          </form>
        )}

        {tournaments.length === 0 ? (
          <p className="text-gray-400">No tournaments available at the moment.</p>
        ) : (
          <table className="min-w-full border border-gray-700 text-sm">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Type</th>
                <th className="p-2 border">Rank</th>
                <th className="p-2 border">Slots</th>
                <th className="p-2 border">Prize Pool</th>
                <th className="p-2 border">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white text-black">
              {tournaments.map((t) => (
                <tr key={t.id} className="text-center border-t border-gray-600">
                  <td className="p-2 border font-medium">
                    {joinedTournaments[t.id] ? (
                      <a
                        href={`/tournaments/${t.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline hover:text-blue-800"
                      >
                        {t.name || t.title}
                      </a>
                    ) : (
                      t.name || t.title
                    )}
                  </td>
                  <td className="p-2 border">{t.type || t.mode}</td>
                  <td className="p-2 border">{t.bracket || t.rank}</td>
                  <td className="p-2 border">
                    {(t.currentSlots ?? 0)}/{t.maxSlots}
                  </td>
                  <td className="p-2 border">
                    {/* prize может быть строкой — не добавляем лишний $ если он уже есть */}
                    {String(t.prize).match(/\$/) ? String(t.prize) : `${t.prize}$`}
                  </td>
                  <td className="p-2 border space-x-2">
                    <button
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white disabled:opacity-50"
                      onClick={() => handleJoin(t.id)}
                      disabled={joinedTournaments[t.id]}
                    >
                      {joinedTournaments[t.id] ? 'Joined' : 'Join'}
                    </button>
                    {joinedTournaments[t.id] && (
                      <button
                        className="bg-gray-700 hover:bg-gray-800 px-3 py-1 rounded text-white"
                        onClick={() => window.open(`/tournaments/${t.id}`, '_blank')}
                      >
                        View
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
