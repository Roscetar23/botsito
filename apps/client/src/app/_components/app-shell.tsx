'use client';

import type { ReactNode } from 'react';
import { AuthProvider, AuthPanel, useAuth } from '@asistente/auth-ui';
import { AccessPanel } from './access-panel';
import { ThemeProvider } from './theme';
import { ThemeToggle } from './theme-toggle';
import { HomeView } from './home/home-view';
import styles from './app-shell.module.css';

/**
 * Envuelve la app con tema + sesión y **puertea el acceso**: sin sesión,
 * pantalla split (panel de marca + modelo 3D a la izquierda, formulario a la
 * derecha con logo y toggle de tema); con sesión, la Home (barra lateral +
 * topbar + contenido). El `accessToken` de `useAuth` alimentará el realtime.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGate>{children}</AuthGate>
      </AuthProvider>
    </ThemeProvider>
  );
}

function AuthGate({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();

  if (status === 'loading') {
    return (
      <div className={styles.centered}>
        <p className={styles.muted}>Cargando sesión…</p>
      </div>
    );
  }

  if (status !== 'authenticated' || !user) {
    return (
      <div className={styles.split}>
        <AccessPanel />
        <div className={styles.formSide}>
          <div className={styles.formHeader}>
            <ThemeToggle />
          </div>
          <div className={styles.formCenter}>
            <AuthPanel />
          </div>
        </div>
      </div>
    );
  }

  return <HomeView>{children}</HomeView>;
}
