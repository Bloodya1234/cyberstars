// src/app/(auth)/layout.js
export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }) {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            header, footer, hr { display:none !important; }
            *::before, *::after {
              content:none !important; border:0 !important;
              box-shadow:none !important;
            }
          `,
        }}
      />
      <div className="login-page">{children}</div>
    </>
  );
}
