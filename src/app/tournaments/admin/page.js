'use client';

import { useEffect, useMemo, useState } from 'react';

function normalizeList(str) {
  return String(str || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
}

export default function AdminTournamentPage() {
  const [authUser, setAuthUser] = useState(null); // { uid, email, role, ... }
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // --- UI state ---
  const [activeTab, setActiveTab] = useState('tournaments');
  const [tournaments, setTournaments] = useState([]);
  const [error, setError] = useState('');

  // --- form state ---
  const [form, setForm] = useState({
    name: '',
    type: '1v1',
    bracket: 'Herald',
    maxSlots: 8,
    prize: '',
    rules: '',
  });

  // --- lobbies state ---
  const [lobbyTournaments, setLobbyTournaments] = useState([]);
  const [lobbyInputs, setLobbyInputs] = useState({});

  const adminEmails = useMemo(
    () => normalizeList(process.env.NEXT_PUBLIC_ADMIN_EMAILS),
    []
  );
  const adminUids = useMemo(
    () => normalizeList(process.env.NEXT_PUBLIC_ADMIN_UIDS),
    []
  );

  const isAdmin = useMemo(() => {
    if (!authUser) return false;

    const byRole = String(authUser.role || '').toLowerCase() === 'admin';

    const byEmail =
      !!authUser.email &&
      adminEmails.includes(String(authUser.email).toLowerCase());

    const byUid =
      !!authUser.uid &&
      adminUids.includes(String(authUser.uid).toLowerCase());

    return byRole || byEmail || byUid;
  }, [authUser, adminEmails, adminUids]);

  // 1) Узнаём пользователя
  useEffect(() => {
    (async () => {
      setLoading(true);
      setLoadError('');
      try {
        const res = await fetch('/api/user-info', {
          cache: 'no-store',
          credentials: 'include',
        });

        if (!res.ok) {
          let msg = `user-info HTTP ${res.status}`;
          try {
            const j = await res.json();
            if (j?.error || j?.message) msg += `: ${j.error || j.message}`;
          } catch {}
          setLoadError(msg);
          setAuthUser(null);
        } else {
          const data = await res.json();
          // ожидаем, что вернётся хотя бы { uid, email?, role? }
          setAuthUser(data || null);
        }
      } catch (e) {
        setLoadError(`user-info failed: ${e?.message || e}`);
        setAuthUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 2) Подгружаем турниры только для админа
  useEffect(() => {
    if (!isAdmin) return;

    (async () => {
      try {
        const res = await fetch('/api/tournaments', { cache: 'no-store' });
        const data = await res.json();
        setTournaments(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to load tournaments:', e);
      }
    })();
  }, [isAdmin]);

  // 3) Для вкладки Lobbies
  useEffect(() => {
    if (!isAdmin || activeTab !== 'lobbies') return;

    (async () => {
      try {
        const res = await fetch('/api/tournaments', { cache: 'no-store' });
        const data = await res.json();
        const ready = (Array.isArray(data) ? data : []).filter(
          t => Number(t.currentSlots || 0) === Number(t.maxSlots || 0) && !t.lobbyLink
        );
        setLobbyTournaments(ready);
      } catch (e) {
        console.error('Failed to load lobbies:', e);
      }
    })();
  }, [isAdmin, activeTab]);

  // --- handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'maxSlots' ? Number(value) : value,
    }));
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
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errDetails = Array.isArray(data?.details) ? data.details.join(', ') : '';
      setError(errDetails || data?.message || data?.error || 'Failed to create tournament');
      return;
    }

    // успех
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
    setError(`Unexpected error: ${err.message}`);
  }
};


  const handleDelete = async (id) => {
    if (!confirm('Delete this tournament?')) return;
    try {
      const res = await fetch(`/api/tournaments/delete?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.message || j?.error || 'Failed');

      setTournaments(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      alert(`Failed to delete: ${e.message}`);
    }
  };

  const handleLobbyChange = (id, field, value) => {
    setLobbyInputs(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value },
    }));
  };

  const generateLobbyInfo = (id) => {
    setLobbyInputs(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        name: `Match-${Math.floor(1000 + Math.random() * 9000)}`,
        password: Math.random().toString(36).slice(-6),
      },
    }));
  };

  const assignLobby = async (id) => {
    const { name: lobbyName, password: lobbyPassword, region } = lobbyInputs[id] || {};
    if (!lobbyName || !lobbyPassword) {
      alert('Lobby name and password are required');
      return;
    }

    try {
      const res = await fetch('/api/tournaments/assign-lobby-auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tournamentId: id, lobbyName, lobbyPassword, region }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.message || j?.error || 'Failed');

      alert('✅ Lobby assigned and players notified');
      setLobbyInputs(prev => ({ ...prev, [id]: { name: '', password: '', region: '' } }));
      setLobbyTournaments(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      alert(`❌ ${e.message}`);
    }
  };

  // --- RENDER ---
  if (loading) return <div className="p-6 text-white">Loading…</div>;

  if (!isAdmin) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-3xl font-bold mb-3">Access denied</h1>
        <p>You must be an admin to open this page.</p>
        {loadError && (
          <p className="mt-3 text-red-400 text-sm">user-info: {loadError}</p>
        )}
        {authUser && (
          <pre className="mt-3 text-xs opacity-80 bg-black/40 p-3 rounded">
            {JSON.stringify({ uid: authUser.uid, email: authUser.email, role: authUser.role }, null, 2)}
          </pre>
        )}
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
            <input name="name" placeholder="Tournament Name" value={form.name} onChange={handleChange}
                   className="w-full border px-4 py-2 rounded text-black" />
            <select name="type" value={form.type} onChange={handleChange}
                    className="w-full border px-4 py-2 rounded text-black">
              <option value="1v1">1v1</option>
              <option value="5v5">5v5</option>
              <option value="turbo">Turbo</option>
            </select>
            <select name="bracket" value={form.bracket} onChange={handleChange}
                    className="w-full border px-4 py-2 rounded text-black">
              <option value="Herald">Herald</option>
              <option value="Guardian-Crusader">Guardian-Crusader</option>
              <option value="Archon-Legend">Archon-Legend</option>
              <option value="Ancient-Divine">Ancient-Divine</option>
              <option value="Immortal">Immortal</option>
            </select>
            <input name="maxSlots" type="number" placeholder="Max Slots" value={form.maxSlots}
                   onChange={handleChange} className="w-full border px-4 py-2 rounded text-black" />
            <input name="prize" placeholder="Prize" value={form.prize} onChange={handleChange}
                   className="w-full border px-4 py-2 rounded text-black" />
            <textarea name="rules" placeholder="Tournament Rules (optional)" value={form.rules}
                      onChange={handleChange} className="w-full border px-4 py-2 rounded text-black" />

            {error && <p className="text-red-400">{error}</p>}

            <button type="submit" className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800">
              Create Tournament
            </button>
          </form>

          <h2 className="text-xl font-bold mb-4">Existing Tournaments</h2>
          {tournaments.length === 0 && <p className="text-gray-400">No tournaments yet.</p>}
          <ul className="space-y-4">
            {tournaments.map((t) => (
              <li key={t.id} className="border p-4 rounded bg-white text-black shadow flex justify-between items-center">
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm text-gray-600">
                    {t.type?.toUpperCase()} · {t.bracket} · {t.currentSlots}/{t.maxSlots} · Prize: {t.prize}
                  </p>
                  {t.rules && <p className="text-xs text-gray-500 mt-1">Rules: {t.rules}</p>}
                </div>
                <button onClick={() => handleDelete(t.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
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
                <li key={t.id} className="border p-4 rounded bg-white text-black shadow space-y-2">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-sm text-gray-700">
                    {t.type?.toUpperCase()} · {t.bracket} · {t.currentSlots}/{t.maxSlots}
                  </div>

                  <div className="flex gap-2 mb-2">
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
                    className="bg-gray-600 text-white px-3 py-1 rounded"
                  >
                    🎲 Generate Lobby Info
                  </button>

                  <button
                    onClick={() => assignLobby(t.id)}
                    className="ml-2 bg-blue-700 text-white px-4 py-1 rounded"
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