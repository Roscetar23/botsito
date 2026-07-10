'use client';

import { motion } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';
import type { AvatarState } from '@asistente/avatar-model';
import type { AvatarDirectives } from './machine/useAvatarMachine.js';
import { useCursorTilt } from './behaviors/useCursorTilt.js';
import { useBreathing } from './behaviors/useBreathing.js';
import { rigVariants } from './animation/variants.js';
import { HEAD_SPRING, NOTIFY_BOUNCE } from './animation/timings.js';
import { LAYER_DEPTH } from './animation/depths.js';
import { Body } from './parts/Body.js';
import { Headphones } from './parts/Headphones.js';
import { Brows } from './parts/Brows.js';
import { Eyes } from './parts/Eyes.js';
import { Mouth } from './parts/Mouth.js';
import { Hands } from './parts/Hands.js';
import { Shadow } from './parts/Shadow.js';

export interface Rig3DProps {
  state: AvatarState;
  directives: AvatarDirectives;
  size: number;
  assetsBase: string;
  interactive: boolean;
  reducedMotion: boolean;
}

const FILL: CSSProperties = { position: 'relative', width: '100%', height: '100%' };
const PRESERVE_3D: CSSProperties = { transformStyle: 'preserve-3d' };

function DepthLayer({ depth, children }: { depth: number; children: ReactNode }) {
  return (
    <div
      style={{ position: 'absolute', inset: 0, transform: `translateZ(${depth}px)`, ...PRESERVE_3D }}
    >
      {children}
    </div>
  );
}

/**
 * El rig 3D real: perspectiva + inclinación que sigue al cursor +
 * respiración/rebote heredados + cada capa a su profundidad (`LAYER_DEPTH`)
 * + sombra de contacto. Extraído de `Avatar.tsx` para respetar el límite
 * de líneas por archivo.
 */
export function Rig3D({ state, directives, size, assetsBase, interactive, reducedMotion }: Rig3DProps) {
  const { rotateX, rotateY } = useCursorTilt(interactive && !reducedMotion);
  const breathing = useBreathing(!reducedMotion);
  const bounceActive = directives.bounce && !reducedMotion;

  return (
    <div style={{ ...FILL, perspective: '800px' }}>
      <motion.div style={{ ...FILL, ...PRESERVE_3D, rotateX, rotateY }}>
        <motion.div
          style={{ ...FILL, ...PRESERVE_3D }}
          animate={breathing?.animate}
          transition={breathing?.transition}
        >
          <motion.div
            style={{ ...FILL, ...PRESERVE_3D }}
            animate={{ y: bounceActive ? [0, -14, 0] : 0 }}
            transition={bounceActive ? NOTIFY_BOUNCE : HEAD_SPRING}
          >
            <motion.div
              style={{ ...FILL, ...PRESERVE_3D }}
              variants={rigVariants}
              animate={state}
              transition={HEAD_SPRING}
            >
              <DepthLayer depth={LAYER_DEPTH.body}>
                <Body src={`${assetsBase}/body.png`} />
              </DepthLayer>
              <DepthLayer depth={LAYER_DEPTH.headphones}>
                <Headphones src={`${assetsBase}/headphones.png`} />
              </DepthLayer>
              <DepthLayer depth={LAYER_DEPTH.brows}>
                <Brows src={`${assetsBase}/brows.png`} variant={directives.brows} />
              </DepthLayer>
              <DepthLayer depth={LAYER_DEPTH.eyes}>
                <Eyes
                  openSrc={`${assetsBase}/eyes-open.png`}
                  closedSrc={`${assetsBase}/eyes-closed.png`}
                  closed={directives.eyesClosed}
                />
              </DepthLayer>
              <DepthLayer depth={LAYER_DEPTH.mouth}>
                <Mouth
                  neutralSrc={`${assetsBase}/mouth-neutral.png`}
                  talkingSrc={`${assetsBase}/mouth-talking.png`}
                  happySrc={`${assetsBase}/mouth-happy.png`}
                  variant={directives.mouth}
                />
              </DepthLayer>
              <DepthLayer depth={LAYER_DEPTH.hands}>
                <Hands
                  src={`${assetsBase}/hands.png`}
                  active={state === 'notify' || state === 'happy'}
                  reducedMotion={reducedMotion}
                />
              </DepthLayer>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
      <Shadow rotateX={rotateX} rotateY={rotateY} size={size} />
    </div>
  );
}
