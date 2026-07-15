'use client';

import { Avatar3DLazy } from '../avatar-3d-lazy';
import { ViewBoundary } from '../view-boundary';
import type { RobotTarget } from './use-robot-choreography';
import styles from './calendar.module.css';

interface CalendarRobotProps {
  target: RobotTarget;
  /** Nonce de disparo único: cada valor nuevo hace UNA vez el gesto de toque. */
  pressTrigger?: number;
}

/**
 * Robot 3D decorativo sobre el calendario: flota en reposo arriba, viaja a
 * la celda elegida y la "toca" (coreografía orquestada en
 * `useRobotChoreography`, fuera de esta capa). Capa `absolute` con
 * `pointer-events: none` para no robar clics a las celdas de día; aislada en
 * su propio `ViewBoundary` con fallback silencioso: un fallo del WebGL aquí
 * nunca debe tumbar el calendario ni notarse. Por encima del modal
 * (`z-index` en `calendar.module.css`) para que el robot quede visible junto
 * al día mientras el modal está abierto.
 */
export function CalendarRobot({ target, pressTrigger }: CalendarRobotProps) {
  return (
    <div className={styles.robotLayer} aria-hidden="true">
      <ViewBoundary name="El robot del calendario" fallback={null}>
        <Avatar3DLazy
          fullscreen
          roam
          target={target}
          pressTrigger={pressTrigger}
          state="idle"
          playClip={false}
        />
      </ViewBoundary>
    </div>
  );
}
