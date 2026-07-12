'use client';

import { useRef } from 'react';
import type { ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { Group } from 'three';
import { useFlightOrientation } from './useFlightOrientation.js';
import { usePointerViewportTarget } from './usePointerViewportTarget.js';
import { ShadowBlob } from './ShadowBlob.js';
import { RoamSpeedContext } from './roamSpeedContext.js';
import { HandBonesContext } from './handBonesContext.js';
import type { HandBones } from './handBonesContext.js';
import { HandShadows } from './HandShadows.js';

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

/** Velocidad del ease hacia el cursor (bajo = va con lag, no pegado). */
const POSITION_EASE_SPEED = 1.8;

/** Velocidad de mundo (u/seg) que se considera "a tope" al normalizar 0..1. */
const SPEED_REFERENCE = 5;
/** Suavizado de la señal de velocidad (independiente del framerate). */
const SPEED_SMOOTH = 8;

/**
 * Deambula por todo el viewport visible del `<Canvas>` (pensado para un
 * canvas a pantalla completa): escala el modelo pequeño y persigue la
 * posición del cursor con un lerp suave (con lag, no queda pegado al
 * puntero), clamp dentro del área visible con margen (el objetivo ya
 * viene clamp desde el cursor normalizado, así que el ease nunca se
 * pasa de los bordes). Encima, orienta el personaje según su
 * **desplazamiento** (`useFlightOrientation`, no según el cursor — eso
 * lo desactiva el llamador en modo roam) y añade una sombra de contacto
 * (`ShadowBlob`) que lo acompaña. La levitación (`Float`) va *dentro* de
 * este grupo, así que se suma a todo lo anterior.
 *
 * Con `enabled=false` (incluye `prefers-reduced-motion`, decidido por el
 * llamador) el grupo queda centrado, sin rotación, a escala normal y sin
 * sombra — el comportamiento "en caja" de siempre.
 */
export function RoamGroup({ enabled, children }: RoamGroupProps) {
  const groupRef = useRef<Group>(null);
  const { viewport } = useThree();
  const flight = useFlightOrientation();
  const pointer = usePointerViewportTarget(enabled);
  /** Velocidad normalizada 0..1, compartida por contexto a los gestos hijos. */
  const speedRef = useRef(0);
  /** Huesos de mano (los puebla `RobotModel`), para las sombras de mano. */
  const handBonesRef = useRef<HandBones>({ left: null, right: null });

  useFrame((_state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    if (!enabled) {
      group.position.set(0, 0, 0);
      group.rotation.set(0, 0, 0);
      group.scale.setScalar(1);
      speedRef.current = 0;
      return;
    }

    group.scale.setScalar(ROAM_SCALE);

    const amplitudeX = Math.max(0, viewport.width / 2 - EDGE_MARGIN);
    const amplitudeY = Math.max(0, viewport.height / 2 - EDGE_MARGIN);
    const targetX = pointer.current.x * amplitudeX;
    const targetY = -pointer.current.y * amplitudeY;

    // Posición previa (antes del ease) para medir el desplazamiento del frame.
    const prevX = group.position.x;
    const prevY = group.position.y;

    const t = Math.min(1, POSITION_EASE_SPEED * delta);
    group.position.x += (targetX - group.position.x) * t;
    group.position.y += (targetY - group.position.y) * t;

    // Velocidad de mundo → normalizada 0..1 → suavizada (para los gestos hijos).
    const moved = Math.hypot(group.position.x - prevX, group.position.y - prevY);
    const instNorm = delta > 0 ? Math.min(1, moved / delta / SPEED_REFERENCE) : 0;
    const s = Math.min(1, SPEED_SMOOTH * delta);
    speedRef.current += (instNorm - speedRef.current) * s;

    flight.update(group.position.x, group.position.y, delta);
    const { pitch, yaw, roll } = flight.orientation.current;
    group.rotation.set(pitch, yaw, roll);
  });

  return (
    <RoamSpeedContext.Provider value={speedRef}>
      <HandBonesContext.Provider value={handBonesRef}>
        <group ref={groupRef}>
          {children}
          {enabled ? <ShadowBlob /> : null}
          {enabled ? <HandShadows bonesRef={handBonesRef} /> : null}
        </group>
      </HandBonesContext.Provider>
    </RoamSpeedContext.Provider>
  );
}
