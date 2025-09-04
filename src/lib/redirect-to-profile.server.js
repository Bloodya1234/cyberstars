import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminAuth, getDb } from '@/lib/firebase-admin';

export async function redirectIfReadyToProfile() {
  const session = cookies().get('session')?.value;
  if (!session) return;

  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifySessionCookie(session, true);

    const db = getDb();
    const snap = await db.collection('users').doc(decoded.uid).get();
    const u = snap.exists ? snap.data() : null;

    if (u?.discord?.id && u?.joinedDiscordServer === true) {
      redirect('/profile');
    }
  } catch {
    // нет валидной сессии — просто не редиректим
  }
}
