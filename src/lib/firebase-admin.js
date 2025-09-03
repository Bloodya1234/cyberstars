// src/lib/firebase-admin.js
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth as _getAuth } from 'firebase-admin/auth';

let _db = null;
let _auth = null;

function ensureServerNode() {
  if (typeof window !== 'undefined') throw new Error('Admin SDK must not run in the browser');
  if (process.env.NEXT_RUNTIME === 'edge') throw new Error('Admin SDK is not supported on the Edge runtime');
}

function loadPrivateKey() {
  // 1) Предпочитаем BASE64-вариант
  const b64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;
  if (b64) {
    // декод + базовая нормализация перевода строк
    const decoded = Buffer.from(b64, 'base64').toString('utf8').replace(/\r/g, '').trim();

    // если вдруг в decoded оказались литеральные '\n' (редко, но бывает) — заменим их на реальные переводы
    const maybeFixed = decoded.includes('\\n') ? decoded.replace(/\\n/g, '\n') : decoded;

    if (maybeFixed.includes('BEGIN PRIVATE KEY') && maybeFixed.includes('END PRIVATE KEY')) {
      return maybeFixed;
    }
    // если содержимое не похоже на PEM — пусть упадёт дальше на fallback
  }

  // 2) Fallback: обычная переменная с экранированными \n
  const pkRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (pkRaw) {
    return pkRaw.replace(/\\n/g, '\n').replace(/\r/g, '').trim();
  }

  throw new Error('Missing Firebase private key: set FIREBASE_PRIVATE_KEY_BASE64 or FIREBASE_PRIVATE_KEY');
}

function initIfNeeded() {
  if (getApps().length) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  if (!projectId || !clientEmail) {
    throw new Error('Missing FIREBASE_PROJECT_ID or FIREBASE_CLIENT_EMAIL');
  }

  const privateKey = loadPrivateKey();

  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export function getDb() {
  ensureServerNode();
  if (_db) return _db;
  initIfNeeded();
  _db = getFirestore();
  return _db;
}

export function getAdminAuth() {
  ensureServerNode();
  if (_auth) return _auth;
  initIfNeeded();
  _auth = _getAuth();
  return _auth;
}
