// src/app/api/tournaments/create/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';

function isAdminEmail(email) {
  const list = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(String(email || '').toLowerCase());
}

async function isAdminByUid(db, uid) {
  if (!uid) return false;
  try {
    const snap = await db.collection('users').doc(uid).get();
    if (!snap.exists) return false;
    const role = String(snap.data()?.role || '').toLowerCase();
    return role === 'admin';
  } catch {
    return false;
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));

    const requesterEmail = body?.requesterEmail;
    const requesterUid   = body?.requesterUid;

    const db = getDb();

    const okByEmail = isAdminEmail(requesterEmail);
    const okByRole  = await isAdminByUid(db, requesterUid);

    if (!okByEmail && !okByRole) {
      return NextResponse.json(
        { error: 'Only admin can create tournaments' },
        { status: 401 }
      );
    }

    const payload = {
      name: String(body?.name || '').trim(),
      type: String(body?.type || '1v1').trim(),
      bracket: String(body?.bracket || '').trim(),
      maxSlots: Number(body?.maxSlots || 0),
      prize: String(body?.prize ?? ''),
      rules: String(body?.rules ?? ''),
      currentSlots: 0,
      createdAt: new Date().toISOString(),
    };

    const errs = [];
    if (!payload.name) errs.push('name is required');
    if (!['1v1','5v5','turbo'].includes(payload.type)) errs.push('type must be 1v1 | 5v5 | turbo');
    if (!payload.bracket) errs.push('bracket is required');
    if (!Number.isFinite(payload.maxSlots) || payload.maxSlots <= 0) errs.push('maxSlots must be > 0');

    if (errs.length) {
      return NextResponse.json({ error: 'Invalid data', details: errs }, { status: 400 });
    }

    const ref = await db.collection('tournaments').add(payload);
    return NextResponse.json({ ok: true, id: ref.id }, { status: 201 });
  } catch (err) {
    console.error('create tournament failed:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', details: [String(err?.message || err)] },
      { status: 500 }
    );
  }
}
