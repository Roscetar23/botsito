import './global.css';
import { Exo_2 } from 'next/font/google';

/** Exo 2: tipografía de marca para toda la app (expuesta como `--font-exo2`). */
const exo2 = Exo_2({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-exo2',
  display: 'swap',
});

export const metadata = {
  title: 'BotCito',
  description: 'Tu asistente virtual con un avatar casi inteligente.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={exo2.variable} data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
