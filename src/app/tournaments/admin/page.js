'use client';

import { useEffect, useState } from 'react';
// ВВЕРХУ ФАЙЛА, рядом с импортами
async function jsonOrNull(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/** Хелпер: проверяем, является ли пользователь админом */
async function checkIsAdmin() {
  try {
    // 1) кто вошёл
    const uRes = await fetch('/api/user-info', {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!uRes.ok) return { allowed: false, user: null };
    const u = await uRes.json(); // { uid, email, ... }

    // 2) роль из Firestore
    const docRes = await fetch(`/api/users/${u.uid}`, { cache: 'no-store' });
    const doc = docRes.ok ? await docRes.json() : {};
    const role = String(doc?.role || '').toLowerCase();

    // 3) вайт-лист email из ENV (fallback)
    const emailWhitelist = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    const allowed =
      role === 'admin' ||
      (u.email && emailWhitelist.includes(String(u.email).toLowerCase()));

    return { allowed, user: u };
  } catch {
    return { allowed: false, user: null };
  }
}


export default function AdminTournamentPage() {
  const [authUser, setAuthUser] = useState(null);
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

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
  // shape: { [tournamentId]: { name: '', password: '', region: '' } }

  // Гейт администратора
  useEffect(() => {
    (async () => {
      const { allowed, user } = await checkIsAdmin();
      setAllowed(allowed);
      setAuthUser(allowed ? user : null);
      setLoading(false);
    })();
  }, []);

  // Загрузка турниров
  useEffect(() => {
    if (!allowed) return;
    const loadTournaments = async () => {
      try {
        const res = await fetch('/api/tournaments', { cache: 'no-store' });
        const data = await res.json();
        setTournaments(Array.isArray(data) ? data : []);
      } catch {
        setTournaments([]);
      }
    };
    loadTournaments();
  }, [allowed]);

  // Лобби (вкладка)
  useEffect(() => {
    if (!allowed || activeTab !== 'lobbies') return;
    const loadLobbies = async () => {
      try {
        const res = await fetch('/api/tournaments', { cache: 'no-store' });
        const data = await res.json();
        const ready = (Array.isArray(data) ? data : []).filter(
          t => Number(t.currentSlots) === Number(t.maxSlots) && !t.lobbyLink
        );
        setLobbyTournaments(ready);
      } catch {
        setLobbyTournaments([]);
      }
    };
    loadLobbies();
  }, [allowed, activeTab]);

  const handleLobbyChange = (id, field, value) => {
    setLobbyInputs(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const generateLobbyInfo = (tournamentId) => {
    const randomName = `Match-${Math.floor(1000 + Math.random() * 9000)}`;
    const randomPassword = Math.random().toString(36).slice(-6);
    setLobbyInputs(prev => ({
      ...prev,
      [tournamentId]: {
        ...prev[tournamentId],
        name: randomName,
        password: randomPassword,
      },
    }));
  };

  const assignLobby = async (id) => {
    const { name: lobbyName, password: lobbyPassword, region } = lobbyInputs[id] || {};
    if (!lobbyName || !lobbyPassword) {
      return alert('Lobby name and password are required');
    }

    try {
      const res = await fetch('/api/tournaments/assign-lobby-auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId: id, lobbyName, lobbyPassword, region }),
      });

      const result = await (async () => { try { return await res.json(); } catch { return {}; } })();

      if (res.ok) {
        alert('✅ Lobby assigned and players notified via Discord');
        setLobbyInputs(prev => ({ ...prev, [id]: { name: '', password: '', region: '' } }));
        setLobbyTournaments(prev => prev.filter(t => t.id !== id));
      } else {
        alert(`❌ Failed: ${result.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('❌ Network or server error:', err);
      alert('❌ Network or server error occurred.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'maxSlots' ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = { ...form, currentSlots: 0 };

    try {
      const res = await fetch('/api/tournaments/create', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        credentials: 'include',
      });

      const data = await (async () => { try { return await res.json(); } catch { return {}; } })();

      if (!res.ok) {
        const msg = data?.details?.join(', ') || data?.message || data?.error || 'Failed to create tournament';
        setError(msg);
        return;
      }

      // очистка формы и перезагрузка списка
      setForm({
        name: '',
        type: '1v1',
        bracket: 'Herald',
        maxSlots: 8,
        prize: '',
        rules: '',
      });

      const updated = await fetch('/api/tournaments', { cache: 'no-store' });
      setTournaments(await updated.json());
    } catch (err) {
      setError('Network error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this tournament?')) return;
    try {
      const res = await fetch(`/api/tournaments/delete?id=${id}`, { method: 'DELETE', cache: 'no-store' });
      if (res.ok) setTournaments(tournaments.filter(t => t.id !== id));
      else alert('Failed to delete tournament');
    } catch {
      alert('Network error');
    }
  };

  if (loading) {
    return <div className="p-6 text-white">Checking access…</div>;
  }

  if (!allowed) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="opacity-70 text-sm">You must be an admin to open this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 text-white">
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab('tournaments')}
          className={`px-4 py-2 rounded ${activeTab === 'tournaments' ? 'bg-blue-700 text-white' : 'bg-gray-200 text-black'}`}
        >
          Manage Tournaments
        </button>
        <button
          onClick={() => setActiveTab('lobbies')}
          className={`px-4 py-2 rounded ${activeTab === 'lobbies' ? 'bg-blue-700 text-white' : 'bg-gray-200 text-black'}`}
        >
          Manage Lobbies
        </button>
      </div>

      {activeTab === 'tournaments' && (
        <>
          <h1 className="text-2xl font-bold mb-6">Create New Tournament</h1>

          <form onSubmit={handleSubmit} className="space-y-4 mb-10">
            <input
              name="name"
              placeholder="Tournament Name"
              value={form.name}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded text-black"
              required
            />

            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded text-black"
            >
              <option value="1v1">1v1</option>
              <option value="5v5">5v5</option>
              <option value="turbo">Turbo</option>
            </select>

            <select
              name="bracket"
              value={form.bracket}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded text-black"
            >
              <option value="Herald">Herald</option>
              <option value="Guardian-Crusader">Guardian-Crusader</option>
              <option value="Archon-Legend">Archon-Legend</option>
              <option value="Ancient-Divine">Ancient-Divine</option>
              <option value="Immortal">Immortal</option>
            </select>

            <input
              name="maxSlots"
              type="number"
              min="1"
              placeholder="Max Slots"
              value={form.maxSlots}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded text-black"
            />

            <input
              name="prize"
              placeholder="Prize"
              value={form.prize}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded text-black"
            />

            <textarea
              name="rules"
              placeholder="Tournament Rules (optional)"
              value={form.rules}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded text-black"
              rows={3}
            />

            {error && <p className="text-red-400">{error}</p>}

            <button type="submit" className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800">
              Create Tournament
            </button>
          </form>

          <h2 className="text-xl font-bold mb-4">Existing Tournaments</h2>
          {tournaments.length === 0 && <p className="text-gray-400">No tournaments yet.</p>}
          <ul className="space-y-4">
            {tournaments.map((t) => (
              <li key={t.id} className="border border-gray-700 p-4 rounded bg-black/40 shadow flex justify-between items-center">
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm text-gray-300">
                    {t.type?.toUpperCase()} · {t.bracket} · {t.currentSlots}/{t.maxSlots} · Prize: {t.prize}
                  </p>
                  {t.rules && <p className="text-xs text-gray-400 mt-1">Rules: {t.rules}</p>}
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
                <li key={t.id} className="border border-gray-700 p-4 rounded bg-black/40 shadow space-y-2">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-sm text-gray-300">
                    {t.type?.toUpperCase()} · {t.bracket} · {t.currentSlots}/{t.maxSlots}
                  </div>

                  {Array.isArray(t.playerObjects) && (
                    <div className="text-sm text-gray-200 mt-2">
                      <p className="font-semibold mb-1">Registered Players:</p>
                      <ul className="list-disc list-inside">
                        {t.playerObjects.map((p, i) => (
                          <li key={i}>
                            {p.username || p.name || p.steamId} — <span className="text-blue-300">{p.steamId}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {Array.isArray(t.teamObjects) && (
                    <div className="text-sm text-gray-200 mt-2">
                      <p className="font-semibold mb-1">Registered Teams:</p>
                      {t.teamObjects.map((team, i) => (
                        <div key={i} className="mb-2">
                          <p className="font-semibold">Team {team.name || `#${i + 1}`}</p>
                          <ul className="list-disc list-inside ml-4">
                            {(team.players || []).map((p, j) => (
                              <li key={j}>
                                {p.username || p.name || p.steamId} — <span className="text-blue-300">{p.steamId}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      placeholder="Lobby name"
                      value={lobbyInputs[t.id]?.name || ''}
                      onChange={(e) => handleLobbyChange(t.id, 'name', e.target.value)}
                      className="w-1/3 border p-2 rounded text-black"
                    />
                    <input
                      type="text"
                      placeholder="Password"
                      value={lobbyInputs[t.id]?.password || ''}
                      onChange={(e) => handleLobbyChange(t.id, 'password', e.target.value)}
                      className="w-1/3 border p-2 rounded text-black"
                    />
                    <input
                      type="text"
                      placeholder="Server region (e.g. EU, NA)"
                      value={lobbyInputs[t.id]?.region || ''}
                      onChange={(e) => handleLobbyChange(t.id, 'region', e.target.value)}
                      className="w-1/3 border p-2 rounded text-black"
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
