// src/app/api/_diag/firestore/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const db = getDb();
    const doc = await db.collection('tournaments').add({
      __diag: true,
      message: 'ping',
      at: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, wroteDocId: doc.id });
  } catch (err) {
    console.error('DIAG Firestore write failed:', err);
    return NextResponse.json(
      { ok: false, error: String(err && err.message || err) },
      { status: 500 }
    );
  }
}
