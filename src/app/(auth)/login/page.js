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
      {/* кнопка входа в правом верхнем углу */}
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

        {/* слоган в ДВЕ строки */}
        <p className="hero-subtitle mx-auto mt-6 max-w-5xl text-white/90 drop-shadow text-[22px] md:text-[28px] lg:text-[32px] leading-tight">
          Заходи к нам и используй свой скил,<br />
          чтобы зарабатывать деньги играя в любимые игры
        </p>

        {/* центральная жёлтая кнопка */}
        <a href="/steam-login" className="hero-cta inline-flex items-center justify-center mt-8">
          LOGIN STEAM
        </a>
      </section>

      {/* КАРТОЧКА «Наши игры» */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 mt-80">
        <div className="features-card lava-card allow-border mx-auto w-full max-w-[980px] p-6 md:p-8">
          {/* ЛОГОТИПЫ — ВЕРХНИЕ УГЛЫ КАРТОЧКИ */}
          <img
            src="/dota-logo.png"
            alt="Dota 2 logo"
            className="card-logo-left"
            width={52}
            height={52}
          />
          <img
            src="/csgo-logo.png"
            alt="CS:GO logo"
            className="card-logo-right"
            width={52}
            height={52}
          />

          {/* ЗАГОЛОВОК — ВЫШЕ И БОЛЬШЕ, НА УРОВНЕ ЛОГОТИПОВ */}
          <h3 className="card-title text-center font-extrabold tracking-wide text-2xl md:text-3xl lg:text-4xl">
            НАШИ ИГРЫ
          </h3>
          <ul className="flex flex-col items-center gap-4 text-[20px] md:text-[22px] lg:text-[24px] leading-relaxed">
  <li>⚔️ <strong>Игры различных типов</strong> (1 на 1, 5 на 5)</li>
  <li>🔍 <strong>Поиск команды</strong> или игроков в твою команду</li>
  <li>🏆 <strong>Различные турниры</strong> как с призовым фондом, так и без</li>
  <li>📊 <strong>Подбор игроков</strong> на основе вашего MMR</li>
  <li>🚫 <strong>Встроенная защита</strong> от смурфов и злоупотреблений</li>
</ul>

        </div>
      </section>
    </div>
  );
}
