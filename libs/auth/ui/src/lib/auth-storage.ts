import type { AuthTokens } from './auth-types.js';

/**
 * Persistencia de los tokens en `localStorage`. SSR-safe (chequea
 * `window`), así importarlo desde componentes de servidor no rompe.
 * Nota: `localStorage` es simple para el MVP; si más adelante se quiere
 * mitigar XSS, migrar el refresh token a una cookie httpOnly del backend.
 */
const ACCESS_KEY = 'asistente.accessToken';
const REFRESH_KEY = 'asistente.refreshToken';

export function loadTokens(): AuthTokens | null {
  if (typeof window === 'undefined') return null;
  const accessToken = window.localStorage.getItem(ACCESS_KEY);
  const refreshToken = window.localStorage.getItem(REFRESH_KEY);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export function saveTokens(tokens: AuthTokens): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  window.localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}
