// src/lib/auth.js
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
