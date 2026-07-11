'use client';

import { useRef } from 'react';
import type { MutableRefObject, RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { Group, Object3D } from 'three';

// --- Constantes calibrables del balanceo al "caminar" -----------------------
/** Eje LOCAL por el que se columpia la mano (posición). 'z' = adelante/atrás. */
const WALK_AXIS: 'x' | 'y' | 'z' = 'z';
/** Amplitud máxima del columpio (unidades locales), a velocidad tope. */
const WALK_AMPLITUDE = 1.4;
/** Rapidez del vaivén (rad/seg del oscilador). Calmado ≈ paso natural. */
const WALK_SPEED = 5;
/** Por debajo de esta velocidad normalizada no se escribe (deja saludar/reposo). */
const WALK_MIN_SPEED = 0.06;
/** Velocidad normalizada a la que el columpio llega a su amplitud plena. */
const WALK_FULL_SPEED = 0.22;
// ---------------------------------------------------------------------------

/** Replica el saneo de nombres de nodo de three (ver `useWaveGesture`). */
function sanitize(name: string): string {
  return name.replace(/\s/g, '_').replace(/[[\].:/]/g, '');
}

function findBone(root: Group | null, boneName: string): Object3D | null {
  if (!root) return null;
  return root.getObjectByName(sanitize(boneName)) ?? root.getObjectByName(boneName) ?? null;
}

/** Interpolación suave 0→1 entre `a` y `b` (Hermite). */
function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/**
 * Balanceo de la mano al "caminar": columpia el hueso `boneName` en
 * `WALK_AXIS` (adelante/atrás) con amplitud proporcional a la **velocidad
 * de desplazamiento** del muñeco (`speedRef`, 0..1, de `RoamGroup`). Quieto
 * → no toca el hueso (deja mandar al saludo/reposo); moviéndose → columpia,
 * más rápido = más amplio. `phaseOffset` de π en una mano hace que
 * **alternen** como los brazos al andar.
 *
 * La amplitud usa un `smoothstep` que vale 0 justo en el umbral de escritura
 * (`WALK_MIN_SPEED`), así al frenar la mano vuelve exactamente a su base sin
 * dejar residuo. Con `speedRef=null` (modo "caja", sin `RoamGroup`) o
 * `enabled=false` no hace nada. Llamar **después** del saludo en `RobotModel`
 * para que, en movimiento, el balanceo tenga prioridad sobre el saludo.
 */
export function useWalkSwing(
  groupRef: RefObject<Group | null>,
  boneName: string,
  speedRef: MutableRefObject<number> | null,
  enabled: boolean,
  phaseOffset = 0,
): void {
  const boneRef = useRef<Object3D | null>(null);
  const basePosRef = useRef<Vector3 | null>(null);

  useFrame((state) => {
    if (!enabled || !speedRef) return;

    if (!boneRef.current) {
      const bone = findBone(groupRef.current, boneName);
      if (bone) {
        boneRef.current = bone;
        basePosRef.current = bone.position.clone();
      }
    }
    const bone = boneRef.current;
    const basePos = basePosRef.current;
    if (!bone || !basePos) return;

    const speed = speedRef.current;
    if (speed < WALK_MIN_SPEED) return; // quieto: deja el saludo / reposo

    const amp = WALK_AMPLITUDE * smoothstep(WALK_MIN_SPEED, WALK_FULL_SPEED, speed);
    const swing = Math.sin(state.clock.elapsedTime * WALK_SPEED + phaseOffset) * amp;

    bone.position.copy(basePos);
    bone.position[WALK_AXIS] += swing;
  });
}
