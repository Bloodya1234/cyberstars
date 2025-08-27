import { adminAuth, db } from './firebase-admin';
import { cookies } from 'next/headers';

export async function getAuthSession() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;

    if (!sessionCookie) {
      console.warn('❌ No session cookie found');
      return null;
    }

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    console.log('✅ Session verified. UID:', decoded.uid);

    // 🔍 Fetch user document from Firestore to get role
    const userSnap = await db.collection('users').doc(decoded.uid).get();
    const userData = userSnap.exists ? userSnap.data() : {};

    return {
      user: {
        uid: decoded.uid,
        steamId: decoded.uid, // ✅ as expected by your system
        email: decoded.email || null,
        name: decoded.name || null,
        avatar: decoded.avatar || null,
        role: userData.role || 'user', // 👈 fallback to "user"
      },
    };
  } catch (err) {
    console.error('❌ Failed to verify session cookie:', err.message || err);
    return null;
  }
}
