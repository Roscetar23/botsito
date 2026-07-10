'use client';

import { motion, useReducedMotion, useTransform } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import { BREATHE_PERIOD_S } from '../animation/timings.js';

export interface ShadowProps {
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  size: number;
}

const MAX_TILT_DEG = 12;
const MAX_OFFSET_PX = 10;

/**
 * Sombra de contacto elíptica bajo el personaje: refuerza el volumen
 * desplazándose levemente en sentido contrario a la inclinación del
 * cursor y "respirando" en fase opuesta al cuerpo (se encoge cuando el
 * cuerpo se eleva). Estática con `prefers-reduced-motion` (y cuando el
 * tilt está deshabilitado, `rotateX`/`rotateY` ya llegan en 0).
 */
export function Shadow({ rotateX, rotateY, size }: ShadowProps) {
  const reducedMotion = useReducedMotion();
  const x = useTransform(rotateY, [-MAX_TILT_DEG, MAX_TILT_DEG], [MAX_OFFSET_PX, -MAX_OFFSET_PX], {
    clamp: true,
  });
  const y = useTransform(rotateX, [-MAX_TILT_DEG, MAX_TILT_DEG], [-MAX_OFFSET_PX, MAX_OFFSET_PX], {
    clamp: true,
  });
  const width = size * 0.55;

  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '50%',
        bottom: -(size * 0.06),
        width,
        height: size * 0.12,
        marginLeft: -(width / 2),
        borderRadius: '50%',
        background: 'radial-gradient(closest-side, rgba(0,0,0,0.35), rgba(0,0,0,0))',
        filter: 'blur(6px)',
        pointerEvents: 'none',
        x,
        y,
      }}
      animate={reducedMotion ? undefined : { scale: [1, 0.94, 1] }}
      transition={
        reducedMotion ? undefined : { duration: BREATHE_PERIOD_S, repeat: Infinity, ease: 'easeInOut' }
      }
    />
  );
}
