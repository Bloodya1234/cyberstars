'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      console.error('Discord OAuth error:', error);
      router.replace('/login');
      return;
    }
    router.replace('/profile');
  }, [router, searchParams]);

  return <div className="p-6 text-center">Finishing Discord login…</div>;
}
