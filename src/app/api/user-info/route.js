// src/app/api/user-info/route.js
import { db } from '@/lib/firebase-admin';
import { getAuthSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1) Проверим, что env для AdminSDK действительно присутствуют
    const missing = [];
    if (!process.env.FIREBASE_PRIVATE_KEY_BASE64) missing.push('FIREBASE_PRIVATE_KEY_BASE64');
    if (!process.env.FIREBASE_PROJECT_ID)        missing.push('FIREBASE_PROJECT_ID');
    if (!process.env.FIREBASE_CLIENT_EMAIL)      missing.push('FIREBASE_CLIENT_EMAIL');
    if (missing.length) {
      console.error('[user-info] Missing env:', missing.join(', '));
      return new Response('Server misconfigured', { status: 500 });
    }

    // 2) Серверная сессия
    let session;
    try {
      session = await getAuthSession();
    } catch (e) {
      console.error('[user-info] getAuthSession threw:', e?.message || e);
      return new Response('Unauthorized', { status: 401 });
    }

    const uid = session?.user?.uid;
    if (!uid) {
      console.warn('[user-info] No uid in session');
      return new Response('Unauthorized', { status: 401 });
    }

    // 3) Читаем Firestore (ВАЖНО: db — это функция!)
    const ref = db().collection('users').doc(uid);
    const snap = await ref.get();

    if (!snap.exists) {
      console.warn('[user-info] User doc not found for UID:', uid);
      return new Response('User not found', { status: 404 });
    }

    const user = snap.data() || {};
    const role = user.role || 'user';

    // Можно вернуть что-то ещё, но uid/role хватает
    return new Response(JSON.stringify({ uid, role }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[user-info] Fatal:', err?.stack || err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
