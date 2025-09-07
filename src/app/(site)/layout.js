// src/app/(site)/layout.js
import '../globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'CyberStars',
  description: 'Dota 2 tournaments platform',
};

export default function SiteLayout({ children }) {
  return (
    <div className="site-layout">
      {/* === Header (неон, как раньше) === */}
      <header className="px-6 py-4 flex items-center justify-between">
        <div className="text-glow font-bold text-xl tracking-wide">
          CYBERSTARS
        </div>
        <nav className="flex space-x-6">
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/tournaments" className="nav-link">Tournaments</Link>
          <Link href="/profile" className="nav-link">Profile</Link>
          <Link href="/admin" className="nav-link">Admin</Link>
        </nav>
      </header>

      <main className="p-6">{children}</main>

      <footer className="mt-12 text-center text-sm text-muted">
        © {new Date().getFullYear()} CyberStars. All rights reserved.
      </footer>
    </div>
  );
}
