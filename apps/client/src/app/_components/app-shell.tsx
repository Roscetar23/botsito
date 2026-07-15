'use client';

import type { ReactNode } from 'react';
import { AuthProvider, AuthPanel, useAuth } from '@asistente/auth-ui';
import { BrandLogo } from './brand-logo';
import { AccessPanel } from './access-panel';
import { ThemeProvider } from './theme';
import { ThemeToggle } from './theme-toggle';
import styles from './app-shell.module.css';

/**
 * Envuelve la app con tema + sesión y **puertea el acceso**: sin sesión,
 * pantalla split (panel de marca + modelo 3D a la izquierda, formulario a la
 * derecha con logo y toggle de tema); con sesión, una barra con el usuario,
 * el toggle y "salir". El `accessToken` de `useAuth` alimentará el realtime.
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
  const { status, user, logout } = useAuth();

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
            <BrandLogo height={40} />
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
    <div className={styles.app}>
      <header className={styles.topbar}>
        <BrandLogo />
        <span className={styles.session}>
          <span className={styles.muted}>{user.displayName || user.email}</span>
          <ThemeToggle />
          <button type="button" className={styles.logout} onClick={logout}>
            Salir
          </button>
        </span>
      </header>
      {children}
    </div>
  );
}
