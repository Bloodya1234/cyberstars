// src/app/api/steam/steam-token/route.js
import { getAdminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { steamId } = await req.json();

    if (!steamId) {
      return new Response(JSON.stringify({ error: 'Missing steamId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Приводим к UID формата steam:XXXXXXXXXXXXXXX
    const uid = steamId.startsWith('steam:') ? steamId : `steam:${steamId}`;

    // Генерируем кастомный токен через единый Admin SDK
    const token = await adminAuth().createCustomToken(uid);

    return new Response(JSON.stringify({ token }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating custom token:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
