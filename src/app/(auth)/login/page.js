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
      {/* CTA */}
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

           {/* INFO CARDS — glass + lava glow */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 mt-14 pb-24">
        <div className="grid gap-6 md:gap-8 md:grid-cols-2">
          {/* Card 1 */}
          <div className="glass-card lava-border p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="badge-lava">🔥</div>
              <h3 className="text-xl md:text-2xl font-semibold">Game Modes</h3>
            </div>

            <ul className="mt-5 space-y-2 text-white/90 text-base md:text-lg leading-relaxed">
              <li>⚔️ 1v1 Solo Ranked Matches</li>
              <li>🛡️ 5v5 Classic Ranked Games</li>
              <li>⚡ 5v5 Turbo Mode</li>
              <li>🏆 Single &amp; Multi-Game Tournaments</li>
            </ul>
          </div>

          {/* Card 2 */}
          <div className="glass-card lava-border p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="badge-neon">🧠</div>
              <h3 className="text-xl md:text-2xl font-semibold">Fair Play System</h3>
            </div>

            <ul className="mt-5 space-y-2 text-white/90 text-base md:text-lg leading-relaxed">
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
