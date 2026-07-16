'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { CalendarDay } from './calendar-dates';

/** Coordenadas normalizadas al rect del canvas (x: -1 izq → 1 der; y: -1 arriba → 1 abajo). */
export interface RobotTarget {
  x: number;
  y: number;
}

/**
 * Reposo: junto a la fila de nombres de día (LUN…DOM), pegado a la derecha.
 * `REST_TARGET` se normaliza contra el rect de TODA `.view` (cabecera de
 * página + tarjeta), así que hay que estimar a qué fracción de ese alto cae
 * la fila de weekdays. De arriba abajo (con la fuente base de 16px):
 *  - `.pageHeader` (eyebrow + `h1` 2rem + subtítulo): ~82px.
 *  - `gap` de `.view`: 1.5rem ≈ 24px.
 *  - `.card` hasta el borde superior de `.weekdays` (borde + `.cardHeader`
 *    con su padding 1.15rem): ~82px.
 *  - `.weekdays` (padding 0.7rem + una línea ~0.68rem): ~36px de alto.
 *  - `.grid`: 6 semanas × 118px ≈ 713px (domina el resto de la altura).
 * Centro de `.weekdays` ≈ (82+24+82+36/2) ≈ 206px de ~940px totales → ~22%
 * desde arriba → `y = 0.22·2 - 1 ≈ -0.55`. `x = 0.82`: claramente a la
 * derecha (la fila cubre todo el ancho de la tarjeta) con margen frente al
 * `overflow:hidden` de `.robotLayer`.
 */
export const REST_TARGET: RobotTarget = { x: 0.82, y: -0.55 };

// El ease del roam es exponencial con constante de tiempo ~0.55s, así que a
// los ~520ms ya lee como "llegó" (el tiempo hasta "cerca" es casi
// independiente de la distancia). Tras el toque, un respiro corto antes de
// abrir el modal para que se lea como "la mano lo empuja".
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
 * Orquesta la coreografía del robot del calendario: al elegir un día, viaja
 * a su celda, la "toca" y con ese toque se abre el modal; al cerrarlo,
 * vuelve al reposo. Los timers viven aquí —fuera de la capa 3D
 * (`CalendarRobot`, que tiene su propio `ViewBoundary`)— así que un fallo
 * del WebGL nunca bloquea la apertura del modal. Con
 * `prefers-reduced-motion` (mismo mecanismo que el rig del avatar) se salta
 * la coreografía: el modal abre al toque, sin esperar el viaje.
 */
export function useRobotChoreography() {
  const viewRef = useRef<HTMLElement>(null);
  const timersRef = useRef<{ press?: ReturnType<typeof setTimeout>; open?: ReturnType<typeof setTimeout> }>({});
  const reducedMotion = Boolean(useReducedMotion());

  const [selected, setSelected] = useState<CalendarDay | null>(null);
  const [robotTarget, setRobotTarget] = useState<RobotTarget>(REST_TARGET);
  const [pressTrigger, setPressTrigger] = useState<number>();

  const clearTimers = useCallback(() => {
    if (timersRef.current.press) clearTimeout(timersRef.current.press);
    if (timersRef.current.open) clearTimeout(timersRef.current.open);
    timersRef.current = {};
  }, []);

  // Limpia los timers al desmontar la vista.
  useEffect(() => clearTimers, [clearTimers]);

  const handleSelectDay = useCallback(
    (day: CalendarDay, rect: DOMRect) => {
      // Cancela cualquier viaje en curso: re-target sin timers zombis (cubre
      // clicar otro día a mitad de viaje y el doble click sobre el mismo).
      clearTimers();

      if (reducedMotion) {
        setSelected(day);
        return;
      }

      setRobotTarget(targetFromRect(rect, viewRef.current?.getBoundingClientRect() ?? null));

      timersRef.current.press = setTimeout(() => {
        setPressTrigger((n) => (n ?? 0) + 1);
        timersRef.current.open = setTimeout(() => setSelected(day), PRESS_MS);
      }, TRAVEL_MS);
    },
    [clearTimers, reducedMotion],
  );

  const handleCloseModal = useCallback(() => {
    setSelected(null);
    setRobotTarget(REST_TARGET);
  }, []);

  return { viewRef, selected, robotTarget, pressTrigger, handleSelectDay, handleCloseModal };
}
