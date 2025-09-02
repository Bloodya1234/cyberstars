// src/lib/firebase-admin.js
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth as _getAuth } from 'firebase-admin/auth';

let _db = null;
let _auth = null;

/** Ленивая инициализация Firestore Admin */
export function getDb() {
  if (_db) return _db;

  if (typeof window !== 'undefined') throw new Error('Admin SDK in browser is forbidden');
  if (process.env.NEXT_RUNTIME === 'edge') throw new Error('Admin SDK is not supported on Edge runtime');

  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is missing at runtime');
    const svc = JSON.parse(raw);
    initializeApp({ credential: cert(svc) });
  }

  _db = getFirestore();
  return _db;
}

/** Ленивая инициализация Firebase Admin Auth */
export function getAdminAuth() {
  if (_auth) return _auth;

  if (typeof window !== 'undefined') throw new Error('Admin SDK in browser is forbidden');
  if (process.env.NEXT_RUNTIME === 'edge') throw new Error('Admin SDK is not supported on Edge runtime');

  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is missing at runtime');
    const svc = JSON.parse(raw);
    initializeApp({ credential: cert(svc) });
  }

  _auth = _getAuth();
  return _auth;
}
