// src/app/(auth)/login/page.js
import SteamCTA from './SteamCTA.client';

export const metadata = {
  title: 'Login — CyberStars',
  description:
    'Log in with Steam to join CyberStars Dota 2 & CS:GO tournaments with fair matchmaking and anti-abuse systems.',
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
      {/* Кнопка входа в правом верхнем углу */}
      <SteamCTA className="fixed right-6 top-6 z-50" />

      {/* HERO */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-20 text-center">
        <h1
          className="hero-title mx-auto font-extrabold leading-[1.05] drop-shadow-lg
                     text-[64px] md:text-[112px] lg:text-[132px] uppercase"
        >
          <div className="opacity-90 tracking-[0.12em] text-[22px] md:text-[32px] lg:text-[36px] mb-2">
            WELCOME TO
          </div>
          <div>CYBERSTARS</div>
        </h1>

        <p className="hero-subtitle mx-auto mt-6 max-w-4xl text-[22px] md:text-[28px] lg:text-[32px] text-white/90 drop-shadow">
                 Заходи к нам и используй свой скил,
           чтобы зарабатывать деньги играя в любимые игры
        </p>

        {/* Центральная жёлтая кнопка */}
        <a href="/steam-login" className="hero-cta inline-flex items-center justify-center mt-8">
          LOGIN STEAM
        </a>
      </section>

      {/* Карточка «Наши игры» */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 mt-80">
        <div className="features-card lava-card allow-border mx-auto w-full max-w-[980px] p-6 md:p-8">
          {/* Логотипы + заголовок в одной линии */}
          <div className="relative flex items-center justify-between mb-6">
            <img
              src="/dota-logo.png"
              alt="Dota 2 logo"
              className="w-[52px] h-[52px] object-contain 
                         filter drop-shadow-[0_0_6px_rgba(255,255,255,0.85)] 
                         bg-black/30 rounded-lg p-1"
            />
            <h3 className="text-center text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-wide">
              НАШИ ИГРЫ
            </h3>
            <img
              src="/csgo-logo.png"
              alt="CS:GO logo"
              className="w-[52px] h-[52px] object-contain 
                         filter drop-shadow-[0_0_6px_rgba(255,255,255,0.85)] 
                         bg-black/30 rounded-lg p-1"
            />
          </div>

          <ul className="feature-list grid gap-4 text-[16px] md:text-[18px] leading-relaxed">
            <li>⚔️ Игры различных типов (1 на 1, 5 на 5)</li>
            <li>🔍 Поиск команды или игроков в твою команду</li>
            <li>🏆 Различные турниры как с призовым фондом, так и без</li>
            <li>📊 Подбор игроков на основе вашего MMR</li>
            <li>🚫 Встроенная защита от смурфов и злоупотреблений</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
