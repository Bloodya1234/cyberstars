// пример server-component-гуарда для /profile
import { redirect } from 'next/navigation';
import { db } from '@/lib/firebase-admin';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  // 1) Сессия
  const session = await getAuthSession();
  const uid = session?.user?.uid;
  if (!uid) redirect('/login?next=/profile');

  // 2) Читаем пользователя
  const snap = await db().collection('users').doc(uid).get();
  if (!snap.exists) redirect('/login?next=/profile');
  const user = snap.data() || {};

  // 3) Нет привязки Discord → отправляем на коннект
  if (!user.discord?.id) redirect('/connect-discord');

  // 4) Нет членства сервера → отправляем на join-страницу
  if (!user.joinedDiscordServer) redirect('/join-discord');

  // 5) Всё ок — рендерим профиль
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-4">Your Profile</h1>
      <div className="opacity-80">
        UID: <span className="font-mono">{uid}</span>
      </div>
      {/* тут твоя статистика и т.п. */}
    </main>
  );
}
