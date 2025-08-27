'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function DiscordLoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      router.replace(`/login?error=${encodeURIComponent(error)}`);
      return;
    }
    // Если нужно что-то сделать при заходе на страницу — добавь сюда.
  }, [router, searchParams]);

  return (
    <div className="p-6 text-center">
      Connect your Discord account
    </div>
  );
}
