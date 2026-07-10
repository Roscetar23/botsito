'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { AvatarState } from '@asistente/avatar-model';
import { useAvatarMachine } from './machine/useAvatarMachine.js';
import { useBreathing } from './behaviors/useBreathing.js';
import { rigVariants } from './animation/variants.js';
import { HEAD_SPRING, NOTIFY_BOUNCE } from './animation/timings.js';
import { Body } from './parts/Body.js';
import { Headphones } from './parts/Headphones.js';
import { Brows } from './parts/Brows.js';
import { Eyes } from './parts/Eyes.js';
import { Mouth } from './parts/Mouth.js';
import { Hands } from './parts/Hands.js';

export interface AvatarProps {
  state: AvatarState;
  size?: number;
  assetsBase?: string;
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

const LAYER_CONTAINER_STYLE = { position: 'relative', width: '100%', height: '100%' } as const;

/**
 * Robot line-art con audífonos, compuesto por capas PNG alineadas
 * (`body → headphones → brows → eyes → mouth → hands`). Presentacional: solo
 * recibe `state` por props, no conoce sockets ni lógica de negocio.
 */
export function Avatar({ state, size = 320, assetsBase = '/avatar' }: AvatarProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const directives = useAvatarMachine(state, !reducedMotion);
  const breathing = useBreathing(!reducedMotion);
  const bounceActive = directives.bounce && !reducedMotion;

  return (
    <div
      role="img"
      aria-label={ARIA_LABEL[state]}
      style={{ width: size, height: size, position: 'relative', overflow: 'visible' }}
    >
      <motion.div
        style={LAYER_CONTAINER_STYLE}
        animate={breathing?.animate}
        transition={breathing?.transition}
      >
        <motion.div
          style={LAYER_CONTAINER_STYLE}
          animate={{ y: bounceActive ? [0, -14, 0] : 0 }}
          transition={bounceActive ? NOTIFY_BOUNCE : HEAD_SPRING}
        >
          <motion.div
            style={LAYER_CONTAINER_STYLE}
            variants={rigVariants}
            animate={state}
            transition={HEAD_SPRING}
          >
            <Body src={`${assetsBase}/body.png`} />
            <Headphones src={`${assetsBase}/headphones.png`} />
            <Brows src={`${assetsBase}/brows.png`} variant={directives.brows} />
            <Eyes
              openSrc={`${assetsBase}/eyes-open.png`}
              closedSrc={`${assetsBase}/eyes-closed.png`}
              closed={directives.eyesClosed}
            />
            <Mouth
              neutralSrc={`${assetsBase}/mouth-neutral.png`}
              talkingSrc={`${assetsBase}/mouth-talking.png`}
              happySrc={`${assetsBase}/mouth-happy.png`}
              variant={directives.mouth}
            />
            <Hands
              src={`${assetsBase}/hands.png`}
              active={state === 'notify' || state === 'happy'}
              reducedMotion={reducedMotion}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
