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

function normalizePem(pem) {
  return pem.replace(/\r/g, '').replace(/^\s+|\s+$/g, '');
}

function fromEnvJSON() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;
  try {
    const svc = JSON.parse(raw);
    // минимальная валидация
    if (!svc.project_id || !svc.client_email || !svc.private_key) {
      throw new Error('Service account JSON missing required fields');
    }
    // нормализуем переносы
    svc.private_key = normalizePem(svc.private_key.replace(/\\n/g, '\n'));
    return svc;
  } catch (e) {
    throw new Error(`Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON: ${String(e?.message || e)}`);
  }
}

function fromEnvBase64() {
  const b64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;
  if (!b64) return null;
  // Декодируем base64
  const decoded = Buffer.from(b64, 'base64').toString('utf8');

  // Вариант 2a: в base64 положили ВЕСЬ JSON
  if (decoded.trim().startsWith('{')) {
    try {
      const svc = JSON.parse(decoded);
      if (!svc.project_id || !svc.client_email || !svc.private_key) {
        throw new Error('Decoded JSON missing required fields');
      }
      svc.private_key = normalizePem(svc.private_key.replace(/\\n/g, '\n'));
      return svc;
    } catch (e) {
      throw new Error(`Invalid base64 JSON in FIREBASE_PRIVATE_KEY_BASE64: ${String(e?.message || e)}`);
    }
  }

  // Вариант 2b: в base64 положили только PEM приватного ключа
  const project_id = process.env.FIREBASE_PROJECT_ID;
  const client_email = process.env.FIREBASE_CLIENT_EMAIL;
  if (!project_id || !client_email) {
    throw new Error('FIREBASE_PROJECT_ID and FIREBASE_CLIENT_EMAIL are required when using FIREBASE_PRIVATE_KEY_BASE64 (PEM mode)');
  }

  // Нормализуем PEM (переводы строк/CRLF)
  const pem = normalizePem(
    decoded.includes('\\n') ? decoded.replace(/\\n/g, '\n') : decoded.replace(/\r/g, '')
  );

  if (!pem.includes('BEGIN PRIVATE KEY') || !pem.includes('END PRIVATE KEY')) {
    throw new Error('Decoded PEM from FIREBASE_PRIVATE_KEY_BASE64 does not look like a valid private key (BEGIN/END missing)');
  }

  return { project_id, client_email, private_key: pem };
}

function fromEnvPEM() {
  const project_id = process.env.FIREBASE_PROJECT_ID;
  const client_email = process.env.FIREBASE_CLIENT_EMAIL;
  const pkRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!project_id || !client_email || !pkRaw) return null;
  const private_key = normalizePem(pkRaw.replace(/\\n/g, '\n'));
  return { project_id, client_email, private_key };
}

function initIfNeeded() {
  if (getApps().length) return;

  // Порядок приоритета:
  // 1) Полный JSON одной переменной
  // 2) BASE64: JSON или PEM (+ PROJECT_ID/CLIENT_EMAIL)
  // 3) Обычный PEM с \n (+ PROJECT_ID/CLIENT_EMAIL)
  const svcFromJson = fromEnvJSON();
  const svcFromBase64 = !svcFromJson ? fromEnvBase64() : null;
  const svcFromPem = !svcFromJson && !svcFromBase64 ? fromEnvPEM() : null;

  const svc = svcFromJson || svcFromBase64 || svcFromPem;
  if (!svc) {
    throw new Error(
      'Missing Firebase Admin credentials: set FIREBASE_SERVICE_ACCOUNT_KEY (JSON) OR FIREBASE_PRIVATE_KEY_BASE64 (+ PROJECT_ID/CLIENT_EMAIL) OR FIREBASE_PRIVATE_KEY (+ PROJECT_ID/CLIENT_EMAIL)'
    );
  }

  initializeApp({
    credential: cert({
      projectId: svc.project_id,
      clientEmail: svc.client_email,
      privateKey: svc.private_key,
    }),
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
