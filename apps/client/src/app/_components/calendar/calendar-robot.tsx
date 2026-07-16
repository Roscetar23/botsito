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
 * Tamaño aparente del robot: con `fov=42°` (el default de `Avatar3D`),
 * `viewport.height ≈ 2·cameraZ·tan(21°) ≈ 0.768·cameraZ`. El robot en roam
 * mide `ROAM_TARGET_HEIGHT = 2` unidades de mundo, así que ocupa
 * `2 / (0.768·cameraZ) ≈ 2.6 / cameraZ` del alto del canvas. El default de
 * la lib (`cameraZ = 9`) da ~29%; `cameraZ = 20` seguía leyéndose "del mismo
 * tamaño" a ojo del usuario. Con `cameraZ = 45` baja a ~5.8% (en una vista
 * de ~940px, ~55px de alto): ahora sí se lee claramente pequeño y
 * decorativo. No afecta al mapeo de `target`: en modo `target` la amplitud
 * es `viewport/2`, que escala igual con `cameraZ`, así que ±1 sigue siendo
 * el borde del canvas.
 */
const CAMERA_Z = 45;

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
          walk={false}
          cameraZ={CAMERA_Z}
          target={target}
          pressTrigger={pressTrigger}
          state="idle"
          playClip={false}
        />
      </ViewBoundary>
    </div>
  );
}
