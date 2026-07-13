'use client';

import { useEffect, useRef } from 'react';

const MAX_ROTATION_RAD = 0.35;

export interface PointerRotationTarget {
  current: { x: number; y: number };
}

function clamp(value: number, limit: number): number {
  return Math.min(Math.max(value, -limit), limit);
}

/**
 * Objetivo de rotación (rad) según la posición del cursor en toda la
 * ventana (`pointermove` en `window`), clamp a ±0.35 rad. Devuelve una
 * ref viva (no state) para que un `useFrame` la lea cada frame y la
 * suavice con lerp sin re-renderizar React en cada movimiento del mouse.
 * Con `enabled=false` (reduced-motion o `interactive=false`) el objetivo
 * queda en `{ x: 0, y: 0 }`.
 *
 * Nota de signos: `y` (yaw) sigue la posición horizontal del cursor y `x`
 * (pitch) la vertical, en el mismo sentido (cursor arriba → mira arriba).
 * Este signo de `x` está calibrado para la orientación real del GLB
 * (`botcito.glb`): con `-normalizedY` miraba al revés en vertical.
 */
export function usePointerRotation(enabled: boolean): PointerRotationTarget {
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) {
      target.current = { x: 0, y: 0 };
      return;
    }

    function handlePointerMove(event: PointerEvent): void {
      const normalizedX = (event.clientX / window.innerWidth) * 2 - 1;
      const normalizedY = (event.clientY / window.innerHeight) * 2 - 1;
      target.current = {
        x: clamp(normalizedY * MAX_ROTATION_RAD, MAX_ROTATION_RAD),
        y: clamp(normalizedX * MAX_ROTATION_RAD, MAX_ROTATION_RAD),
      };
    }

    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [enabled]);

  return target;
}
