export const dynamic = 'force-dynamic';

export default function LoginLayout({ children }) {
  return (
    <>
      {/* Жёсткий глобальный оверрайд только на /login */}
      <style
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: `
/* убираем хедер/футер/hr и любые неоновые разделители за пределами контента */
header, footer, hr { display: none !important; }

/* на всякий случай отключаем тени/бордеры в верхних контейнерах страницы */
main, body, html, #__next, [data-nextjs-router] {
  box-shadow: none !important;
  border: 0 !important;
  outline: 0 !important;
}

/* обнуляем любые псевдо-элементы, которыми могли рисоваться линии */
*::before, *::after {
  content: none !important;
  border: 0 !important;
  box-shadow: none !important;
  outline: 0 !important;
  background-image: none !important;
}
          `,
        }}
      />
      {/* маркер, чтобы в будущем было проще таргетировать эту страницу */}
      <div className="login-page">{children}</div>
    </>
  );
}
