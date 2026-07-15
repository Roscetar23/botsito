'use client';

import dynamic from 'next/dynamic';
import styles from './calendar.module.css';

/**
 * El calendario se monta **solo en cliente**: la rejilla depende de la fecha
 * local del navegador ("hoy", zona horaria), y renderizarla en el servidor
 * daría un HTML distinto al del cliente cuando sus husos no coinciden. Además,
 * carga diferida = su código no viaja con la vista Inicio (§2.1 de FRONTEND.md).
 */
export const CalendarLazy = dynamic(
  () => import('./calendar-view').then((m) => ({ default: m.CalendarView })),
  {
    ssr: false,
    loading: () => <p className={styles.loading}>Cargando calendario…</p>,
  },
);
