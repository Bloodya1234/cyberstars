// src/lib/redirect-to-profile.server.js
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminAuth, getDb } from '@/lib/firebase-admin';

/**
 * Если есть валидная session-cookie и в Firestore:
 *  - есть discord.id
 *  - joinedDiscordServer === true
 * -> делаем redirect('/profile')
 *
 * Иначе просто выходим (страница продолжит рендериться).
 */
export async function redirectIfReadyToProfile() {
  // cookies() делает страницу динамической — никакого пререндеринга
  const session = cookies().get('session')?.value;
  if (!session) return;

  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifySessionCookie(session, true); // checkRevoked = true

    const db = getDb();
    const snap = await db.collection('users').doc(decoded.uid).get();
    const u = snap.exists ? snap.data() : null;

    if (u?.discord?.id && u?.joinedDiscordServer === true) {
      redirect('/profile');
    }
  } catch {
    // нет валидной сессии/пользователя — просто не редиректим
  }
}
