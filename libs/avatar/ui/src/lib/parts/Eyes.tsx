'use client';

import { motion } from 'framer-motion';
import { CROSSFADE } from '../animation/timings.js';
import { layerStyle } from './layer-style.js';

export interface EyesProps {
  openSrc: string;
  closedSrc: string;
  closed: boolean;
}

/** Ojos: crossfade rápido entre `eyes-open` y `eyes-closed` (parpadeo). El
 * personaje no tiene pupilas separadas, así que no hay seguimiento de mirada. */
export function Eyes({ openSrc, closedSrc, closed }: EyesProps) {
  return (
    <>
      <motion.img
        src={openSrc}
        alt=""
        aria-hidden="true"
        style={layerStyle}
        animate={{ opacity: closed ? 0 : 1 }}
        transition={CROSSFADE}
      />
      <motion.img
        src={closedSrc}
        alt=""
        aria-hidden="true"
        style={layerStyle}
        animate={{ opacity: closed ? 1 : 0 }}
        transition={CROSSFADE}
      />
    </>
  );
}
