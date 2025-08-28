// src/app/api/steam/steam-token/route.js
import { adminAuth } from '@/lib/firebase-admin';

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

    const uid = steamId.startsWith('steam:') ? steamId : `steam:${steamId}`;
    const token = await adminAuth().createCustomToken(uid);

    return new Response(JSON.stringify({ token }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating custom token:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
