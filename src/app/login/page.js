// src/app/login/page.js
import { redirectIfReadyToProfile } from '@/lib/redirect-to-profile.server';
import LoginClient from './LoginClient'; // твой клиентский UI логина (если есть)

export const dynamic = 'force-dynamic'; // на всякий случай, cookies() уже делает динамичным

export default async function Page() {
  await redirectIfReadyToProfile(); // ← если всё ок — улетим в /profile
  return <LoginClient />;           // иначе покажем обычный логин
}
