// src/app/login/page.js
import { redirectIfReadyToProfile } from '@/lib/redirect-to-profile.server';
import LoginClient from './LoginClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  await redirectIfReadyToProfile();
  return <LoginClient />;
}
