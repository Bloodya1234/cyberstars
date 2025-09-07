// src/app/(auth)/layout.js
export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }) {
  return (
    <>
      {/* Жёстко выключаем любые внешние разделители/тени только для auth-группы */}
      <style
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: `
          header, footer, hr { display:none !important; }
          *::before, *::after { content:none !important; border:0 !important; box-shadow:none !important; background-image:none !important; }
        `,
        }}
      />
      <div className="login-page">{children}</div>
    </>
  );
}
