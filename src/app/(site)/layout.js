// src/app/(site)/layout.js
import '../globals.css';

export const metadata = {
  title: 'CyberStars',
  description: 'Dota 2 tournaments platform',
};

export default function SiteLayout({ children }) {
  return (
    <div className="site-layout">
      {/* === Header (старый стиль с неоном) === */}
      <header className="px-6 py-4 flex items-center justify-between">
        <div className="text-glow font-bold text-xl tracking-wide">
          CYBERSTARS
        </div>
        <nav className="flex space-x-6">
          <a href="/" className="nav-link">
            Home
          </a>
          <a href="/tournaments" className="nav-link">
            Tournaments
          </a>
          <a href="/profile" className="nav-link">
            Profile
          </a>
          <a href="/admin" className="nav-link">
            Admin
          </a>
        </nav>
      </header>

      {/* === Контент страницы === */}
      <main className="p-6">{children}</main>

      {/* === Footer (опционально, если он у тебя был) === */}
      <footer className="mt-12 text-center text-sm text-muted">
        © {new Date().getFullYear()} CyberStars. All rights reserved.
      </footer>
    </div>
  );
}
