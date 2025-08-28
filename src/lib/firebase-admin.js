// src/lib/firebase-admin.js
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Мы ожидаем, что FIREBASE_PRIVATE_KEY_BASE64 — это base64 только от PEM-ключа,
// а projectId и clientEmail приходят отдельными переменными окружения.
const privateKeyB64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;
if (!privateKeyB64) {
  throw new Error('FIREBASE_PRIVATE_KEY_BASE64 is missing');
}
const privateKey = Buffer.from(privateKeyB64, 'base64').toString('utf8');

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey,
};

if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
  throw new Error('Firebase Admin credentials are incomplete (check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY_BASE64)');
}

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();
