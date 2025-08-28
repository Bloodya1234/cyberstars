// src/lib/auth.js
import { cookies } from 'next/headers';
import { adminAuth } from './firebase-admin';

/**
 * Возвращает { user: { uid } } если сессия валидна, иначе null.
 * Проверяется именно session cookie, которую мы ставим в /api/sessionLogin.
 */
export async function getAuthSession() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    if (!sessionCookie) {
      // Нет куки — нет сессии
      return null;
    }

    // "checkRevoked: true" — опционально, но полезно.
    const decoded = await adminAuth().verifySessionCookie(sessionCookie, true);

    // decoded.uid = наш UID вида "steam:7656..."
    return { user: { uid: decoded.uid } };
  } catch (err) {
    console.error('getAuthSession() verifySessionCookie error:', err);
    return null;
  }
}
