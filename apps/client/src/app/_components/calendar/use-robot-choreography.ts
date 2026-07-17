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

/**
 * Mano según el lado del objetivo: `.card`/los botones ocupan el ancho de
 * `.view`, así que su centro geométrico (x=0) separa la mitad izquierda de
 * la derecha (en la rejilla, ~la columna central). `x<0` → izquierda, si no
 * → derecha; en el umbral cualquier mano vale.
 */
function pressHandFor(x: number): PressHand {
  return x < 0 ? 'left' : 'right';
}

/**
 * Reposo: arriba del todo, pegado a la derecha. `y:-1` es el borde superior
 * exacto del canvas (amplitud completa en modo `target`); `-0.92` lo deja
 * casi arriba sin clipar contra el `overflow:hidden` de `.robotLayer`.
 * `x:0.6`: a la derecha, afinado a ojo con el usuario.
 */
export const REST_TARGET: RobotTarget = { x: 0.6, y: -0.92 };

/**
 * Con el modal abierto: el robot se aparta a su izquierda para no taparlo.
 * El modal es `fixed`, centrado en el **viewport** (`max-width:430px`), pero
 * los targets se normalizan contra `.view` (arranca a la derecha de la
 * barra lateral). Con barra ~240px y viewport ~1440px: centro del viewport
 * en coordenadas de `.view` ≈ `x:-0.2`, borde izquierdo del modal ≈
 * `x:-0.56`. `x:-0.75` queda claramente a su izquierda — estimación
 * dependiente del ancho real de barra/viewport, fácil de retocar.
 */
export const MODAL_TARGET: RobotTarget = { x: -0.75, y: -0.1 };

// Ease del roam exponencial (τ≈0.55s): a ~520ms ya lee como "llegó". Tras el
// toque, un respiro corto antes de resolver (abrir/cerrar).
const TRAVEL_MS = 520;
const PRESS_MS = 180;

function targetFromRect(cellRect: DOMRect, layerRect: DOMRect | null): RobotTarget {
  if (!layerRect || layerRect.width === 0 || layerRect.height === 0) return REST_TARGET;
  const cellCenterX = cellRect.left + cellRect.width / 2;
  const cellCenterY = cellRect.top + cellRect.height / 2;
  return {
    x: ((cellCenterX - layerRect.left) / layerRect.width) * 2 - 1,
    y: ((cellCenterY - layerRect.top) / layerRect.height) * 2 - 1,
  };
}

/**
 * Orquesta la coreografía del robot, al abrir y al cerrar el modal: viaja al
 * objetivo (celda o botón), lo "toca" y con ese toque resuelve la acción,
 * vía `runPressChoreography` (compartida). Los timers viven aquí, fuera de
 * la capa 3D (`CalendarRobot`, con su propio `ViewBoundary`): un fallo del
 * WebGL nunca bloquea abrir ni cerrar. Con `prefers-reduced-motion` (mismo
 * mecanismo que el rig del avatar), o al cerrar sin botón concreto
 * (Escape/click fuera), se salta la coreografía: acción inmediata.
 */
export function useRobotChoreography() {
  const viewRef = useRef<HTMLElement>(null);
  const timersRef = useRef<{ press?: ReturnType<typeof setTimeout>; open?: ReturnType<typeof setTimeout> }>({});
  const reducedMotion = Boolean(useReducedMotion());

  const [selected, setSelected] = useState<CalendarDay | null>(null);
  const [robotTarget, setRobotTarget] = useState<RobotTarget>(REST_TARGET);
  const [pressTrigger, setPressTrigger] = useState<number>();
  const [pressHand, setPressHand] = useState<PressHand>('right');

  const clearTimers = useCallback(() => {
    if (timersRef.current.press) clearTimeout(timersRef.current.press);
    if (timersRef.current.open) clearTimeout(timersRef.current.open);
    timersRef.current = {};
  }, []);

  useEffect(() => clearTimers, [clearTimers]); // limpia timers al desmontar

  // Mecánica compartida: fija target+mano (síncrono), a TRAVEL_MS dispara el
  // toque y PRESS_MS después resuelve. No limpia timers: el llamador ya hizo
  // `clearTimers()` (re-entrancia). `hand` opcional fuerza la mano; por
  // defecto se elige por el lado del objetivo (`pressHandFor`).
  const runPressChoreography = useCallback(
    (target: RobotTarget, onResolve: () => void, hand?: PressHand) => {
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
        setSelected(null);
        setRobotTarget(REST_TARGET);
        return;
      }

      // Cerrar siempre con la mano derecha de pantalla (`Hueso.001`),
      // independientemente de dónde caiga el botón (decisión del usuario;
      // abrir sí elige la mano por el lado del día).
      const buttonTarget = targetFromRect(rect, viewRef.current?.getBoundingClientRect() ?? null);
      runPressChoreography(
        buttonTarget,
        () => {
          setSelected(null);
          setRobotTarget(REST_TARGET);
        },
        'right',
      );
    },
    [clearTimers, reducedMotion, runPressChoreography],
  );

  return { viewRef, selected, robotTarget, pressTrigger, pressHand, handleSelectDay, handleCloseModal };
}
