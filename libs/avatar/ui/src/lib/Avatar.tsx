'use client';

import { useReducedMotion } from 'framer-motion';
import type { AvatarState } from '@asistente/avatar-model';
import { useAvatarMachine } from './machine/useAvatarMachine.js';
import { Rig3D } from './Rig3D.js';

export interface AvatarProps {
  state: AvatarState;
  size?: number;
  assetsBase?: string;
  /** Inclinación 3D que sigue al cursor por toda la ventana. Activada por defecto. */
  interactive?: boolean;
}

const ARIA_LABEL: Record<AvatarState, string> = {
  idle: 'Avatar: en reposo',
  listening: 'Avatar: escuchando',
  speaking: 'Avatar: hablando',
  thinking: 'Avatar: pensando',
  happy: 'Avatar: contento',
  sad: 'Avatar: triste',
  notify: 'Avatar: notificación',
};

/**
 * Robot line-art con audífonos, compuesto por capas PNG alineadas con
 * volumen pseudo-3D (perspective + translateZ por capa, ver `Rig3D`) que
 * se inclina siguiendo al cursor. Presentacional: solo recibe `state` por
 * props, no conoce sockets ni lógica de negocio.
 */
export function Avatar({ state, size = 320, assetsBase = '/avatar', interactive = true }: AvatarProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const directives = useAvatarMachine(state, !reducedMotion);

  return (
    <div
      role="img"
      aria-label={ARIA_LABEL[state]}
      style={{ width: size, height: size, position: 'relative', overflow: 'visible' }}
    >
      <Rig3D
        state={state}
        directives={directives}
        size={size}
        assetsBase={assetsBase}
        interactive={interactive}
        reducedMotion={reducedMotion}
      />
    </div>
  );
}
