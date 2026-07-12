'use client';

import type { ReactNode } from 'react';
import { AuthProvider, AuthPanel, useAuth } from '@asistente/auth-ui';
import { BrandLogo } from './brand-logo';
import styles from './app-shell.module.css';

/**
 * Envuelve la app con la sesión y **puertea el acceso**: mientras carga
 * muestra un aviso; sin sesión, la pantalla de acceso de marca (logo +
 * `AuthPanel` + footer); con sesión, una barra con el usuario + "salir" y
 * el contenido (el avatar). El `accessToken` de `useAuth` alimentará el
 * socket realtime (Fase 3).
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthGate>{children}</AuthGate>
    </AuthProvider>
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
      <div className={styles.authScreen}>
        <div className={styles.glow} aria-hidden="true" />
        <header className={styles.topbar}>
          <BrandLogo />
        </header>
        <main className={styles.authMain}>
          <AuthPanel />
        </main>
        <footer className={styles.footer}>
          <span>© 2026 BotCito</span>
          <span className={styles.muted}>Tu asistente casi inteligente</span>
        </footer>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <header className={styles.topbar}>
        <BrandLogo />
        <span className={styles.session}>
          <span className={styles.muted}>{user.displayName || user.email}</span>
          <button type="button" className={styles.logout} onClick={logout}>
            Salir
          </button>
        </span>
      </header>
      {children}
    </div>
  );
}
