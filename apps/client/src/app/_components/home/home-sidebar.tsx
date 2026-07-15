'use client';

import type { AuthUser } from '@asistente/auth-ui';
import { BrandLogo } from '../brand-logo';
import { HomeNav } from './home-nav';
import { HomeUser } from './home-user';
import styles from './home.module.css';

interface HomeSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  user: AuthUser;
  onLogout: () => void;
}

/**
 * Barra lateral full-height: fila de marca (logo + chevron de colapso),
 * navegación y el bloque de usuario anclado al fondo. Expandida ~240px;
 * colapsada, un riel de iconos ~64px (nunca se oculta del todo).
 */
export function HomeSidebar({ collapsed, onToggle, user, onLogout }: HomeSidebarProps) {
  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`.trim()}>
      <div className={styles.brandRow}>
        {collapsed ? <BrandLogo variant="icon" height={28} /> : <BrandLogo height={32} />}
        <button
          type="button"
          className={styles.chevronButton}
          onClick={onToggle}
          aria-label={collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      <HomeNav collapsed={collapsed} />
      <HomeUser collapsed={collapsed} user={user} onLogout={onLogout} />
    </aside>
  );
}
