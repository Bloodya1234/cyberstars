// src/app/api/steam/return/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getDb, getAdminAuth } from '@/lib/firebase-admin';

// helper
function steam64To32(steam64) {
  try {
    return String(BigInt(steam64) - BigInt('76561197960265728'));
  } catch {
    return '';
  }
}

function extractSteamId64FromClaimedId(claimedId) {
  try {
    const parts = claimedId.split('/');
    return parts[parts.length - 1];
  } catch {
    return null;
  }
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const origin = url.origin;
    const sp = url.searchParams;

    // базовые проверки
    const mode = sp.get('openid.mode');
    const claimedId = sp.get('openid.claimed_id');
    if (mode !== 'id_res' || !claimedId) {
      return NextResponse.json({ error: 'Invalid OpenID response' }, { status: 400 });
    }

    // Вернём все openid.* и попросим check_authentication
    const verifyParams = new URLSearchParams();
    for (const [k, v] of sp.entries()) {
      if (k.startsWith('openid.')) verifyParams.append(k, v);
    }
    verifyParams.set('openid.mode', 'check_authentication');

    const verifyRes = await fetch('https://steamcommunity.com/openid/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: verifyParams.toString(),
    });
    const verifyText = await verifyRes.text();
    const isValid = verifyRes.ok && verifyText.includes('is_valid:true');
    if (!isValid) {
      console.error('Steam OpenID verify response:', verifyText);
      return NextResponse.json({ error: 'Steam login verification failed' }, { status: 400 });
    }

    // Извлекаем SteamID64
    const steamId64 = extractSteamId64FromClaimedId(claimedId);
    if (!steamId64) {
      return NextResponse.json({ error: 'Cannot extract steamId' }, { status: 400 });
    }

    const steamId32 = steam64To32(steamId64);
    const firebaseUID = `steam:${steamId64}`;

    // (Опционально) Подтягиваем профиль Steam
    let displayName = 'Steam User';
    let avatar = '';
    if (process.env.STEAM_API_KEY) {
      try {
        const steamApiUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&steamids=${steamId64}`;
        const res = await fetch(steamApiUrl);
        const data = await res.json();
        const player = data?.response?.players?.[0];
        if (player) {
          displayName = player.personaname || displayName;
          avatar = player.avatarfull || avatar;
        }
      } catch (e) {
        console.warn('Steam profile fetch failed:', e);
      }
    }

    // (Опционально) Топ-герои из OpenDota
    let topHeroes = [];
    try {
      const r = await fetch(`https://api.opendota.com/api/players/${steamId32}/heroes`);
      const j = await r.json();
      topHeroes = (Array.isArray(j) ? j : [])
        .sort((a, b) => b.games - a.games)
        .slice(0, 3)
        .map(h => h.hero_id);
    } catch {
      console.warn('OpenDota heroes fetch failed');
    }

    // Firestore
    const db = getDb();
    const inviteTeam = sp.get('inviteTeam') || '';
    const userRef = db.collection('users').doc(firebaseUID);
    const snap = await userRef.get();

    const baseUser = {
      steamId: firebaseUID,
      steamId64,
      steamId32,
      name: displayName,
      avatar,
      language: 'en',
      mmr: { solo: null, party: null },
      winRate: null,
      mostPlayedHeroes: topHeroes,
      matches: [],
      invites: inviteTeam
        ? { incoming: [inviteTeam], outgoing: [] }
        : { incoming: [], outgoing: [] },
      team: null,
      teamId: null,
      discord: {},
      openForInvites: true,
    };

    if (!snap.exists) {
      await userRef.set(baseUser);
    } else {
      await userRef.update({
        name: displayName,
        avatar,
        steamId64,
        steamId32,
        mostPlayedHeroes: topHeroes,
        ...(inviteTeam ? { invites: { incoming: [inviteTeam], outgoing: [] } } : {}),
      });
    }

    // Firebase custom token
    const auth = getAdminAuth();
    const customToken = await auth.createCustomToken(firebaseUID);

    // Редиректим на /steam-login c токеном + steamId (+inviteTeam)
    const redirectUrl = new URL('/steam-login', origin);
    redirectUrl.searchParams.set('token', customToken);
    redirectUrl.searchParams.set('steamId', steamId64);
    if (inviteTeam) redirectUrl.searchParams.set('inviteTeam', inviteTeam);

    return NextResponse.redirect(redirectUrl.toString(), { status: 302 });
  } catch (err) {
    console.error('Steam return handler error:', err);
    return NextResponse.json({ error: 'Internal error', details: String(err?.message || err) }, { status: 500 });
  }
}
