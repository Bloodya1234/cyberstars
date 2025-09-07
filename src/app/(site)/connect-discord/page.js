// src/app/connect-discord/page.js
import { redirectIfReadyToProfile } from '@/lib/redirect-to-profile.server';
import ConnectDiscordClient from './ConnectDiscordClient';
export const dynamic = 'force-dynamic';
export default async function Page() { await redirectIfReadyToProfile(); return <ConnectDiscordClient/>; }
