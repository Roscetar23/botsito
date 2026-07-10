'use client';

import { motion } from 'framer-motion';
import { HANDS_ACTIVE_BOB, HANDS_IDLE_BOB } from '../animation/timings.js';
import { layerStyle } from './layer-style.js';

export interface HandsProps {
  src: string;
  /** Más movimiento (amplitud/velocidad) en `notify`/`happy`. */
  active: boolean;
  reducedMotion: boolean;
}

/** Manos: bob sutil en idle, más vivo cuando el estado es `notify`/`happy`. */
export function Hands({ src, active, reducedMotion }: HandsProps) {
  if (reducedMotion) {
    return <motion.img src={src} alt="" aria-hidden="true" style={layerStyle} />;
  }

  return (
    <motion.img
      src={src}
      alt=""
      aria-hidden="true"
      style={layerStyle}
      animate={{ y: active ? [0, -10, 0] : [0, -4, 0] }}
      transition={active ? HANDS_ACTIVE_BOB : HANDS_IDLE_BOB}
    />
  );
}
