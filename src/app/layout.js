// src/app/layout.js
import './globals.css';

export const metadata = {
  title: 'CyberStars',
  description: 'Dota 2 tournaments platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="bg-background text-primary">
      <body className="font-orbitron relative">{children}</body>
    </html>
  );
}
