// src/app/profile/page.js
import { redirect } from 'next/navigation';
import { db } from '@/lib/firebase-admin';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  // 1) Сессия
  const session = await getAuthSession();
  const uid = session?.user?.uid;
  if (!uid) {
    redirect('/login?next=/profile');
  }

  // 2) Читаем пользователя (не редиректим, если документа нет — покажем пустой профиль)
  let user = {};
  try {
    const snap = await db().collection('users').doc(uid).get();
    if (snap.exists) user = snap.data() || {};
  } catch (_) {
    // если Firestore временно недоступен — покажем базовую страницу
  }

  // 3) Ссылки
  const inviteUrlRaw = (process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || '').trim();
  const inviteUrl =
    inviteUrlRaw && !inviteUrlRaw.startsWith('http')
      ? `https://${inviteUrlRaw}`
      : inviteUrlRaw;

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Your Profile</h1>

      {/* Блок статуса/предупреждений */}
      {!user.discord?.id ? (
        <div className="rounded-lg border border-yellow-600/40 bg-yellow-900/20 text-yellow-100 px-4 py-3">
          <div className="font-semibold mb-1">Discord is not connected</div>
          <p className="opacity-90">
            Please connect your Discord account to get invites and access team features.
          </p>
          <a
            href="/connect-discord"
            className="inline-block mt-3 px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-500"
          >
            Connect Discord
          </a>
        </div>
      ) : !user.joinedDiscordServer ? (
        <div className="rounded-lg border border-cyan-600/40 bg-cyan-900/20 text-cyan-100 px-4 py-3">
          <div className="font-semibold mb-1">Join our Discord server</div>
          <p className="opacity-90">
            You are connected to Discord, but haven’t joined our server yet.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <a
              href="/join-discord"
              className="px-4 py-2 rounded bg-cyan-600 text-black font-semibold hover:bg-cyan-500"
            >
              Open Join Page
            </a>
            {inviteUrl && (
              <a
                href={inviteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded bg-cyan-700 text-white hover:bg-cyan-600"
              >
                Open Invite in New Tab
              </a>
            )}
          </div>
        </div>
      ) : null}

      {/* Информация об аккаунте */}
      <section className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
        <div className="opacity-80">
          UID: <span className="font-mono">{uid}</span>
        </div>

        {user.discord?.id && (
          <div className="mt-2 space-y-1">
            <div className="opacity-80">
              Discord ID: <span className="font-mono">{user.discord.id}</span>
            </div>
            {user.discord.tag && (
              <div className="opacity-80">Discord Tag: {user.discord.tag}</div>
            )}
          </div>
        )}

        <div className="mt-3 opacity-70 text-sm">
          Role: <span className="font-mono">{user.role || 'user'}</span>
        </div>
      </section>

      {/* Здесь размести свою статистику и прочий контент профиля */}
      <section className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
        <div className="opacity-80">Your stats and other profile content go here…</div>
      </section>
    </main>
  );
}
