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
        backgroundImage: 'url("/dota-bg.png")', // твой фон из /public
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Кнопка Steam: фиксированно в правом верхнем углу */}
      <SteamCTA className="fixed right-6 top-6 z-50" />

      {/* HERO */}
      <section className="relative z-10 max-w-7xl px-6 pt-24">
        <p className="text-[14px] md:text-[16px] uppercase tracking-[0.25em] text-white/85 drop-shadow text-left">
          WELCOME TO
        </p>
        <h1 className="mt-2 text-left font-extrabold leading-[0.95] drop-shadow-lg
                       text-[72px] md:text-[120px] lg:text-[164px]">
          CYBERSTARS
        </h1>
        <p className="mt-6 max-w-2xl text-left text-[16px] md:text-[20px] text-white/90 drop-shadow">
          Compete in Dota 2 tournaments; earn prizes and fun rewards
        </p>
      </section>

      {/* Карточка с инфой */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 mt-14 pb-20">
        <div className="rounded-2xl bg-black/60 backdrop-blur-lg p-8 shadow-lg">
          {/* Game Modes */}
          <div>
            <h3 className="flex items-center gap-2 text-2xl font-semibold">
              <span>🔥</span> Game Modes
            </h3>
            <ul className="mt-4 space-y-2 text-base text-white/90">
              <li>⚔️ 1v1 Solo Ranked Matches</li>
              <li>🛡️ 5v5 Classic Ranked Games</li>
              <li>⚡ 5v5 Turbo Mode</li>
              <li>🏆 Single &amp; Multi-Game Tournaments</li>
            </ul>
          </div>

          {/* Fair Play */}
          <div className="mt-10">
            <h3 className="flex items-center gap-2 text-2xl font-semibold">
              <span>🧠</span> Fair Play System
            </h3>
            <ul className="mt-4 space-y-2 text-base text-white/90">
              <li>📊 MMR bracket-based matchmaking</li>
              <li>🚫 Smurf &amp; abuse prevention built-in</li>
              <li>🕵️‍♂️ 200+ ranked games from same IP</li>
              <li>🔒 IP/device change resets eligibility</li>
              <li>🌐 Public Steam &amp; Dota 2 profile required</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
