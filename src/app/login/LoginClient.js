'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Пример: если есть ?error=..., можно показать уведомление или редиректнуть
    const error = searchParams.get('error');
    if (error) {
      console.error('Login error:', error);
      // оставить на странице, либо:
      // router.replace(`/login?msg=${encodeURIComponent('Ошибка авторизации')}`);
    }
  }, [searchParams, router]);

  return (
    <div className="p-6 text-center">
      {/* здесь твоя текущая верстка / кнопки логина */}
      Login page
    </div>
  );
}
