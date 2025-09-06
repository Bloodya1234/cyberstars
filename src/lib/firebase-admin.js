// src/lib/firebase-admin.js
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore as _getFirestore } from 'firebase-admin/firestore';
import { getAuth as _getAuth } from 'firebase-admin/auth';

let _db = null;
let _auth = null;

function ensureServerNode() {
  if (typeof window !== 'undefined') {
    throw new Error('Admin SDK must not run in the browser');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    throw new Error('Admin SDK is not supported on the Edge runtime');
  }
}

const norm = (s) => s.replace(/\r/g, '').trim();

/** 1) FIREBASE_SERVICE_ACCOUNT_KEY = JSON строка целиком */
function fromJSON() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;
  const j = JSON.parse(raw);
  if (!j.project_id || !j.client_email || !j.private_key) {
    throw new Error('Service account JSON missing required fields');
  }
  j.private_key = norm(j.private_key.replace(/\\n/g, '\n'));
  return { project_id: j.project_id, client_email: j.client_email, private_key: j.private_key };
}

/** 2) FIREBASE_PRIVATE_KEY_BASE64 = base64(JSON) или base64(PEM) */
function fromB64() {
  const b64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;
  if (!b64) return null;
  const decoded = Buffer.from(b64, 'base64').toString('utf8');

  // JSON в base64
  if (decoded.trim().startsWith('{')) {
    const j = JSON.parse(decoded);
    if (!j.project_id || !j.client_email || !j.private_key) {
      throw new Error('Decoded JSON missing required fields');
    }
    j.private_key = norm(j.private_key.replace(/\\n/g, '\n'));
    return { project_id: j.project_id, client_email: j.client_email, private_key: j.private_key };
  }

  // PEM в base64
  const project_id = process.env.FIREBASE_PROJECT_ID;
  const client_email = process.env.FIREBASE_CLIENT_EMAIL;
  if (!project_id || !client_email) {
    throw new Error('FIREBASE_PROJECT_ID and FIREBASE_CLIENT_EMAIL are required with FIREBASE_PRIVATE_KEY_BASE64 (PEM)');
  }
  const pem = norm(decoded.includes('\\n') ? decoded.replace(/\\n/g, '\n') : decoded);
  if (!pem.includes('BEGIN PRIVATE KEY') || !pem.includes('END PRIVATE KEY')) {
    throw new Error('Decoded PEM does not look like a valid private key');
  }
  return { project_id, client_email, private_key: pem };
}

/** 3) FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY */
function fromPEM() {
  const project_id = process.env.FIREBASE_PROJECT_ID;
  const client_email = process.env.FIREBASE_CLIENT_EMAIL;
  const pk = process.env.FIREBASE_PRIVATE_KEY;
  if (!project_id || !client_email || !pk) return null;
  return { project_id, client_email, private_key: norm(pk.replace(/\\n/g, '\n')) };
}

function _init() {
  if (getApps().length) return;
  const svc = fromJSON() ?? fromB64() ?? fromPEM();
  if (!svc) {
    throw new Error(
      'Missing Firebase Admin credentials. Provide FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_PRIVATE_KEY_BASE64 (+ PROJECT_ID/CLIENT_EMAIL) or FIREBASE_PRIVATE_KEY (+ PROJECT_ID/CLIENT_EMAIL).'
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

/** Публичные экспорты */
export function initAdminIfNeeded() {
  ensureServerNode();
  _init();
  if (!_db) _db = _getFirestore();
  if (!_auth) _auth = _getAuth();
  return { db: _db, auth: _auth };
}

export function getFirestore() {
  ensureServerNode();
  if (_db) return _db;
  _init();
  _db = _getFirestore();
  return _db;
}

export function getAuth() {
  ensureServerNode();
  if (_auth) return _auth;
  _init();
  _auth = _getAuth();
  return _auth;
}

/** Совместимость со старым кодом */
export const getDb = getFirestore;        // alias
export const getAdminAuth = getAuth;      // alias
