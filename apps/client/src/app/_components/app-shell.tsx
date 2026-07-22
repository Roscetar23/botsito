'use client';

import type { ReactNode } from 'react';
import { AuthProvider, AuthPanel, useAuth } from '@asistente/auth-ui';
import { AccessPanel } from './access-panel';
import { ThemeProvider } from './theme';
import { ThemeToggle } from './theme-toggle';
import { HomeView } from './home/home-view';
import { RealtimeProvider } from './realtime/realtime-provider';
import styles from './app-shell.module.css';

/**
 * Envuelve la app con tema + sesión y **puertea el acceso**: sin sesión,
 * pantalla split (panel de marca + modelo 3D a la izquierda, formulario a la
 * derecha con logo y toggle de tema); con sesión, la Home (barra lateral +
 * topbar + contenido) envuelta en `RealtimeProvider`, que conecta el socket
 * de recordatorios con el `accessToken` de `useAuth` y monta los toasts
 * in-app (app-wide: funciona en cualquier vista, no solo el Calendario).
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

  return (
    <RealtimeProvider>
      <HomeView>{children}</HomeView>
    </RealtimeProvider>
  );
}
