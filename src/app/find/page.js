import { Suspense } from 'react';
import FindClient from './FindClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'default-no-store';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <FindClient />
    </Suspense>
  );
}
