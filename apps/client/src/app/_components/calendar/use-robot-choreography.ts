'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { CalendarDay } from './calendar-dates';

/** Coordenadas normalizadas al rect del canvas (x: -1 izq → 1 der; y: -1 arriba → 1 abajo). */
export interface RobotTarget {
  x: number;
  y: number;
}

/** Lado de la PANTALLA (del espectador) con el que se toca. */
export type PressHand = 'left' | 'right';

/** `.card` ocupa el ancho de `.view`, así que su centro (x=0) separa la
 * mitad izquierda de la rejilla de la derecha. `x<0` → izquierda, si no →
 * derecha (umbral: cualquier mano vale). */
function pressHandFor(x: number): PressHand {
  return x < 0 ? 'left' : 'right';
}

/** Reposo: arriba del todo, a la derecha. `y:-1` es el borde superior exacto
 * (amplitud completa en `target`); `-0.92` casi arriba sin clipar contra
 * `overflow:hidden` de `.robotLayer`. `x:0.6` afinado a ojo. */
export const REST_TARGET: RobotTarget = { x: 0.6, y: -0.92 };

/** Con el modal abierto, el robot se aparta a su izquierda. El modal es
 * `fixed`, centrado en el viewport (no en `.view`, que arranca tras la barra
 * lateral ~240px): con viewport ~1440px, su borde izquierdo cae en
 * `x≈-0.56` en coordenadas de `.view`. `x:-0.75` queda claro a su
 * izquierda — estimación fácil de retocar si cambian esos anchos. */
export const MODAL_TARGET: RobotTarget = { x: -0.75, y: -0.1 };

// Ease exponencial (τ≈0.55s): a ~520ms ya lee como "llegó". Tras el toque,
// un respiro corto antes de resolver (abrir/cerrar).
const TRAVEL_MS = 520;
const PRESS_MS = 180;

// `roamEaseSpeed`: `undefined`=default de la lib (1.8 → τ≈0.55s). Solo la
// VUELTA AL REPOSO es más lenta: 0.8 → τ≈1.25s (~2×). El viaje (abrir o al
// botón) usa la normal: `runPressChoreography` resetea `easeSpeed` al empezar.
const REST_EASE_SLOW = 0.8;

function targetFromRect(cellRect: DOMRect, layerRect: DOMRect | null): RobotTarget {
  if (!layerRect || layerRect.width === 0 || layerRect.height === 0) return REST_TARGET;
  const cellCenterX = cellRect.left + cellRect.width / 2;
  const cellCenterY = cellRect.top + cellRect.height / 2;
  return {
    x: ((cellCenterX - layerRect.left) / layerRect.width) * 2 - 1,
    y: ((cellCenterY - layerRect.top) / layerRect.height) * 2 - 1,
  };
}

/** Orquesta la coreografía al abrir/cerrar el modal: viaja al objetivo
 * (celda o botón), lo "toca" y resuelve, vía `runPressChoreography`
 * (compartida). Los timers viven aquí, fuera de la capa 3D (`CalendarRobot`,
 * con su `ViewBoundary`): un fallo del WebGL nunca bloquea abrir/cerrar. Con
 * reduced motion, o al cerrar sin botón (Escape/click fuera), es inmediato. */
export function useRobotChoreography() {
  const viewRef = useRef<HTMLElement>(null);
  const timersRef = useRef<{ press?: ReturnType<typeof setTimeout>; open?: ReturnType<typeof setTimeout> }>({});
  const reducedMotion = Boolean(useReducedMotion());

  const [selected, setSelected] = useState<CalendarDay | null>(null);
  const [robotTarget, setRobotTarget] = useState<RobotTarget>(REST_TARGET);
  const [pressTrigger, setPressTrigger] = useState<number>();
  const [pressHand, setPressHand] = useState<PressHand>('right');
  const [easeSpeed, setEaseSpeed] = useState<number>();

  const clearTimers = useCallback(() => {
    if (timersRef.current.press) clearTimeout(timersRef.current.press);
    if (timersRef.current.open) clearTimeout(timersRef.current.open);
    timersRef.current = {};
  }, []);

  useEffect(() => clearTimers, [clearTimers]); // limpia timers al desmontar

  // Mecánica compartida: fija target+mano+velocidad normal (síncrono), a
  // TRAVEL_MS dispara el toque y PRESS_MS después resuelve. No limpia
  // timers (el llamador ya hizo `clearTimers()`). `hand` opcional fuerza la
  // mano; si no, se elige por el lado del objetivo (`pressHandFor`).
  const runPressChoreography = useCallback(
    (target: RobotTarget, onResolve: () => void, hand?: PressHand) => {
      setEaseSpeed(undefined);
      setRobotTarget(target);
      setPressHand(hand ?? pressHandFor(target.x));

      timersRef.current.press = setTimeout(() => {
        setPressTrigger((n) => (n ?? 0) + 1);
        timersRef.current.open = setTimeout(onResolve, PRESS_MS);
      }, TRAVEL_MS);
    },
    [],
  );

  const handleSelectDay = useCallback(
    (day: CalendarDay, rect: DOMRect) => {
      // Re-target sin timers zombis: cubre clicar otro día a mitad de viaje
      // y el doble click sobre el mismo.
      clearTimers();

      if (reducedMotion) {
        setSelected(day);
        return;
      }

      const cellTarget = targetFromRect(rect, viewRef.current?.getBoundingClientRect() ?? null);
      runPressChoreography(cellTarget, () => {
        setSelected(day); // el toque abre el modal...
        setRobotTarget(MODAL_TARGET); // ...y el robot se aparta a la izquierda
      });
    },
    [clearTimers, reducedMotion, runPressChoreography],
  );

  const handleCloseModal = useCallback(
    (rect?: DOMRect) => {
      // Cubre cerrar dos veces y Escape/click fuera a mitad del viaje hacia
      // la X/"Cerrar": cierre inmediato, cancela la coreografía de cierre.
      clearTimers();

      if (reducedMotion || !rect) {
        // Batcheadas: la vuelta ya arranca lenta (inofensivo con reduced
        // motion, que apaga el roam).
        setSelected(null);
        setRobotTarget(REST_TARGET);
        setEaseSpeed(REST_EASE_SLOW);
        return;
      }

      // Cerrar siempre con la mano derecha (decisión del usuario; abrir sí
      // elige la mano por el lado del día).
      const buttonTarget = targetFromRect(rect, viewRef.current?.getBoundingClientRect() ?? null);
      runPressChoreography(
        buttonTarget,
        () => {
          // Batcheadas: el toque cierra y la vuelta arranca lenta ya en el mismo tick.
          setSelected(null);
          setRobotTarget(REST_TARGET);
          setEaseSpeed(REST_EASE_SLOW);
        },
        'right',
      );
    },
    [clearTimers, reducedMotion, runPressChoreography],
  );

  return { viewRef, selected, robotTarget, pressTrigger, pressHand, easeSpeed, handleSelectDay, handleCloseModal };
}
