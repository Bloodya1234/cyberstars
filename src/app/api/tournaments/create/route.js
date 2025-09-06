import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/** простая проверка на админа по email (который присылает клиент) */
function isAdminEmail(email) {
  const list = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  if (!list.length) return false;
  return list.includes(String(email || '').toLowerCase());
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));

    // клиент должен прислать свой email (или реализуйте куки/сессию и доставайте на сервере)
    const requesterEmail = body?.requesterEmail;

    if (!isAdminEmail(requesterEmail)) {
      return NextResponse.json(
        { error: 'Unauthorized', details: ['Only admin can create tournaments'] },
        { status: 401 }
      );
    }

    // валидация полей
    const payload = {
      name: String(body?.name || '').trim(),
      type: String(body?.type || '1v1').trim(),
      bracket: String(body?.bracket || '').trim(),
      maxSlots: Number(body?.maxSlots || 0),
      prize: String(body?.prize ?? ''),
      rules: String(body?.rules ?? ''),
      currentSlots: 0,
      createdAt: new Date().toISOString(),
    };

    const errors = [];
    if (!payload.name) errors.push('name is required');
    if (!['1v1', '5v5', 'turbo'].includes(payload.type)) errors.push('type must be 1v1 | 5v5 | turbo');
    if (!payload.bracket) errors.push('bracket is required');
    if (!Number.isFinite(payload.maxSlots) || payload.maxSlots <= 0) errors.push('maxSlots must be > 0');

    if (errors.length) {
      return NextResponse.json({ error: 'Invalid data', details: errors }, { status: 400 });
    }

    // запись серверными правами (firebase-admin)
    const docRef = await adminDb.collection('tournaments').add(payload);

    return NextResponse.json({ ok: true, id: docRef.id }, { status: 201 });
  } catch (err) {
    console.error('create tournament failed:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', details: [String(err?.message || err)] },
      { status: 500 }
    );
  }
}
