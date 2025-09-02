// src/lib/firebase-admin.js
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    // или admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
  });
}

export const db = admin.firestore();

import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Инициализация Firebase Admin по требованию.
 * Никаких ошибок на этапе импорта — только при первом реальном вызове.
 */
function initAdminIfNeeded() {
  if (getApps().length) return;

  // 1) Пытаемся из BASE64 JSON (рекомендуется для Vercel/Render и т.п.)
  let creds;
  const b64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;
  if (b64) {
    try {
      const json = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
      creds = {
        projectId: json.project_id || process.env.FIREBASE_PROJECT_ID,
        clientEmail: json.client_email || process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: json.private_key,
      };
    } catch (e) {
      console.warn('⚠️ Invalid FIREBASE_PRIVATE_KEY_BASE64 (cannot JSON.parse)');
    }
  }

  // 2) Фолбэк: три обычные переменные (если вдруг используете их)
  if (!creds) {
    const pk = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && pk) {
      creds = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: pk,
      };
    }
  }

  // На сборке переменных может не быть — не падаем.
  if (!creds) {
    console.warn('⚠️ Firebase Admin creds are not available at build time. Will try again at runtime.');
    return;
  }

  initializeApp({ credential: cert(creds) });
}

/**
 * Возвращает Auth, гарантируя инициализацию.
 */
export function adminAuth() {
  initAdminIfNeeded();
  if (!getApps().length) throw new Error('Firebase Admin is not initialized: missing credentials');
  return getAuth();
}

/**
 * Возвращает Firestore, гарантируя инициализацию.
 */
export function db() {
  initAdminIfNeeded();
  if (!getApps().length) throw new Error('Firebase Admin is not initialized: missing credentials');
  return getFirestore();
}
