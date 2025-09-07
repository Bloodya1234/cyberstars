// src/app/profile/page.js
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import ClientProfile from './ClientProfile';

export default function Page() {
  return <ClientProfile />;
}
