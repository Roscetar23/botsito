/** Usuario autenticado inyectado en la request tras validar el JWT (req.user). */
export interface AuthenticatedUser {
  userId: string;
  email: string;
}
