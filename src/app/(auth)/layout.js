// src/app/(auth)/layout.js
export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }) {
  return (
    <>
      {/* Глобально глушим хедер/футер и декорации только в auth-группе */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            header, footer, hr { display:none !important; }
            *::before, *::after {
              content:none !important; border:0 !important;
              box-shadow:none !important; background-image:none !important;
            }
          `,
        }}
      />
      <div className="login-page">{children}</div>
    </>
  );
}
