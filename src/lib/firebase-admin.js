// src/lib/firebase-admin.js
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Единое чтение ключа из base64
function getServiceAccountFromEnv() {
  const b64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;
  if (!b64) {
    throw new Error(
      'FIREBASE_PRIVATE_KEY_BASE64 is missing. Set it in Vercel Project → Settings → Environment Variables.'
    );
  }
  const json = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));

  // Страхуемся: если какие-то поля не пришли в JSON — добираем из обычных env
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
