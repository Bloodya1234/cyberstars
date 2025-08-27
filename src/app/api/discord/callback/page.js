import { Suspense } from 'react';
import CallbackClient from './CallbackClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Finishing Discord login…</div>}>
      <CallbackClient />
    </Suspense>
  );
}
