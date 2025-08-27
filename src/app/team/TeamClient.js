'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function TeamClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // TODO: тут помести твою текущую клиентскую логику со страницы /team
  // Если логика не нужна — можно оставить пустой useEffect
  useEffect(() => {
    const invite = searchParams.get('invite');
    if (invite) {
      // пример: если пришёл ?invite=..., можно что-то сделать
      // router.replace('/team'); // если нужно убрать query из адресной строки
    }
  }, [searchParams, router]);

  return (
    <div className="p-6">
      {/* Вставь сюда текущую JSX-разметку страницы /team */}
      Team page
    </div>
  );
}
