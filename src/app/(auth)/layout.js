// src/app/(auth)/layout.js
export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }) {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            header, footer { display:none !important; }
          `,
        }}
      />
      <div className="login-page">{children}</div>
    </>
  );
}
