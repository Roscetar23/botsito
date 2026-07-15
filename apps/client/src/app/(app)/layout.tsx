import type { ReactNode } from 'react';
import { AppShell } from '../_components/app-shell';

/**
 * Layout de las vistas autenticadas: monta el shell (tema + sesión + barra
 * lateral/topbar) una sola vez para todas ellas. Al navegar entre `/` y
 * `/calendario` solo se recrea el contenido del `main`; la barra lateral
 * conserva su estado (p. ej. colapsada) porque no se desmonta.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
