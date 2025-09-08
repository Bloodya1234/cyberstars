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
      <section className="relative z-10 max-w-7xl px-6 pb-24 space-y-6">
        {/* Карточка: Game Modes */}
       {/* Карточка: Game Modes */}
{/* Карточка: Game Modes */}
<div className="lava-card p-4 md:p-6 mt-6 w-full max-w-[700px] border-2 border-orange-500 rounded-xl">
  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
    <span className="text-2xl">🔥</span> Game Modes
  </h3>
  <ul className="space-y-2 text-base md:text-lg text-white/95 leading-relaxed">
    <li><span className="text-xl">⚔️</span> 1v1 Solo Ranked Matches</li>
    <li><span className="text-xl">🛡️</span> 5v5 Classic Ranked Games</li>
    <li><span className="text-xl">⚡</span> 5v5 Turbo Mode</li>
    <li><span className="text-xl">🏆</span> Single & Multi-Game Tournaments</li>
  </ul>
</div>

{/* Карточка: Fair Play System */}
<div className="lava-card p-4 md:p-6 mt-6 w-full max-w-[700px] border-2 border-pink-500 rounded-xl">
  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
    <span className="text-2xl">🧠</span> Fair Play System
  </h3>
  <ul className="space-y-2 text-base md:text-lg text-white/95 leading-relaxed">
    <li><span className="text-xl">📊</span> MMR bracket-based matchmaking</li>
    <li><span className="text-xl">🚫</span> Smurf & abuse prevention built-in</li>
    <li><span className="text-xl">🕵️‍♂️</span> 200+ ranked games from same IP</li>
    <li><span className="text-xl">🔒</span> IP/device change resets eligibility</li>
    <li><span className="text-xl">🌐</span> Public Steam & Dota 2 profile required</li>
  </ul>
</div>

      </section>
    </div>
  );
}
