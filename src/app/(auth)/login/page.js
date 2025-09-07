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
    <div className="login-scope relative min-h-[100vh] overflow-hidden">
      {/* 🔥 LAVA BACKGROUND */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(1000px 520px at 82% 12%, rgba(255,87,54,.18), transparent 62%), radial-gradient(900px 520px at 12% 92%, rgba(255,140,60,.16), transparent 62%), #0b0e13',
        }}
      />
      <div className="absolute inset-0 -z-10 mix-blend-screen opacity-[0.35]">
        <img
          alt=""
          src="https://images.unsplash.com/photo-1606216794074-735e91aa0d2b?q=80&w=1920&auto=format&fit=crop"
          className="h-full w-full object-cover"
        />
      </div>

      {/* === HERO === */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 pb-6">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.2em] text-white/80 drop-shadow">WELCOME TO</p>
          <h1 className="mt-2 text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-lg">
            CYBERSTARS
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/90 max-w-2xl">
            Love Dota 2? Dream of earning from your skill? You&apos;re in the right place. Compete in
            real-money tournaments with fair matchmaking and smart anti-abuse systems.
          </p>
          <div className="mt-6">
            <SteamCTA className="px-6 py-3 text-base">Login with Steam</SteamCTA>
          </div>
        </div>
      </section>

      {/* === GLASS INFO CARD === */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-14">
        <div
          className="
            rounded-3xl border border-white/10 bg-white/5
            backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.45)]
          "
        >
          <div className="grid gap-6 p-6 md:p-10 md:grid-cols-2">
            {/* Game Modes */}
            <div
              className="
                rounded-2xl p-6 border border-white/10 bg-white/[.06] backdrop-blur-lg
              "
            >
              <h3 className="flex items-center gap-2 text-xl font-semibold text-white">
                <span>🕹️</span> Game Modes
              </h3>
              <ul className="mt-4 space-y-2 text-white/90 leading-relaxed">
                <li>⚔️ 1v1 Solo Ranked Matches</li>
                <li>🛡️ 5v5 Classic Ranked Games</li>
                <li>⚡ 5v5 Turbo Mode</li>
                <li>🏆 Single &amp; Multi-Game Tournaments</li>
              </ul>
            </div>

            {/* Fair Play */}
            <div
              className="
                rounded-2xl p-6 border border-white/10 bg-white/[.06] backdrop-blur-lg
              "
            >
              <h3 className="flex items-center gap-2 text-xl font-semibold text-white">
                <span>🧠</span> Fair Play System
              </h3>
              <ul className="mt-4 space-y-2 text-white/90 leading-relaxed">
                <li>📊 MMR bracket-based matchmaking</li>
                <li>🚫 Smurf &amp; abuse prevention built-in</li>
                <li>🕵️‍♂️ 200+ ranked games from same IP</li>
                <li>🔒 IP/device change resets eligibility</li>
                <li>🌐 Public Steam &amp; Dota 2 profile required</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 px-6 py-6 text-center text-white/85 md:px-10">
            We&apos;ve built a fair and rewarding platform where skill truly pays off. Log in, play
            hard, and earn real rewards from your passion. <br />
            <span className="mt-1 inline-block font-bold text-white">GLHF!</span>
          </div>
        </div>
      </section>
    </div>
  );
}
