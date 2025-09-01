export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Suspense } from 'react';
import SteamLoginClient from './SteamLoginClient';

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        Finishing login…
      </div>
    }>
      <SteamLoginClient />
    </Suspense>
  );
}
