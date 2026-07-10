'use client';

import { motion } from 'framer-motion';
import { layerStyle } from './layer-style.js';

export interface HeadphonesProps {
  src: string;
}

/** Capa de audífonos (banda + orejeras). Sin animación propia; se mueve
 * junto con el resto del rig (respiración/inclinación/rebote). */
export function Headphones({ src }: HeadphonesProps) {
  return <motion.img src={src} alt="" aria-hidden="true" style={layerStyle} />;
}
