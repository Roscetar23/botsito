import { AuthApiError } from './auth-types.js';
import type {
  AuthResult,
  AuthTokens,
  AuthUser,
  LoginInput,
  RegisterInput,
} from './auth-types.js';

/** Base de la API (Next inyecta `NEXT_PUBLIC_*`); fallback al backend en :3001. */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

/** Extrae un mensaje legible del cuerpo de error estándar de Nest. */
function messageFrom(body: unknown, fallback: string): string {
  const message = (body as { message?: unknown } | null)?.message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string') return message;
  return fallback;
}

/** `fetch` JSON con manejo de errores → `AuthApiError` en respuestas !ok. */
async function request<T>(path: string, init: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    });
  } catch {
    throw new AuthApiError('No se pudo conectar con el servidor', 0);
  }
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    throw new AuthApiError(messageFrom(body, 'Error de autenticación'), res.status);
  }
  return body as T;
}

export function apiRegister(input: RegisterInput): Promise<AuthResult> {
  return request<AuthResult>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function apiLogin(input: LoginInput): Promise<AuthResult> {
  return request<AuthResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function apiRefresh(refreshToken: string): Promise<AuthTokens> {
  const { tokens } = await request<{ tokens: AuthTokens }>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
  return tokens;
}

export function apiMe(accessToken: string): Promise<AuthUser> {
  return request<AuthUser>('/auth/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
