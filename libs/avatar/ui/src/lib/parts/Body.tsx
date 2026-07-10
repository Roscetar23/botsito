'use client';

import { motion } from 'framer-motion';
import { layerStyle } from './layer-style.js';

export interface BodyProps {
  src: string;
}

/** Capa base: cabeza/pantalla rectangular. Sin animación propia; hereda la
 * respiración/inclinación del contenedor del rig. */
export function Body({ src }: BodyProps) {
  return <motion.img src={src} alt="" aria-hidden="true" style={layerStyle} />;
}
