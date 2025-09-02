// src/lib/firebase-admin.js
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let _db = null;

/** Ленивая инициализация Admin SDK. Не выполняется на билде/в браузере. */
export function getDb() {
  if (_db) return _db;

  // Защита от случайного импорта в браузере/Edge
  if (typeof window !== 'undefined') {
    throw new Error('Firebase Admin SDK must not run in the browser');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    throw new Error('Firebase Admin SDK is not supported on the Edge runtime');
  }

  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!raw) {
      // Бросаем ошибку только в рантайме (когда реально нужен доступ к БД)
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is missing at runtime');
    }
    const svc = JSON.parse(raw);
    initializeApp({ credential: cert(svc) });
  }

  _db = getFirestore();
  return _db;
}
