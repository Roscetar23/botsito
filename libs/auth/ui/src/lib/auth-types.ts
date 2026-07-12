/** Tipos del cliente de auth (espejo del contrato del backend NestJS). */

/** Usuario devuelto por el backend (sin `passwordHash`). */
export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
}

/** Par de tokens JWT (el refresh **rota** en cada refresh). */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Respuesta de `register`/`login`. */
export interface AuthResult {
  user: AuthUser;
  tokens: AuthTokens;
}

/** Credenciales de login. */
export interface LoginInput {
  email: string;
  password: string;
}

/** Datos de registro (`displayName` opcional). */
export interface RegisterInput {
  email: string;
  password: string;
  displayName?: string;
}

/** Error del cliente de auth con el status HTTP y un mensaje legible. */
export class AuthApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}
