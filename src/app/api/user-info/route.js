// src/app/api/user-info/route.js
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { db } from '@/lib/firebase-admin';

export async function GET(req) {
  try {
    const cookie = req.cookies.get('session')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await getAuth().verifySessionCookie(cookie, true);
    const uid = decoded.uid;

    const snap = await db.collection('users').doc(uid).get();
    const data = snap.exists ? snap.data() : {};

    return NextResponse.json({
      uid,
      discord: data.discord || null,
      joinedDiscordServer: data.joinedDiscordServer || false,
    });
  } catch (err) {
    console.error('user-info failed:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
