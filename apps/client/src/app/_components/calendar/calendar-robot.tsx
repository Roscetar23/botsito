'use client';

import { Avatar3DLazy } from '../avatar-3d-lazy';
import { ViewBoundary } from '../view-boundary';
import styles from './calendar.module.css';

/**
 * Punto de reposo del robot, normalizado al rect del canvas
 * (x: -1 izq. → 1 der.; y: -1 arriba → 1 abajo). Arriba a la derecha para
 * flotar sobre el calendario sin tapar el título "Calendario de {mes}.".
 * Constante fácil de tunear a ojo.
 */
const REST_TARGET = { x: 0.6, y: -0.8 };

/**
 * Robot 3D decorativo flotando en reposo sobre el calendario (sin
 * interacción todavía: eso es el paso siguiente). Capa `absolute` con
 * `pointer-events: none` para no robar clics a las celdas de día, aislada en
 * su propio `ViewBoundary` con fallback silencioso: un fallo del WebGL aquí
 * nunca debe tumbar el calendario ni notarse.
 */
export function CalendarRobot() {
  return (
    <div className={styles.robotLayer} aria-hidden="true">
      <ViewBoundary name="El robot del calendario" fallback={null}>
        <Avatar3DLazy fullscreen roam target={REST_TARGET} state="idle" playClip={false} />
      </ViewBoundary>
    </div>
  );
}
