export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getAuthSession?.();
    const uid = session?.user?.uid;
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const docId = uid.startsWith('steam:') ? uid : `steam:${uid}`;
    const snap = await db().collection('users').doc(docId).get();

    const user = snap.exists ? snap.data() : {};
    const discordId = user?.discord?.id;
    if (!discordId) return NextResponse.json({ isMember: false, reason: 'no_discord' });

    const botUrl = process.env.BOT_SERVER_URL?.replace(/\/+$/, '');
    if (!botUrl) return NextResponse.json({ isMember: false, reason: 'no_bot' });

    const res = await fetch(`${botUrl}/check-server-membership`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discordId }),
    });
    const data = await res.json().catch(() => ({}));
    const isMember = !!data.isMember;

    if (isMember) {
      await db().collection('users').doc(docId).set({ joinedDiscordServer: true }, { merge: true });
    }

    return NextResponse.json({ isMember });
  } catch (e) {
    console.error('/api/discord/check error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
