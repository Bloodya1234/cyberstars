// src/app/join-discord/page.js
import { redirectIfReadyToProfile } from '@/lib/redirect-to-profile.server';
import JoinDiscordClient from './JoinDiscordClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  await redirectIfReadyToProfile();
  return <JoinDiscordClient />;
}
