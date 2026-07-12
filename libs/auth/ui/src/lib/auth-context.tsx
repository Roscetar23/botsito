'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { apiLogin, apiMe, apiRefresh, apiRegister } from './auth-api.js';
import { clearTokens, loadTokens, saveTokens } from './auth-storage.js';
import { AuthApiError } from './auth-types.js';
import type { AuthTokens, AuthUser, LoginInput, RegisterInput } from './auth-types.js';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  /** Access token vigente; lo consumen otras features (p. ej. el socket realtime). */
  accessToken: string | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Provee la sesión al árbol: al montar rehidrata desde `localStorage`
 * (validando el access token con `/auth/me`, con **un** intento de refresh
 * si expiró), y expone acciones de login/registro/logout. El `accessToken`
 * se publica para que la Fase 3 (realtime) autentique el handshake.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const applyAuthed = useCallback((nextUser: AuthUser, tokens: AuthTokens) => {
    saveTokens(tokens);
    setUser(nextUser);
    setAccessToken(tokens.accessToken);
    setStatus('authenticated');
  }, []);

  const applyAnon = useCallback(() => {
    clearTokens();
    setUser(null);
    setAccessToken(null);
    setStatus('anonymous');
  }, []);

  useEffect(() => {
    const tokens = loadTokens();
    if (!tokens) {
      setStatus('anonymous');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const me = await apiMe(tokens.accessToken);
        if (!cancelled) applyAuthed(me, tokens);
      } catch (err) {
        if (err instanceof AuthApiError && err.status === 401) {
          try {
            const fresh = await apiRefresh(tokens.refreshToken);
            const me = await apiMe(fresh.accessToken);
            if (!cancelled) applyAuthed(me, fresh);
            return;
          } catch {
            /* refresh falló → sesión anónima */
          }
        }
        if (!cancelled) applyAnon();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyAuthed, applyAnon]);

  const login = useCallback(
    async (input: LoginInput) => {
      const { user: u, tokens } = await apiLogin(input);
      applyAuthed(u, tokens);
    },
    [applyAuthed],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const { user: u, tokens } = await apiRegister(input);
      applyAuthed(u, tokens);
    },
    [applyAuthed],
  );

  return (
    <AuthContext.Provider value={{ status, user, accessToken, login, register, logout: applyAnon }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Accede a la sesión. Debe usarse dentro de `<AuthProvider>`. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
