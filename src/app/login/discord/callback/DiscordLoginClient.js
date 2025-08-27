'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function DiscordLoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // тут твоя логика обработки параметров, если нужна
    // по умолчанию — ничего не делаем
    const error = searchParams.get('error');
    if (error) {
      console.error('Discord login error:', error);
    }
  }, [searchParams]);

  return (
    <div className="p-6 text-center">
      Connect your Discord account
    </div>
  );
}
