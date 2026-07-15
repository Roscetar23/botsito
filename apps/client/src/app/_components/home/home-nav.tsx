'use client';

import styles from './home.module.css';

interface HomeNavProps {
  collapsed: boolean;
}

/**
 * Navegación de la Home: "Inicio" (activo/resaltado por ahora, siempre) y
 * "Calendario" (inactivo, todavía sin ruta). Colapsada, se ocultan las
 * etiquetas y quedan solo los iconos con `title`/`aria-label` de tooltip.
 */
export function HomeNav({ collapsed }: HomeNavProps) {
  return (
    <nav className={styles.nav} aria-label="Navegación principal">
      <button
        type="button"
        className={`${styles.navItem} ${styles.navItemActive}`}
        aria-current="page"
        aria-label="Inicio"
        title="Inicio"
      >
        <HomeIcon />
        {!collapsed && <span>Inicio</span>}
      </button>
      <button type="button" className={styles.navItem} aria-label="Calendario" title="Calendario">
        <CalendarIcon />
        {!collapsed && <span>Calendario</span>}
      </button>
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
