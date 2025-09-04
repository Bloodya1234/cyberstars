// src/lib/auth.js
import { cookies } from 'next/headers';
import { getAdminAuth } from './firebase-admin';

/** Проверить session cookie; по умолчанию проверяем на отзыв (revoked). */
export async function verifySessionCookie(cookie, checkRevoked = true) {
  const auth = getAdminAuth();
  return auth.verifySessionCookie(cookie, checkRevoked);
}

/** Создать session cookie на заданный срок (в мс). */
export async function createSessionCookie(idToken, expiresInMs) {
  const auth = getAdminAuth();
  return auth.createSessionCookie(idToken, { expiresIn: expiresInMs });
}

/** Отозвать refresh-токены пользователя (инвалидация сессий). */
export async function revokeUserSessions(uid) {
  const auth = getAdminAuth();
  await auth.revokeRefreshTokens(uid);
}
export async function getAuthSession() {
  try {
    const session = cookies().get('session')?.value;
    if (!session) return null;
    const auth = getAdminAuth();
    const decoded = await auth.verifySessionCookie(session, true);
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}