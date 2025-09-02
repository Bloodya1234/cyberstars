// src/app/api/discord/check/route.js
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const discordId = searchParams.get('discordId');
  const uid = searchParams.get('uid');

  if (!discordId) {
    return NextResponse.json({ error: 'Missing discordId' }, { status: 400 });
  }

  const r = await fetch(`${process.env.BOT_SERVER_URL}/check-server-membership`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ discordId }),
    cache: 'no-store',
  });

  const data = await r.json();

  // если реально вступил — отметим это в users/{uid}
  if (data?.isMember && uid) {
    const db = getDb();
    await db.collection('users').doc(uid).set(
      { joinedDiscordServer: true },
      { merge: true }
    );
  }

  return NextResponse.json(data);
}
