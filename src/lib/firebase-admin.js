import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Decode the base64-encoded private key
const firebasePrivateKeyBase64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;

if (!firebasePrivateKeyBase64) {
  throw new Error('FIREBASE_PRIVATE_KEY_BASE64 is not set in the environment');
}

const firebasePrivateKey = Buffer.from(firebasePrivateKeyBase64, 'base64').toString('utf8');

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: firebasePrivateKey,
    }),
  });
}

const adminAuth = getAuth();
const db = getFirestore();

export { adminAuth, db };
