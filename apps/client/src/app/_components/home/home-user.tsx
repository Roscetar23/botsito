'use client';

import type { AuthUser } from '@asistente/auth-ui';
import styles from './home.module.css';

interface HomeUserProps {
  collapsed: boolean;
  user: AuthUser;
  onLogout: () => void;
}

/** Deriva iniciales (1-2 letras) del nombre real (o email si no hay nombre). */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

/**
 * Pie de la barra lateral: círculo de iniciales + nombre (con el email como
 * subtítulo atenuado si hay `displayName` y difiere del email) y el botón
 * de cerrar sesión. Colapsada, solo quedan el círculo y el icono de salir.
 */
export function HomeUser({ collapsed, user, onLogout }: HomeUserProps) {
  const name = user.displayName || user.email;
  const showEmail = Boolean(user.displayName) && user.displayName !== user.email;

  return (
    <div className={styles.userBlock}>
      <div className={styles.userInfo} title={name}>
        <span className={styles.avatarInitials} aria-hidden="true">
          {getInitials(name)}
        </span>
        {!collapsed && (
          <span className={styles.userText}>
            <span className={styles.userName}>{name}</span>
            {showEmail && <span className={styles.userEmail}>{user.email}</span>}
          </span>
        )}
      </div>

      <button
        type="button"
        className={styles.logoutButton}
        onClick={onLogout}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
      >
        <LogoutIcon />
        {!collapsed && <span>Cerrar sesión</span>}
      </button>
    </div>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </svg>
  );
}
