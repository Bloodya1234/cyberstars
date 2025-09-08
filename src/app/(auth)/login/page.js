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

               {/* INFO — glass cards with lava gradient border */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 mt-6 md:mt-10">
        {/* Вся колонка слева, фиксированная ширина, чтобы не превращалось в «полосу» */}
        <div className="max-w-[720px] space-y-8">

          {/* CARD 1 */}
          <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-amber-500/70 via-orange-600/70 to-rose-600/70 shadow-[0_0_28px_rgba(249,115,22,0.25)]">
            <div className="rounded-2xl bg-black/55 backdrop-blur-md px-6 py-6 md:px-8 md:py-8">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full
                                 bg-gradient-to-br from-amber-400 to-rose-500 shadow-[0_0_18px_rgba(249,115,22,0.45)]
                                 text-white text-xl select-none">🔥</span>
                <h3 className="text-2xl font-semibold">Game Modes</h3>
              </div>

              <ul className="mt-5 space-y-2 text-white/90 text-lg leading-relaxed">
                <li>⚔️ 1v1 Solo Ranked Matches</li>
                <li>🛡️ 5v5 Classic Ranked Games</li>
                <li>⚡ 5v5 Turbo Mode</li>
                <li>🏆 Single &amp; Multi-Game Tournaments</li>
              </ul>
            </div>
          </div>

          {/* CARD 2 */}
          <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-sky-400/70 via-cyan-400/70 to-indigo-500/70 shadow-[0_0_28px_rgba(56,189,248,0.22)]">
            <div className="rounded-2xl bg-black/55 backdrop-blur-md px-6 py-6 md:px-8 md:py-8">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full
                                 bg-gradient-to-br from-sky-400 to-indigo-500 shadow-[0_0_18px_rgba(56,189,248,0.45)]
                                 text-white text-xl select-none">🧠</span>
                <h3 className="text-2xl font-semibold">Fair Play System</h3>
              </div>

              <ul className="mt-5 space-y-2 text-white/90 text-lg leading-relaxed">
                <li>📊 MMR bracket-based matchmaking</li>
                <li>🚫 Smurf &amp; abuse prevention built-in</li>
                <li>🕵️‍♂️ 200+ ranked games from same IP</li>
                <li>🔒 IP/device change resets eligibility</li>
                <li>🌐 Public Steam &amp; Dota 2 profile required</li>
              </ul>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
