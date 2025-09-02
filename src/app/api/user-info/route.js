// src/app/api/user-info/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getAdminAuth, getDb } from '@/lib/firebase-admin';

export async function GET(req) {
  try {
    const cookie = req.cookies.get('session')?.value;
    if (!cookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const auth = getAdminAuth();
    const decoded = await auth.verifySessionCookie(cookie, true);
    const uid = decoded.uid;

    const db = getDb();
    const snap = await db.collection('users').doc(uid).get();
    const data = snap.exists ? snap.data() : {};

    return NextResponse.json({
      uid,
      discord: data.discord || null,
      joinedDiscordServer: data.joinedDiscordServer || false,
    });
  } catch (e) {
    console.error('user-info error', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
