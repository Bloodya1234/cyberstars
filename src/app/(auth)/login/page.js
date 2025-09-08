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
        backgroundImage: 'url("/dota-bg.png")', // <-- твой файл
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Кнопка Steam в углу */}
      <div className="absolute right-4 top-4 z-10">
        <SteamCTA />
      </div>

      {/* Текст */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20">
        <p className="text-sm uppercase tracking-[0.25em] text-white/85 drop-shadow">
          WELCOME TO
        </p>
        <h1 className="mt-2 text-5xl md:text-7xl font-extrabold tracking-tight drop-shadow-lg">
          CYBERSTARS
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-white/90">
          Compete in Dota 2 tournaments; earn prizes and fun rewards
        </p>
      </section>

      {/* Карточка */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10 pb-20">
        <div className="rounded-2xl bg-black/60 backdrop-blur-lg p-8">
          <h3 className="flex items-center gap-2 text-xl font-semibold">
            <span>🔥</span> Game Modes
          </h3>
          <ul className="mt-4 space-y-2">
            <li>⚔️ 1v1 Solo Ranked Matches</li>
            <li>🛡️ 5v5 Classic Ranked Games</li>
            <li>⚡ 5v5 Turbo Mode</li>
            <li>🏆 Single &amp; Multi-Game Tournaments</li>
          </ul>

          <h3 className="mt-8 flex items-center gap-2 text-xl font-semibold">
            <span>🧠</span> Fair Play System
          </h3>
          <ul className="mt-4 space-y-2">
            <li>📊 MMR bracket-based matchmaking</li>
            <li>🚫 Smurf &amp; abuse prevention built-in</li>
            <li>🕵️‍♂️ 200+ ranked games from same IP</li>
            <li>🔒 IP/device change resets eligibility</li>
            <li>🌐 Public Steam &amp; Dota 2 profile required</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
