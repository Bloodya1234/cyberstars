/* eslint-disable @next/next/no-img-element */
import SteamLoginButton from '@/components/SteamLoginButton';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <div className="relative min-h-[90vh]">
      {/* фон: темный градиент + «лава» */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(1000px 500px at 85% 15%, rgba(255,87,54,0.14), transparent 60%), radial-gradient(800px 500px at 15% 85%, rgba(255,122,61,0.12), transparent 60%), #0b0e13',
        }}
      />
      <div className="absolute inset-0 -z-10 mix-blend-screen opacity-[0.35]">
        {/* сюда при желании вставь свою текстуру/обои Dota 2 */}
        <img
          alt=""
          src="https://images.unsplash.com/photo-1606216794074-735e91aa0d2b?q=80&w=1920&auto=format&fit=crop"
          className="h-full w-full object-cover"
        />
      </div>

      {/* переключатель языка и кнопка логина — закреплены вверху */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-end gap-3 pt-5">
          <LanguageSwitcher />
          <SteamLoginButton />
        </div>
      </div>

      {/* HERO */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.2em] text-white/80 drop-shadow">WELCOME TO</p>
          <h1 className="mt-2 text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-lg">
            CYBERSTARS
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/85 max-w-2xl">
            Love Dota 2? Dream of earning from your skill? You're in the right place.
            Compete in real-money tournaments with fair matchmaking and smart anti-abuse systems.
          </p>

          {/* дубль кнопки для CTA под заголовком (мобайл/десктоп) */}
          <div className="mt-6">
            <SteamLoginButton className="px-6 py-3 text-base">Login with Steam</SteamLoginButton>
          </div>
        </div>
      </section>

      {/* КАРТОЧКА С РАЗДЕЛАМИ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-14">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.45)]">
          <div className="grid gap-6 p-6 md:p-10 md:grid-cols-2">
            {/* Game Modes */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-6">
              <h3 className="flex items-center gap-2 text-xl font-semibold text-white">
                <span>🕹️</span> Game Modes
              </h3>
              <ul className="mt-4 space-y-2 text-white/90">
                <li>⚔️ 1v1 Solo Ranked Matches</li>
                <li>🛡️ 5v5 Classic Ranked Games</li>
                <li>⚡ 5v5 Turbo Mode</li>
                <li>🏆 Single &amp; Multi-Game Tournaments</li>
              </ul>
            </div>

            {/* Fair Play */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-6">
              <h3 className="flex items-center gap-2 text-xl font-semibold text-white">
                <span>🧠</span> Fair Play System
              </h3>
              <ul className="mt-4 space-y-2 text-white/90">
                <li>📊 MMR bracket-based matchmaking</li>
                <li>🚫 Smurf &amp; abuse prevention built-in</li>
                <li>🕵️‍♂️ 200+ ranked games from same IP</li>
                <li>🔒 IP/device change resets eligibility</li>
                <li>🌐 Public Steam &amp; Dota 2 profile required</li>
              </ul>
            </div>
          </div>

          {/* футер карточки */}
          <div className="border-t border-white/10 px-6 py-6 text-center text-white/80 md:px-10">
            We’ve built a fair and rewarding platform where skill truly pays off. Log in, play hard,
            and earn real rewards from your passion. <br />
            <span className="mt-1 inline-block font-bold text-white">GLHF!</span>
          </div>
        </div>
      </section>
    </div>
  );
}
