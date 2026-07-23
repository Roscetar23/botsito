'use client';

import type { AvatarState } from '@asistente/avatar-model';
import { Avatar3DLazy } from '../avatar-3d-lazy';
import { ViewBoundary } from '../view-boundary';
import type { PressHand, RobotTarget } from './robot-target';
import styles from './tasks.module.css';

interface TasksRobotProps {
  target: RobotTarget;
  /** Nonce de disparo único: cada valor nuevo hace UNA vez el gesto de toque. */
  pressTrigger?: number;
  /** Lado de la pantalla con el que toca (lado de la card que empuja). */
  pressHand?: PressHand;
  /** Velocidad del ease del roam; `undefined` = normal. Lenta solo al volver al reposo. */
  easeSpeed?: number;
  /** Expresión del robot; la decide `useTasksRobot` (no hay realtime propio aquí). */
  state: AvatarState;
}

// Mismos valores que `calendar/calendar-robot.tsx`: mismo tamaño/encuadre en
// todas las vistas (ver ahí el porqué de la pareja fov/cameraZ).
const CAMERA_FOV = 15;
const CAMERA_Z = 52;

/**
 * Robot 3D decorativo sobre el tablero de tareas: flota en reposo arriba y
 * viaja hasta la card que va por delante de su columna para "empujarla" a la
 * columna correcta (coreografía en `useTasksRobot`, fuera de esta capa). Capa
 * `absolute` con `pointer-events: none` para no robar clics/drag a las
 * cards; aislada en su propio `ViewBoundary` con fallback silencioso: un
 * fallo del WebGL aquí nunca debe tumbar el tablero ni notarse.
 */
export function TasksRobot({ target, pressTrigger, pressHand, easeSpeed, state }: TasksRobotProps) {
  return (
    <div className={styles.robotLayer} aria-hidden="true">
      <ViewBoundary name="El robot del tablero" fallback={null}>
        <Avatar3DLazy
          fullscreen
          roam
          walk={false}
          faceCamera
          fov={CAMERA_FOV}
          cameraZ={CAMERA_Z}
          target={target}
          pressTrigger={pressTrigger}
          pressHand={pressHand}
          roamEaseSpeed={easeSpeed}
          state={state}
          playClip={false}
        />
      </ViewBoundary>
    </div>
  );
}
