'use client';

import { useEffect, useRef } from 'react';

export interface PointerViewportTarget {
  current: { x: number; y: number };
}

/**
 * Posición normalizada del cursor (-1..1 en cada eje) respecto al centro
 * de la ventana, actualizada en `pointermove` sobre `window` (vigila toda
 * la pantalla, no solo el propio elemento). Con `enabled=false` el
 * objetivo se mantiene en `{ x: 0, y: 0 }` (centro).
 *
 * Devuelve una ref viva (no state) para leerla cada frame desde un
 * `useFrame` sin re-renderizar React en cada movimiento del mouse.
 */
export function usePointerViewportTarget(enabled: boolean): PointerViewportTarget {
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) {
      target.current = { x: 0, y: 0 };
      return;
    }

    function handlePointerMove(event: PointerEvent): void {
      target.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: (event.clientY / window.innerHeight) * 2 - 1,
      };
    }

    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [enabled]);

  return target;
}
