// src/app/api/tournaments/route.js
import { NextResponse } from 'next/server';
// было: import initAdminIfNeeded from '@/lib/firebase-admin' (⛔️ default)
// нужно:
import { initAdminIfNeeded, getFirestore } from '@/lib/firebase-admin';

// пример использования:
const db = getFirestore();
// или
initAdminIfNeeded();
// ... дальше работаешь через admin.firestore() или db


export async function GET() {
  try {
    initAdminIfNeeded();
    const db = getFirestore();
    const snap = await db.collection('tournaments').orderBy('createdAt', 'desc').get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error('GET /api/tournaments failed:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
