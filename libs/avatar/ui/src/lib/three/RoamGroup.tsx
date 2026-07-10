'use client';

import { useRef } from 'react';
import type { ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Trail } from '@react-three/drei';
import type { Group } from 'three';
import { useFlightOrientation } from './useFlightOrientation.js';
import { Aura } from './Aura.js';

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

const ACCENT_COLOR = '#6C5CE7';

function trailAttenuation(t: number): number {
  return t * t;
}

/**
 * Deambula por todo el viewport visible del `<Canvas>` (pensado para un
 * canvas a pantalla completa): escala el modelo pequeño y anima su
 * **posición** (x/y) con una curva tipo Lissajous lenta (suma de senos
 * con frecuencias distintas), clamp dentro del área visible con margen.
 * Encima, orienta el personaje según su **desplazamiento**
 * (`useFlightOrientation`, no según el cursor — eso lo desactiva el
 * llamador en modo roam) y añade una estela (`Trail`) y un halo (`Aura`)
 * de acento para reforzar la sensación de vuelo. La levitación (`Float`)
 * va *dentro* de este grupo, así que se suma a todo lo anterior.
 *
 * Con `enabled=false` (incluye `prefers-reduced-motion`, decidido por el
 * llamador) el grupo queda centrado, sin rotación, a escala normal y sin
 * estela ni halo — el comportamiento "en caja" de siempre.
 */
export function RoamGroup({ enabled, children }: RoamGroupProps) {
  const groupRef = useRef<Group>(null);
  const { viewport } = useThree();
  const flight = useFlightOrientation();

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    if (!enabled) {
      group.position.set(0, 0, 0);
      group.rotation.set(0, 0, 0);
      group.scale.setScalar(1);
      return;
    }

    group.scale.setScalar(ROAM_SCALE);

    const amplitudeX = Math.max(0, viewport.width / 2 - EDGE_MARGIN);
    const amplitudeY = Math.max(0, viewport.height / 2 - EDGE_MARGIN);
    const elapsed = state.clock.elapsedTime;

    const x = Math.sin(elapsed * FREQ_X) * amplitudeX;
    const y = Math.sin(elapsed * FREQ_Y) * amplitudeY;
    group.position.x = x;
    group.position.y = y;

    flight.update(x, y, delta);
    const { pitch, yaw, roll } = flight.orientation.current;
    group.rotation.set(pitch, yaw, roll);
  });

  return (
    <group ref={groupRef}>
      {enabled ? (
        <Trail color={ACCENT_COLOR} width={0.6} length={7} decay={1.5} attenuation={trailAttenuation}>
          {children}
        </Trail>
      ) : (
        children
      )}
      {enabled ? <Aura color={ACCENT_COLOR} /> : null}
    </group>
  );
}
