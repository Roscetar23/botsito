'use client';

import { motion } from 'framer-motion';
import type { MouthVariant } from '@asistente/avatar-model';
import { CROSSFADE } from '../animation/timings.js';
import { layerStyle } from './layer-style.js';

export interface MouthProps {
  neutralSrc: string;
  talkingSrc: string;
  happySrc: string;
  variant: MouthVariant;
}

/** Boca: crossfade entre las tres variantes (`neutral`/`talking`/`happy`).
 * `useAvatarMachine` decide la variante activa (incluida la alternancia al
 * hablar), este componente solo la renderiza con transición suave. */
export function Mouth({ neutralSrc, talkingSrc, happySrc, variant }: MouthProps) {
  const layers: [MouthVariant, string][] = [
    ['neutral', neutralSrc],
    ['talking', talkingSrc],
    ['happy', happySrc],
  ];

  return (
    <>
      {layers.map(([key, src]) => (
        <motion.img
          key={key}
          src={src}
          alt=""
          aria-hidden="true"
          style={layerStyle}
          animate={{ opacity: variant === key ? 1 : 0 }}
          transition={CROSSFADE}
        />
      ))}
    </>
  );
}
