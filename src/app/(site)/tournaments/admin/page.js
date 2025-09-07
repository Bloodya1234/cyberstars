// src/app/tournaments/admin/page.js
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import { app } from '@/firebase';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

const ADMIN_UIDS = (process.env.NEXT_PUBLIC_ADMIN_UIDS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

/** Унифицированный helper для fetch с Bearer токеном */
async function authedFetch(url, options = {}) {
  const auth = getAuth(app);
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;

  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', headers.get('Content-Type') || 'application/json');

  return fetch(url, { ...options, headers, credentials: 'include', cache: 'no-store' });
}

export default function AdminTournamentPage() {
  const [authUser, setAuthUser] = useState(null);     // данные из /api/user-info
  const [loading, setLoading] = useState(true);
  const [debug, setDebug] = useState(null);

  const [form, setForm] = useState({
    name: '',
    type: '1v1',
    bracket: 'Herald',
    maxSlots: 8,
    prize: '',
    rules: '',
  });

  const [tournaments, setTournaments] = useState([]);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('tournaments');

  // --- Lobbies state ---
  const [lobbyTournaments, setLobbyTournaments] = useState([]);
  const [lobbyInputs, setLobbyInputs] = useState({});

  // Определяем, админ ли пользователь
  const isAdmin = useMemo(() => {
    if (!authUser) return false;
    if (String(authUser.role || '').toLowerCase() === 'admin') return true;

    const emailOk =
      authUser.email && ADMIN_EMAILS.includes(String(authUser.email).toLowerCase());
    const uidOk = authUser.uid && ADMIN_UIDS.includes(String(authUser.uid));
    return emailOk || uidOk;
  }, [authUser]);

  // Загружаем инфо о пользователе
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/user-info', { cache: 'no-store', credentials: 'include' });
        const data = await res.json();
        if (!mounted) return;
        setAuthUser(data);
        setDebug({ userInfo: data, envEmails: ADMIN_EMAILS, envUids: ADMIN_UIDS });
      } catch (e) {
        if (!mounted) return;
        setDebug({ errorUserInfo: String(e?.message || e) });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  // Загрузка турниров
  const loadTournaments = useCallback(async () => {
    try {
      const res = await authedFetch('/api/tournaments');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load tournaments');
      setTournaments(data);
    } catch (e) {
      setError(String(e.message || e));
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    loadTournaments();
  }, [isAdmin, loadTournaments]);

  // Для вкладки лобби — берём турики без lobbyLink и с полными слотами
  useEffect(() => {
    if (!isAdmin || activeTab !== 'lobbies') return;
    (async () => {
      try {
        const res = await authedFetch('/api/tournaments');
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load tournaments');
        const ready = (data || []).filter(
          (t) => Number(t.currentSlots || 0) === Number(t.maxSlots || 0) && !t.lobbyLink
        );
        setLobbyTournaments(ready);
      } catch (e) {
        setError(String(e.message || e));
      }
    })();
  }, [isAdmin, activeTab]);

  const handleLobbyChange = (id, field, value) => {
    setLobbyInputs((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: value } }));
  };

  const generateLobbyInfo = (tournamentId) => {
    const randomName = `Match-${Math.floor(1000 + Math.random() * 9000)}`;
    const randomPassword = Math.random().toString(36).slice(-6);
    setLobbyInputs((prev) => ({
      ...prev,
      [tournamentId]: { ...(prev[tournamentId] || {}), name: randomName, password: randomPassword },
    }));
  };

  const assignLobby = async (id) => {
    const { name: lobbyName, password: lobbyPassword, region } = lobbyInputs[id] || {};
    if (!lobbyName || !lobbyPassword) {
      return alert('Lobby name and password are required');
    }
    try {
      const res = await authedFetch('/api/tournaments/assign-lobby-auto', {
        method: 'POST',
        body: JSON.stringify({ tournamentId: id, lobbyName, lobbyPassword, region }),
      });
      const result = await (async () => { try { return await res.json(); } catch { return {}; } })();
      if (!res.ok) throw new Error(result?.message || 'Failed to assign lobby');

      alert('✅ Lobby assigned and players notified via Discord');
      setLobbyInputs((p) => ({ ...p, [id]: { name: '', password: '', region: '' } }));
      setLobbyTournaments((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('❌ assignLobby error:', err);
      alert(`❌ ${err.message}`);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'maxSlots' ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isAdmin) {
      setError('Only admin can create tournaments');
      return;
    }

    const payload = { ...form, currentSlots: 0 };
    try {
      const res = await authedFetch('/api/tournaments/create', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await (async () => { try { return await res.json(); } catch { return {}; } })();
      if (!res.ok) throw new Error(data?.message || data?.error || 'Failed to create tournament');

      // успех
      setForm({ name: '', type: '1v1', bracket: 'Herald', maxSlots: 8, prize: '', rules: '' });
      await loadTournaments();
    } catch (err) {
      setError(String(err.message || err));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this tournament?')) return;
    try {
      const res = await authedFetch(`/api/tournaments/delete?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await (async () => { try { return await res.json(); } catch { return {}; } })();
      if (!res.ok) throw new Error(data?.message || data?.error || 'Failed to delete');
      setTournaments((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      alert(String(e.message || e));
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!isAdmin) {
    return (
      <div className="p-6 text-red-500">
        <h1 className="text-3xl font-bold mb-2">Access denied</h1>
        <p className="opacity-80">You must be an admin to open this page.</p>
        <pre className="mt-4 text-xs bg-black/40 p-3 rounded text-white/80 overflow-auto">
          {JSON.stringify(debug, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10">
      {/* Debug блок — можно убрать позже */}
      <details className="mb-6 text-sm opacity-80">
        <summary className="cursor-pointer">debug</summary>
        <pre className="mt-2 p-3 bg-black/40 rounded overflow-auto">
          {JSON.stringify(debug, null, 2)}
        </pre>
      </details>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab('tournaments')}
          className={`px-4 py-2 rounded ${activeTab === 'tournaments' ? 'bg-blue-700 text-white' : 'bg-gray-200'}`}
        >
          Manage Tournaments
        </button>
        <button
          onClick={() => setActiveTab('lobbies')}
          className={`px-4 py-2 rounded ${activeTab === 'lobbies' ? 'bg-blue-700 text-white' : 'bg-gray-200'}`}
        >
          Manage Lobbies
        </button>
      </div>

      {activeTab === 'tournaments' && (
        <>
          <h1 className="text-2xl font-bold mb-6">Create New Tournament</h1>

          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <input
              name="name"
              placeholder="Tournament Name"
              value={form.name}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded"
              required
            />
            <select name="type" value={form.type} onChange={handleChange} className="w-full border px-4 py-2 rounded">
              <option value="1v1">1v1</option>
              <option value="5v5">5v5</option>
              <option value="turbo">Turbo</option>
            </select>
            <select name="bracket" value={form.bracket} onChange={handleChange} className="w-full border px-4 py-2 rounded">
              <option value="Herald">Herald</option>
              <option value="Guardian-Crusader">Guardian-Crusader</option>
              <option value="Archon-Legend">Archon-Legend</option>
              <option value="Ancient-Divine">Ancient-Divine</option>
              <option value="Immortal">Immortal</option>
            </select>
            <input
              name="maxSlots"
              type="number"
              min={2}
              placeholder="Max Slots"
              value={form.maxSlots}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded"
              required
            />
            <input
              name="prize"
              placeholder="Prize"
              value={form.prize}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded"
            />
            <textarea
              name="rules"
              placeholder="Tournament Rules (optional)"
              value={form.rules}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded"
            />

            {error && <p className="text-red-500">{error}</p>}

            <button type="submit" className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800">
              Create Tournament
            </button>
          </form>

          <h2 className="text-xl font-bold mb-4">Existing Tournaments</h2>
          {tournaments.length === 0 ? (
            <p className="text-gray-400">No tournaments yet.</p>
          ) : (
            <ul className="space-y-4">
              {tournaments.map((t) => (
                <li key={t.id} className="border p-4 rounded bg-white shadow flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-sm text-gray-600">
                      {t.type.toUpperCase()} · {t.bracket} · {t.currentSlots}/{t.maxSlots} · Prize: {t.prize}
                    </p>
                    {t.rules && <p className="text-xs text-gray-500 mt-1">Rules: {t.rules}</p>}
                  </div>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {activeTab === 'lobbies' && (
        <div>
          <h2 className="text-xl font-bold mb-4">Tournaments Ready for Lobby</h2>
          {lobbyTournaments.length === 0 ? (
            <p className="text-gray-400">No tournaments are ready yet.</p>
          ) : (
            <ul className="space-y-4">
              {lobbyTournaments.map((t) => (
                <li key={t.id} className="border p-4 rounded bg-white shadow space-y-2">
                  <div className="text-black font-semibold">{t.name}</div>
                  <div className="text-sm text-gray-600">
                    {t.type.toUpperCase()} · {t.bracket} · {t.currentSlots}/{t.maxSlots}
                  </div>

                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      placeholder="Lobby name"
                      value={lobbyInputs[t.id]?.name || ''}
                      onChange={(e) => handleLobbyChange(t.id, 'name', e.target.value)}
                      className="w-1/3 border p-2 rounded"
                    />
                    <input
                      type="text"
                      placeholder="Password"
                      value={lobbyInputs[t.id]?.password || ''}
                      onChange={(e) => handleLobbyChange(t.id, 'password', e.target.value)}
                      className="w-1/3 border p-2 rounded"
                    />
                    <input
                      type="text"
                      placeholder="Server region (e.g. EU, NA)"
                      value={lobbyInputs[t.id]?.region || ''}
                      onChange={(e) => handleLobbyChange(t.id, 'region', e.target.value)}
                      className="w-1/3 border p-2 rounded"
                    />
                  </div>

                  <button
                    onClick={() => generateLobbyInfo(t.id)}
                    className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                  >
                    🎲 Generate Lobby Info
                  </button>

                  <button
                    onClick={() => assignLobby(t.id)}
                    className="ml-2 bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
                  >
                    Assign Lobby & Notify
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
