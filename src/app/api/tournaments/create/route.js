// src/app/api/tournaments/create/route.js
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initAdminIfNeeded } from '@/lib/firebase-admin';

function isAdminByEnv(uid, email) {
  const allowUids = (process.env.ADMIN_UIDS || '').split(',').map(s => s.trim()).filter(Boolean);
  const allowEmails = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (uid && allowUids.includes(uid)) return true;
  if (email && allowEmails.includes(email.toLowerCase())) return true;
  return false;
}

export async function POST(req) {
  try {
    initAdminIfNeeded();
    const db = getFirestore();

    // берём пользователя из куки (как у тебя делает /api/user-info)
    // если у тебя другой способ – подставь сюда свою функцию
    const cookieStore = cookies();
    const uid = cookieStore.get('uid')?.value || cookieStore.get('session_uid')?.value || null;
    const email = cookieStore.get('email')?.value || null;

    // доп. проверка через env (чтобы не падать, даже если user-info не подключен)
    const allowPreview = process.env.ALLOW_CREATE_TOURNAMENTS_IN_PREVIEW === '1';
    const adminOk = allowPreview || isAdminByEnv(uid, email);
    if (!adminOk) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const errors = [];

    const title = String(body.title || body.name || '').trim();
    const mode = String(body.mode || body.type || '').trim();
    const rank = String(body.rank || body.bracket || '').trim();
    const maxTeams = Number(body.maxTeams ?? body.maxSlots ?? 0);
    const prize = body.prize ?? 0;
    const rules = String(body.rules || '').trim();

    if (!title) errors.push('title is required');
    if (!mode) errors.push('mode is required');
    if (!rank) errors.push('rank is required');
    if (!Number.isFinite(maxTeams) || maxTeams < 1) errors.push('maxTeams must be a positive number');

    if (errors.length) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // нормализуем поля
    const doc = {
      name: title,
      type: mode,
      bracket: rank,
      maxSlots: maxTeams,
      currentSlots: 0,
      prize: typeof prize === 'number' ? prize : String(prize),
      rules,
      createdAt: FieldValue.serverTimestamp(),
      // структуры под разные режимы
      players: mode === '1v1' ? [] : undefined,
      teams: mode !== '1v1' ? [] : undefined,
    };

    const ref = await db.collection('tournaments').add(doc);
    return NextResponse.json({ ok: true, id: ref.id }, { status: 200 });
  } catch (err) {
    console.error('POST /api/tournaments/create failed:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
