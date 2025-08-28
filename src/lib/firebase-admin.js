// src/lib/firebase-admin.js
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getServiceAccountFromEnv() {
  // В Vercel переменная — это base64 ВСЕГО JSON ключа.
  const b64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;
  if (!b64) throw new Error('FIREBASE_PRIVATE_KEY_BASE64 is missing');
  const json = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
  return {
    projectId: json.project_id || process.env.FIREBASE_PROJECT_ID,
    clientEmail: json.client_email || process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: json.private_key,
  };
}

if (!getApps().length) {
  const serviceAccount = getServiceAccountFromEnv();
  initializeApp({ credential: cert(serviceAccount) });
}

export const adminAuth = () => getAuth();
export const db = getFirestore();
