// src/app/api/discord/check/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin'; // Admin SDK

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const discordId = searchParams.get('discordId');
  const uid = searchParams.get('uid');

  if (!discordId) {
    return NextResponse.json({ error: 'Missing discordId' }, { status: 400 });
  }

  try {
    const resp = await fetch(`${process.env.BOT_SERVER_URL}/check-server-membership`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discordId }),
      cache: 'no-store',
    });

    const data = await resp.json();

    // Если юзер реально вступил — сохраним отметку
    if (data?.isMember && uid) {
      await db.collection('users').doc(uid).set(
        { joinedDiscordServer: true },
        { merge: true }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('discord/check failed:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
