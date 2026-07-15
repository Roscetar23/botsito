'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@asistente/auth-ui';
import { HomeSidebar } from './home-sidebar';
import { HomeTopbar } from './home-topbar';
import { ViewBoundary } from '../view-boundary';
import styles from './home.module.css';

/**
 * Raíz de la Home autenticada: barra lateral colapsable + columna principal
 * (topbar mínima + contenido). El estado de colapso vive aquí porque lo
 * necesitan tanto la barra (su ancho) como sus hijos (mostrar/ocultar
 * etiquetas). El contenido (`children`, hoy el placeholder del
 * visualizador) queda aislado en un `ViewBoundary` para que un fallo ahí no
 * tumbe el resto de la Home.
 */
export function HomeView({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // Defensivo: `AuthGate` solo renderiza `HomeView` cuando hay sesión, pero
  // el tipo de `user` sigue siendo `AuthUser | null` para TypeScript.
  if (!user) return null;

  return (
    <div className={styles.shell}>
      <HomeSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        user={user}
        onLogout={logout}
      />
      <div className={styles.main}>
        <HomeTopbar />
        <main className={styles.content}>
          <ViewBoundary name="Visualizador">{children}</ViewBoundary>
        </main>
      </div>
    </div>
  );
}
