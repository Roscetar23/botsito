'use client';

import { ThemeToggle } from '../theme-toggle';
import styles from './home.module.css';

/** Topbar mínima de la Home: solo el toggle de tema, alineado a la derecha. */
export function HomeTopbar() {
  return (
    <header className={styles.topbar}>
      <ThemeToggle />
    </header>
  );
}
