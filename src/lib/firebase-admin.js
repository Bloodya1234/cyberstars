// src/lib/firebase-admin.js
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getServiceAccountFromEnv() {
  const b64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;
  if (!b64) throw new Error('FIREBASE_PRIVATE_KEY_BASE64 is missing');

  // ВАЖНО: здесь ожидается base64 от ПОЛНОГО JSON сервис-аккаунта, а не от одного PEM-ключа
  const json = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));

  const privateKey = json.private_key;
  if (!privateKey || !privateKey.includes('BEGIN PRIVATE KEY')) {
    throw new Error('Decoded service account JSON does not contain a valid "private_key"');
  }

  return {
    projectId: json.project_id,
    clientEmail: json.client_email,
    privateKey, // PEM-ключ как есть (с переносами \n)
  };
}

if (!getApps().length) {
  const serviceAccount = getServiceAccountFromEnv();
  initializeApp({ credential: cert(serviceAccount) });
}

export const db = getFirestore();
export const adminAuth = () => getAuth();
export default { db, adminAuth };
