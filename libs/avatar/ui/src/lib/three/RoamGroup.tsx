'use client';

import { useRef } from 'react';
import type { ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { Group } from 'three';

export interface RoamGroupProps {
  enabled: boolean;
  children: ReactNode;
}

/** Altura objetivo del modelo mientras deambula (unidades del mundo). */
const ROAM_TARGET_HEIGHT = 2;
/** Altura real del GLB (ver bounding box documentado en `RobotModel`). */
const MODEL_HEIGHT = 5.54;
const ROAM_SCALE = ROAM_TARGET_HEIGHT / MODEL_HEIGHT;

/** Margen respecto al borde del viewport para que no se salga de pantalla. */
const EDGE_MARGIN = ROAM_TARGET_HEIGHT * 0.6;

/** Frecuencias relativas de la trayectoria (lentas, distintas en X/Y → Lissajous). */
const FREQ_X = 0.13;
const FREQ_Y = 0.17;

/**
 * Deambula por todo el viewport visible del `<Canvas>` (pensado para un
 * canvas a pantalla completa): escala el modelo pequeño y anima solo su
 * **posición** (x/y) con una curva tipo Lissajous lenta (suma de senos con
 * frecuencias distintas), clamp dentro del área visible con margen. La
 * levitación (`Float`) y el giro hacia el cursor (`CursorFollowGroup`) van
 * *dentro* de este grupo, así que se suman a la posición sin pisarla.
 *
 * Con `enabled=false` (incluye `prefers-reduced-motion`, decidido por el
 * llamador) el grupo queda centrado y a escala normal.
 */
export function RoamGroup({ enabled, children }: RoamGroupProps) {
  const groupRef = useRef<Group>(null);
  const { viewport } = useThree();

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;

    if (!enabled) {
      group.position.set(0, 0, 0);
      group.scale.setScalar(1);
      return;
    }

    group.scale.setScalar(ROAM_SCALE);

    const amplitudeX = Math.max(0, viewport.width / 2 - EDGE_MARGIN);
    const amplitudeY = Math.max(0, viewport.height / 2 - EDGE_MARGIN);
    const elapsed = state.clock.elapsedTime;

    group.position.x = Math.sin(elapsed * FREQ_X) * amplitudeX;
    group.position.y = Math.sin(elapsed * FREQ_Y) * amplitudeY;
  });

  return <group ref={groupRef}>{children}</group>;
}
