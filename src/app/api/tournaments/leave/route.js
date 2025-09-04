// src/app/api/tournaments/leave/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth, getDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req) {
  try {
    // 1) auth по session cookie
    const session = cookies().get('session')?.value;
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const auth = getAdminAuth();
    const decoded = await auth.verifySessionCookie(session, true);
    const uid = decoded.uid; // вида 'steam:...'

    // 2) входные данные
    const { tournamentId } = await req.json();
    if (!tournamentId) {
      return NextResponse.json({ error: 'Missing tournamentId' }, { status: 400 });
    }

    const db = getDb();
    const tRef = db.collection('tournaments').doc(tournamentId);
    const snap = await tRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // 3) удаляем участника
    await tRef.update({
      participants: FieldValue.arrayRemove(uid),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('leave tournament error:', e);
    return NextResponse.json(
      { error: 'Internal error', message: String(e?.message || e) },
      { status: 500 }
    );
  }
}
