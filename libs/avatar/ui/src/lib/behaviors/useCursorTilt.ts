'use client';

import { useEffect } from 'react';
import { useReducedMotion, useSpring } from 'framer-motion';
import type { MotionValue } from 'framer-motion';

const MAX_TILT_DEG = 12;
const TILT_SPRING = { stiffness: 120, damping: 20, mass: 0.5 };

export interface CursorTilt {
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
}

function clamp(value: number, limit: number): number {
  return Math.min(Math.max(value, -limit), limit);
}

/**
 * "Mira" al cursor en toda la ventana (`pointermove` en `window`, no solo
 * al pasar por encima del avatar): mapea su posición normalizada (-1..1
 * respecto al centro de la ventana) a una inclinación 3D suavizada por
 * spring (`rotateX`/`rotateY`, clamp ±12°). Sin puntero (touch) o con
 * `enabled=false`/`prefers-reduced-motion`, se mantiene en 0.
 */
export function useCursorTilt(enabled = true): CursorTilt {
  const reducedMotion = useReducedMotion();
  const rotateX = useSpring(0, TILT_SPRING);
  const rotateY = useSpring(0, TILT_SPRING);
  const active = enabled && !reducedMotion;

  useEffect(() => {
    if (!active) {
      rotateX.set(0);
      rotateY.set(0);
      return;
    }

    function handlePointerMove(event: PointerEvent): void {
      const normalizedX = (event.clientX / window.innerWidth) * 2 - 1;
      const normalizedY = (event.clientY / window.innerHeight) * 2 - 1;
      rotateY.set(clamp(normalizedX * MAX_TILT_DEG, MAX_TILT_DEG));
      rotateX.set(clamp(-normalizedY * MAX_TILT_DEG, MAX_TILT_DEG));
    }

    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [active, rotateX, rotateY]);

  return { rotateX, rotateY };
}
