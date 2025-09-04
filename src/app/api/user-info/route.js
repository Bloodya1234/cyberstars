// src/app/api/user-info/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getAdminAuth, getDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const ck = cookies();
    const sessionCookie =
      ck.get('__session')?.value ||
      ck.get('session')?.value ||
      '';

    let uid = null;

    // 1) Расшифруем Firebase session cookie, чтобы получить uid
    if (sessionCookie) {
      try {
        const auth = getAdminAuth();
        const decoded = await auth.verifySessionCookie(sessionCookie, true);
        uid = decoded?.uid || null; // ожидаем формата steam:7656...
      } catch {
        // нет валидной сессии — оставим uid = null
      }
    }

    const db = getDb();
    let userDoc = null;

    // 2) Основной документ пользователя по uid
    if (uid) {
      const snap = await db.collection('users').doc(uid).get();
      if (snap.exists) userDoc = { uid, ...snap.data() };
      else userDoc = { uid };
    }

    // 3) Определяем роль из трёх источников
    let role = 'user';

    // 3.1) Поле role в документе юзера
    if (userDoc?.role === 'admin') role = 'admin';

    // 3.2) ENV allowlist ADMIN_UIDS="steam:765...,steam:123..."
    if (uid && process.env.ADMIN_UIDS) {
      const allow = process.env.ADMIN_UIDS
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      if (allow.includes(uid)) role = 'admin';
    }

    // 3.3) Отдельная коллекция admins/{uid}
    if (uid) {
      const adminSnap = await db.collection('admins').doc(uid).get();
      if (adminSnap.exists) role = 'admin';
    }

    // (опционально) если у тебя есть кука после “админ-логина”
    if (ck.get('isAdmin')?.value === '1') role = 'admin';

    return NextResponse.json(
      {
        uid: userDoc?.uid || null,
        role,
        name: userDoc?.name || null,
        steamId64: userDoc?.steamId64 || null,
        discord: userDoc?.discord || null,
        joinedDiscordServer: userDoc?.joinedDiscordServer ?? false,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to read user info', details: String(e?.message || e) },
      { status: 500 }
    );
  }
}
