import { redirect } from 'next/navigation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Home() {
  // серверный редирект мгновенно отправит на /login
  redirect('/login');
}
