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
    <div className="login-scope relative min-h-[100vh] overflow-hidden text-white">
      {/* ===== LAVA BACKGROUND ===== */}
      {/* базовая тёмная плёнка + два красных радиальных градиента */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20"
        style={{
          background:
            'radial-gradient(1100px 560px at 80% 12%, rgba(255,75,45,.22), transparent 62%),' +
            'radial-gradient(900px 520px at 12% 92%, rgba(255,120,60,.18), transparent 62%),' +
            '#0b0e13',
        }}
      />
      {/* огненные прожилки сверху (blend) */}
      <div className="absolute inset-0 -z-10 mix-blend-screen opacity-40">
        <img
          alt=""
          src="https://images.unsplash.com/photo-1606216794074-735e91aa0d2b?q=80&w=1920&auto=format&fit=crop"
          className="h-full w-full object-cover"
        />
      </div>

      {/* ===== HEADER ACTION (Steam) ===== */}
      <div className="absolute right-4 top-4 z-10">
        <SteamCTA className="shadow-[0_6px_24px_rgba(0,0,0,.35)]" />
      </div>

      {/* ===== HERO ===== */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 md:pt-20">
        <p className="text-[12px] md:text-sm uppercase tracking-[0.25em] text-white/80 drop-shadow">
          WELCOME TO
        </p>

        <h1 className="mt-2 text-[44px] md:text-[68px] leading-[0.95] font-extrabold tracking-tight drop-shadow-lg">
          CYBERSTARS
        </h1>

        <p className="mt-5 max-w-2xl text-[15px] md:text-lg text-white/85 leading-relaxed">
          Compete in Dota 2 tournaments; earn prizes and fun rewards
        </p>
      </section>

      {/* ===== GLASS CARD — GAME MODES ===== */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8 md:mt-10">
        <div
          className="
            rounded-[26px] border border-white/10 bg-[rgba(32,12,12,.55)]
            shadow-[0_18px_60px_rgba(0,0,0,.55)]
            backdrop-blur-xl
            ring-1 ring-[rgba(255,90,45,.18)]
          "
          style={{
            backgroundImage:
              'radial-gradient(1200px 320px at 35% 10%, rgba(255,100,60,.12), transparent 65%),' +
              'radial-gradient(900px 260px at 90% 80%, rgba(255,50,25,.10), transparent 60%)',
          }}
        >
          {/* блок «Game Modes» */}
          <div className="p-5 md:p-7 lg:p-8">
            <h3 className="flex items-center gap-2 text-[18px] md:text-xl font-semibold">
              <span>🔥</span> Game Modes
            </h3>

            <ul className="mt-3 md:mt-4 space-y-2.5 text-white/90 text-[14px] md:text-[15px] leading-relaxed">
              <li>⚔️ 1v1 Solo Ranked Matches</li>
              <li>🛡️ 5v5 Classic Ranked Games</li>
              <li>⚡ 5v5 Turbo Mode</li>
              <li>🏆 Single &amp; Multi-Game Tournaments</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ===== SECOND LIST (Fair Play) — без карточки, просто отступ для следующего блока ===== */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8 md:mt-10 pb-20">
        <h3 className="flex items-center gap-2 text-[18px] md:text-xl font-semibold text-white/95">
          <span>🧠</span> Fair Play System
        </h3>
        <ul className="mt-3 md:mt-4 space-y-2.5 text-white/90 text-[14px] md:text-[15px] leading-relaxed">
          <li>📊 MMR bracket-based matchmaking</li>
          <li>🚫 Smurf &amp; abuse prevention built-in</li>
          <li>🕵️‍♂️ 200+ ranked games from same IP</li>
          <li>🔒 IP/device change resets eligibility</li>
          <li>🌐 Public Steam &amp; Dota 2 profile required</li>
        </ul>
      </section>
    </div>
  );
}
