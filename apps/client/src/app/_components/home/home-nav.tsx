'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './home.module.css';

interface HomeNavProps {
  collapsed: boolean;
}

/** Rutas de la barra lateral. El icono se pinta por `key`. */
const ITEMS = [
  { href: '/', label: 'Inicio', icon: HomeIcon },
  { href: '/calendario', label: 'Calendario', icon: CalendarIcon },
  { href: '/tareas', label: 'Tareas', icon: TasksIcon },
] as const;

/**
 * Navegación de la Home. El item activo se deriva de la URL (`usePathname`),
 * no de estado local, para que sobreviva a recargas y al botón "atrás".
 * Colapsada, se ocultan las etiquetas y quedan solo los iconos con
 * `title`/`aria-label` de tooltip.
 */
export function HomeNav({ collapsed }: HomeNavProps) {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Navegación principal">
      {!collapsed && <p className={styles.navSectionLabel}>Espacio de trabajo</p>}
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`${styles.navItem} ${active ? styles.navItemActive : ''}`.trim()}
            aria-current={active ? 'page' : undefined}
            aria-label={label}
            title={label}
          >
            <Icon />
            {!collapsed && <span>{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function HomeIcon() {
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
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function CalendarIcon() {
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
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function TasksIcon() {
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
      <rect x="3" y="4" width="5.5" height="16" rx="1.3" />
      <rect x="9.5" y="4" width="5.5" height="10" rx="1.3" />
      <rect x="16" y="4" width="5.5" height="13" rx="1.3" />
    </svg>
  );
}
