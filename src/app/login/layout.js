export const dynamic = 'force-dynamic';

export default function LoginLayout({ children }) {
  // Маркер ".login-page" позволит глобально отключить неон-тему именно на /login
  return <div className="login-page">{children}</div>;
}
