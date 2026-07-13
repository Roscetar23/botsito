'use client';

import type { ReactNode } from 'react';
import { AuthProvider, AuthPanel, useAuth } from '@asistente/auth-ui';
import { BrandLogo } from './brand-logo';
import { AccessPanel } from './access-panel';
import styles from './app-shell.module.css';

/**
 * Envuelve la app con la sesión y **puertea el acceso**: mientras carga
 * muestra un aviso; sin sesión, la pantalla de acceso split (panel de marca
 * + modelo 3D a la izquierda, formulario a la derecha); con sesión, una
 * barra con el usuario + "salir" y el contenido (el avatar). El
 * `accessToken` de `useAuth` alimentará el socket realtime (Fase 3).
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
      <div className={styles.split}>
        <AccessPanel />
        <div className={styles.formSide}>
          <AuthPanel />
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
          <button type="button" className={styles.logout} onClick={logout}>
            Salir
          </button>
        </span>
      </header>
      {children}
    </div>
  );
}
