'use client';

import dynamic from 'next/dynamic';
import styles from './tasks.module.css';

/**
 * El tablero de tareas se monta **solo en cliente**: depende del token de
 * sesión (`useAuth`) y de llamadas a la API, así que no aporta nada
 * renderizarlo en el servidor. Además, carga diferida = su código no viaja
 * con la vista Inicio (§2.1 de FRONTEND.md).
 */
export const TasksLazy = dynamic(
  () => import('./tasks-board').then((m) => ({ default: m.TasksBoard })),
  {
    ssr: false,
    loading: () => <p className={styles.loading}>Cargando tareas…</p>,
  },
);
