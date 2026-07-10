'use client';

import { BREATHE_PERIOD_S } from '../animation/timings.js';

export interface BreathingMotion {
  animate: { scale: number[]; y: number[] };
  transition: { duration: number; repeat: number; ease: 'easeInOut' };
}

/**
 * Respiración idle: escala ~1↔1.02 + leve translateY, en bucle infinito.
 * Se aplica al contenedor completo (no por parte) para que todas las capas
 * respiren juntas sin desalinearse. Devuelve `undefined` si está deshabilitada
 * (p. ej. `prefers-reduced-motion`), en cuyo caso el llamador no debe animar.
 */
export function useBreathing(enabled = true): BreathingMotion | undefined {
  if (!enabled) return undefined;

  return {
    animate: { scale: [1, 1.02, 1], y: [0, -3, 0] },
    transition: { duration: BREATHE_PERIOD_S, repeat: Infinity, ease: 'easeInOut' },
  };
}
