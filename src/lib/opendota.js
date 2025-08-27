// src/lib/opendota.js
export async function fetchOpenDotaStats(steamId32) {
  const profileRes = await fetch(`https://api.opendota.com/api/players/${steamId32}`);
  if (!profileRes.ok) throw new Error('OpenDota profile fetch failed');
  const profile = await profileRes.json();

  const wlRes = await fetch(`https://api.opendota.com/api/players/${steamId32}/wl`);
  if (!wlRes.ok) throw new Error('OpenDota WL fetch failed');
  const wl = await wlRes.json();
  const win = wl.win || 0;
  const lose = wl.lose || 0;
  const winRate = win + lose > 0 ? Math.round((win / (win + lose)) * 100) : null;

  const matchesRes = await fetch(`https://api.opendota.com/api/players/${steamId32}/matches?limit=20`);
  if (!matchesRes.ok) throw new Error('OpenDota matches fetch failed');
  const matches = await matchesRes.json();

  const rankTier = profile.rank_tier;
  let rank = '';
  if (rankTier) {
    const names = ['', 'Herald', 'Guardian', 'Crusader', 'Archon', 'Legend', 'Ancient', 'Divine', 'Immortal'];
    const main = Math.floor(rankTier / 10);
    const star = rankTier % 10;
    rank = names[main] ? (main < 8 ? `${names[main]} ${star}` : 'Immortal') : '';
  }

  const matchSummary = (Array.isArray(matches) ? matches : []).slice(0, 10).map((m) => {
    const isRadiant = m.player_slot < 128;
    const won = (m.radiant_win && isRadiant) || (!m.radiant_win && !isRadiant);
    return `${m.hero_id}|${won ? 'Win' : 'Loss'}`;
  });

  return { winRate, rankTier, rank, matches: matchSummary };
}
