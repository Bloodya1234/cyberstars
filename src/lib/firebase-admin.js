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

function initIfNeeded() {
  if (getApps().length) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyBase64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;

  if (!projectId || !clientEmail || !privateKeyBase64) {
    throw new Error(
      'Missing Firebase Admin env: set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY_BASE64'
    );
  }

  const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf8');

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
