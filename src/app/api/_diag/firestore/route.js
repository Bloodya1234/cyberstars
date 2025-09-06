// src/app/api/_diag/firestore/route.js
import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { getAdminAuth } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const db = getFirestore();
    const doc = await db.collection('_diag').add({
      message: 'ping',
      at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, wroteDocId: doc.id });
  } catch (err) {
    console.error('DIAG Firestore write failed:', err);
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
