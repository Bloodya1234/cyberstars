// src/app/connect-discord/page.js
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function ConnectDiscordPage() {
  const router = useRouter();

  const [uid, setUid] = useState(null);
  const [steamId64, setSteamId64] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [errorText, setErrorText] = useState('');

  // 1) Проверяем cookie-сессию на сервере
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErrorText('');

        const res = await fetch('/api/user-info', { credentials: 'include' });
        if (!res.ok) { setNeedsLogin(true); return; }
        const me = await res.json();
        if (!me?.uid || typeof me.uid !== 'string') { setNeedsLogin(true); return; }

        if (cancelled) return;

        setUid(me.uid);
        const id64 = me.uid.startsWith('steam:') ? me.uid.slice(6) : me.uid;
        setSteamId64(id64);

        // 2) Опциональный custom token — не критично
        try {
          const tokRes = await fetch('/api/steam/steam-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ steamId: id64 }),
          });
          if (tokRes.ok) {
            const { token: t } = await tokRes.json();
            if (!cancelled) setToken(t || null);
          }
        } catch {}
      } catch (e) {
        console.error('user-info failed:', e);
        if (!cancelled) setErrorText('Unexpected error. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // 3) Собираем все части OAuth-ссылки
  const { clientId, redirectUri, stateB64, oauthUrl } = useMemo(() => {
    const cid = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ?? '';
    const redir = typeof window !== 'undefined'
      ? `${window.location.origin}/api/discord/callback`
      : '';
    const stObj = steamId64 ? { steamId: `steam:${steamId64}`, ...(token ? { token } : {}) } : null;
    const st = stObj ? btoa(JSON.stringify(stObj)) : '';

    const url = (cid && redir && st)
      ? `https://discord.com/oauth2/authorize` +
        `?client_id=${encodeURIComponent(cid)}` +
        `&redirect_uri=${encodeURIComponent(redir)}` +
        `&response_type=code&scope=identify` +
        `&state=${encodeURIComponent(st)}`
      : '';

    return { clientId: cid, redirectUri: redir, stateB64: st, oauthUrl: url };
  }, [steamId64, token]);

  useEffect(() => {
    console.log('[DEBUG] clientId:', clientId);
    console.log('[DEBUG] redirectUri:', redirectUri);
    console.log('[DEBUG] state (b64):', stateB64);
    console.log('[DEBUG] oauthUrl:', oauthUrl);
  }, [clientId, redirectUri, stateB64, oauthUrl]);

  const handleConnectDiscord = useCallback(() => {
    if (needsLogin || !uid) {
      router.push('/login?next=/connect-discord');
      return;
    }
    if (!clientId) { setErrorText('NEXT_PUBLIC_DISCORD_CLIENT_ID is empty'); return; }
    if (!redirectUri) { setErrorText('redirectUri is empty'); return; }
    if (!oauthUrl)   { setErrorText('OAuth URL could not be constructed'); return; }

    try {
      window.location.assign(oauthUrl);
    } catch {
      window.location.href = oauthUrl;
    }
  }, [needsLogin, uid, clientId, redirectUri, oauthUrl, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 text-center">
      <h1 className="text-4xl font-extrabold mb-4">Connect your Discord</h1>
      <p className="text-lg opacity-80 mb-6">
        Connect your Discord account to receive invites to teams and tournaments.
      </p>

      {loading ? (
        <div className="opacity-80">Checking session…</div>
      ) : (
        <>
          {needsLogin && (
            <div className="text-yellow-400 mb-3">
              You&apos;ll be asked to login with Steam first.
            </div>
          )}
          {errorText && <div className="text-red-400 mb-3">{errorText}</div>}

          <button
            onClick={handleConnectDiscord}
            className="px-6 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Connect Discord
          </button>

          {/* Диагностическая панель */}
          <div className="mt-6 text-left text-sm opacity-80 max-w-xl w-full break-words">
            <div className="font-mono">
              <div><b>clientId:</b> {clientId || '— empty —'}</div>
              <div><b>redirectUri:</b> {redirectUri || '— empty —'}</div>
              <div><b>state (b64):</b> {stateB64 || '— empty —'}</div>
              <div className="mt-2">
                <b>OAuth URL:</b>{' '}
                {oauthUrl ? (
                  <a href={oauthUrl} className="underline text-cyan-400" target="_blank" rel="noreferrer">
                    open in new tab
                  </a>
                ) : (
                  '— not built —'
                )}
              </div>
            </div>
          </div>

          {uid && (
            <div className="mt-3 text-sm opacity-70">
              Signed in as <span className="font-mono">{uid}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
