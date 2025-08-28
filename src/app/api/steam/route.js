// src/app/api/steam/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function GET(req) {
  const url = new URL(req.url);
  const origin = url.origin; // Текущий домен (preview/prod)

  const returnTo = `${origin}/api/steam/return`;
  const realm = origin.endsWith('/') ? origin : `${origin}/`;

  const qs = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnTo,
    'openid.realm': realm,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  });

  const redirectUrl = `https://steamcommunity.com/openid/login?${qs.toString()}`;
  return NextResponse.redirect(redirectUrl);
}
