import { NextResponse, NextRequest } from 'next/server';

export const config = {
  // пути, на которых хотим «пересадку» в профиль
  matcher: ['/', '/login', '/steam-login', '/connect-discord', '/join-discord'],
};

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const origin = url.origin;

  // не допускаем редирект-лупы: если уже идём в /profile — пропускаем
  if (url.pathname.startsWith('/profile')) {
    return NextResponse.next();
  }

  // пробуем получить user-info через наш node API (пробрасываем cookie)
  let user: any = null;
  try {
    const r = await fetch(`${origin}/api/user-info`, {
      headers: { cookie: req.headers.get('cookie') ?? '' },
      // важно: без кэширования
      cache: 'no-store',
    });

    if (r.ok) {
      user = await r.json();
    }
  } catch {
    // молча пропускаем — значит нет сессии/апи недоступно
  }

  // если сессия валидна и уже всё подключено — шлём на профиль
  if (user?.uid && user?.discord?.id && user?.joinedDiscordServer === true) {
    const profileUrl = new URL('/profile', origin);
    return NextResponse.redirect(profileUrl);
  }

  // иначе просто продолжаем на запрошенную страницу (логин/подключение)
  return NextResponse.next();
}
