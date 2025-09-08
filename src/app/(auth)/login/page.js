import SteamCTA from './SteamCTA.client';
import './override.css';

export const metadata = {
  title: 'Login — CyberStars',
  description:
    'Log in with Steam to join CyberStars Dota 2 tournaments with fair matchmaking and anti-abuse systems.',
};

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <div
      className="login-scope relative min-h-[100vh] overflow-hidden text-white"
      style={{
        backgroundImage: 'url("/dota-bg.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Steam CTA в правом верхнем углу */}
      <SteamCTA className="fixed right-6 top-6 z-50" />

      {/* HERO */}
      <section className="relative z-10 max-w-7xl px-6 pt-24">
        <h1
          className="text-left font-extrabold leading-[1.05] drop-shadow-lg
                     text-[92px] md:text-[140px] lg:text-[180px] uppercase"
        >
          <div>WELCOME TO</div>
          <div>CYBERSTARS</div>
        </h1>

        <p className="mt-8 max-w-3xl text-left text-[18px] md:text-[22px] text-white/90 drop-shadow">
          Compete in Dota 2 tournaments; earn prizes and fun rewards
        </p>
      </section>

      {/* INFO CARDS */}
      {/* Карточка: Game Modes */}
<div className="lava-card p-6 md:p-8 mt-6 w-full max-w-[880px]">
  <h3 className="text-3xl font-bold mb-4 flex items-center gap-2">
    <span>🔥</span> Game Modes
  </h3>
  <ul className="space-y-4 text-2xl md:text-3xl text-white/95">
    <li>⚔️ 1v1 Solo Ranked Matches</li>
    <li>🛡️ 5v5 Classic Ranked Games</li>
    <li>⚡ 5v5 Turbo Mode</li>
    <li>🏆 Single & Multi-Game Tournaments</li>
  </ul>
</div>

{/* Карточка: Fair Play System */}
<div className="lava-card p-6 md:p-8 mt-6 w-full max-w-[880px]">
  <h3 className="text-3xl font-bold mb-4 flex items-center gap-2">
    <span>🧠</span> Fair Play System
  </h3>
  <ul className="space-y-4 text-2xl md:text-3xl text-white/95">
    <li>📊 MMR bracket-based matchmaking</li>
    <li>🚫 Smurf & abuse prevention built-in</li>
    <li>🕵️‍♂️ 200+ ranked games from same IP</li>
    <li>🔒 IP/device change resets eligibility</li>
    <li>🌐 Public Steam & Dota 2 profile required</li>
  </ul>
</div>

    </div>
  );
}
