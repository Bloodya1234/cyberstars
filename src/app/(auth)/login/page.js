// src/app/(auth)/login/page.js
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <div className="login-scope min-h-screen flex items-center justify-center">
      <div className="p-8 rounded-2xl text-white" style={{
        background: 'linear-gradient(135deg, rgba(255,90,54,.2), rgba(255,140,60,.15))',
        border: '1px solid rgba(255,255,255,.12)',
        backdropFilter: 'blur(12px)'
      }}>
        <h1 className="text-3xl font-bold">/login is rendering ✅</h1>
        <p className="mt-2 opacity-80">Если вы это видите — проблема была внутри предыдущего page.js.</p>
      </div>
    </div>
  );
}
