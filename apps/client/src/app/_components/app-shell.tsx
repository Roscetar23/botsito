'use client';

import type { ReactNode } from 'react';
import { AuthProvider, AuthPanel, useAuth } from '@asistente/auth-ui';
import styles from './app-shell.module.css';

/**
 * Envuelve la app con la sesión y **puertea el acceso**: mientras carga
 * muestra un aviso; sin sesión, el `AuthPanel` (login/registro); con
 * sesión, una cabecera con el usuario + "salir" y el contenido (el avatar).
 * El `accessToken` de `useAuth` alimentará el socket realtime (Fase 3).
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
      <div className={styles.centered}>
        <AuthPanel />
      </div>
    );
  }

  return (
    <>
      <header className={styles.header}>
        <span className={styles.user}>
          Sesión: <strong>{user.displayName || user.email}</strong>
        </span>
        <button type="button" className={styles.logout} onClick={logout}>
          Salir
        </button>
      </header>
      {children}
    </>
  );
}
