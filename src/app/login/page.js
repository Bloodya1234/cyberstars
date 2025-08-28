import { Suspense } from 'react';
import LoginScreen from './LoginScreen';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'default-no-store';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-white">Loading…</div>}>
      <LoginScreen />
    </Suspense>
  );
}
