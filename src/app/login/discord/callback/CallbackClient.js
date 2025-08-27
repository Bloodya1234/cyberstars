'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // здесь можешь делать что угодно с параметрами (?code, ?state, ?error и т.п.)
    // Минимально: если есть error — уйти на /login с сообщением, если всё ок — на /profile
    const error = searchParams.get('error');
    if (error) {
      console.error('Discord OAuth error:', error);
      router.replace('/login');
      return;
    }

    // Если нужно что-то подождать — можно оставить спиннер; иначе ведём на профиль.
    router.replace('/profile');
  }, [router, searchParams]);

  return (
    <div className="p-6 text-center">
      Finishing Discord login…
    </div>
  );
}
