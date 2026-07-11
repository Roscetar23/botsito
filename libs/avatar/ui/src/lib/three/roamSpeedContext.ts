'use client';

import { createContext, useContext } from 'react';
import type { MutableRefObject } from 'react';

/**
 * Velocidad de desplazamiento del muñeco mientras deambula, normalizada
 * a 0..1 (0 = quieto, 1 = a tope), compartida como **ref** (no estado) para
 * poder leerla cada frame desde un `useFrame` sin re-renderizar.
 *
 * La provee `RoamGroup` (que conoce el movimiento real) y la consumen los
 * gestos que dependen del movimiento (p. ej. `useWalkSwing` en las manos).
 * `null` fuera de un `RoamGroup` (modo "caja") → esos gestos se desactivan.
 */
export const RoamSpeedContext = createContext<MutableRefObject<number> | null>(null);

/** Lee el ref de velocidad de roam (o `null` si no hay `RoamGroup` arriba). */
export function useRoamSpeed(): MutableRefObject<number> | null {
  return useContext(RoamSpeedContext);
}
