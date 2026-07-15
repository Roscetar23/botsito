'use client';

import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';

export interface PointerViewportTarget {
  current: { x: number; y: number };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Posición normalizada del cursor (-1..1 en cada eje) respecto al **rect
 * del elemento `<canvas>`** del `<Canvas>` de R3F (no de la ventana),
 * actualizada en `pointermove` sobre `window` (vigila toda la pantalla,
 * no solo el propio elemento, así el objetivo llega clamp a los bordes
 * cuando el cursor sale del canvas). Con `enabled=false` el objetivo se
 * mantiene en `{ x: 0, y: 0 }` (centro).
 *
 * Cuando el canvas ocupa toda la ventana (modo pantalla completa) el rect
 * coincide con ella, así que el resultado es idéntico al cálculo previo
 * basado en `window.innerWidth`/`innerHeight`. Esto es lo que permite usar
 * el modo roam también en un canvas acotado (embebido en un área de la
 * pantalla, no a pantalla completa): el cursor se normaliza contra el
 * propio campo del robot, no contra toda la ventana.
 *
 * El rect se lee de `getBoundingClientRect()` una sola vez por cambio de
 * layout (mount/activación, `resize` y `scroll` — este último con
 * `capture` para detectar también el scroll de contenedores ancestros) y
 * se cachea en una ref; el handler de `pointermove` (que puede disparar
 * mucho más a menudo) solo lee esa ref, nunca recalcula el rect.
 *
 * Devuelve una ref viva (no state) para leerla cada frame desde un
 * `useFrame` sin re-renderizar React en cada movimiento del mouse.
 */
export function usePointerViewportTarget(enabled: boolean): PointerViewportTarget {
  const target = useRef({ x: 0, y: 0 });
  const canvasEl = useThree((state) => state.gl.domElement);
  const rectRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    if (!enabled) {
      target.current = { x: 0, y: 0 };
      return;
    }

    function updateRect(): void {
      rectRef.current = canvasEl.getBoundingClientRect();
    }

    function handlePointerMove(event: PointerEvent): void {
      const rect = rectRef.current;
      if (!rect || rect.width === 0 || rect.height === 0) return;
      target.current = {
        x: clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1),
        y: clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1),
      };
    }

    updateRect();
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [enabled, canvasEl]);

  return target;
}
