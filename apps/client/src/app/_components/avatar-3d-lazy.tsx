'use client';

import dynamic from 'next/dynamic';
import styles from './avatar-playground.module.css';

/**
 * `Avatar3D` usa React Three Fiber (WebGL) y no puede renderizar en SSR, así
 * que se carga solo en cliente. Mantenlo en su propio archivo para que
 * `avatar-playground.tsx` nunca importe `@asistente/avatar-ui#Avatar3D` de
 * forma estática (eso arrastraría `three` al bundle/SSR del servidor).
 */
export const Avatar3DLazy = dynamic(
  () => import('@asistente/avatar-ui').then((m) => ({ default: m.Avatar3D })),
  {
    ssr: false,
    loading: () => <div className={styles.loading3d}>Cargando 3D…</div>,
  },
);
