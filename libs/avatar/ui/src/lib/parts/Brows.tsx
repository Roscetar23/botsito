'use client';

import { motion } from 'framer-motion';
import type { BrowsVariant } from '@asistente/avatar-model';
import { browsOffset } from '../animation/variants.js';
import { PART_SPRING } from '../animation/timings.js';
import { layerStyle } from './layer-style.js';

export interface BrowsProps {
  src: string;
  variant: BrowsVariant;
}

/** Cejas (una sola capa con ambas). Se traslada/rota como grupo según la
 * emoción actual: `up` (sorpresa/atención), `down` (tristeza), `neutral`. */
export function Brows({ src, variant }: BrowsProps) {
  const { y, rotate } = browsOffset[variant];

  return (
    <motion.img
      src={src}
      alt=""
      aria-hidden="true"
      style={layerStyle}
      animate={{ y, rotate }}
      transition={PART_SPRING}
    />
  );
}
