'use client';

import { useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { Group, Object3D } from 'three';

// --- Defaults calibrables de la boca (rasgo-plano rectangular, por escala) ----
/** Eje LOCAL que agranda el ALTO de la boca en el mundo (medido: X ⇒ alto). */
const MOUTH_OPEN_AXIS: 'x' | 'y' | 'z' = 'x';
/** Eje LOCAL que agranda el ANCHO de la boca en el mundo (medido: Y ⇒ ancho). */
const MOUTH_WIDTH_AXIS: 'x' | 'y' | 'z' = 'y';

// Hablar (abre/cierra en ráfagas)
/** Cuánto se abre en el pico (0.7 ⇒ hasta ×1.7). Bajo a propósito: el pivote
 *  del hueso está descentrado, abrir mucho empuja la boca hacia arriba. */
const MOUTH_OPEN_AMOUNT = 0.7;
/** Rapidez del abrir/cerrar al hablar (flaps ≈ por segundo). */
const MOUTH_SPEED = 7;
/** Cada cuántos segundos se repite la ráfaga de habla / cuánto dura. */
const MOUTH_PERIOD = 5;
const MOUTH_DURATION = 2;

// Sonreír (ensancha y aplana → boca ancha y contenta; pose sostenida)
/** Cuánto ensancha la boca en el pico (0.5 ⇒ ×1.5 de ancho). */
const SMILE_WIDEN = 0.5;
/** Cuánto la aplana en el pico (0.35 ⇒ ×0.65 de alto). */
const SMILE_FLATTEN = 0.35;
/** Cada cuántos segundos se repite la sonrisa / cuánto dura. */
const SMILE_PERIOD = 5;
const SMILE_DURATION = 2.6;
// ---------------------------------------------------------------------------

/** Replica el saneo de nombres de nodo de three (ver `useWaveGesture`). */
function sanitize(name: string): string {
  return name.replace(/\s/g, '_').replace(/[[\].:/]/g, '');
}

function findBone(root: Group | null, boneName: string): Object3D | null {
  if (!root) return null;
  return root.getObjectByName(sanitize(boneName)) ?? root.getObjectByName(boneName) ?? null;
}

/** Envolvente con meseta (ramp-up · hold · ramp-down) para poses sostenidas. */
function plateau(t: number): number {
  const edge = 0.25;
  if (t < edge) return t / edge;
  if (t > 1 - edge) return (1 - t) / edge;
  return 1;
}

/** Opciones por instancia: dos efectos independientes con su propio toggle. */
export interface MouthOptions {
  /** Boca hablando: abre/cierra en ráfagas. Default false. */
  talk?: boolean;
  /** Boca sonriendo: ensancha y aplana (pose sostenida). Default false. */
  smile?: boolean;
  /** Desfase (s) sumado al reloj antes del `%`. Default 0. */
  phaseOffset?: number;
}

/**
 * Gesto de boca reutilizable con dos efectos que se combinan en una sola
 * escritura de escala (sin conflicto): **hablar** (`talk`, abre/cierra en
 * ráfagas escalando el alto) y **sonreír** (`smile`, ensancha + aplana como
 * pose sostenida). La boca es un plano rectangular emparentado al hueso, así
 * que se anima por escala. Fuera de sus ventanas restaura la escala base (la
 * escala no la anima el clip → seguro), igual que `useBlinkGesture`.
 *
 * Nota: una sonrisa *curvada* de verdad no es posible con un plano + un hueso
 * (haría falta una shape key en Blender); esto es una aproximación por forma.
 *
 * Orden: llamar **después** de `useModelAnimation`. Con ambos efectos
 * apagados no toca el hueso.
 */
export function useMouthGesture(
  groupRef: RefObject<Group | null>,
  boneName: string,
  options: MouthOptions = {},
): void {
  const { talk = false, smile = false, phaseOffset = 0 } = options;

  const boneRef = useRef<Object3D | null>(null);
  const baseScaleRef = useRef<Vector3 | null>(null);

  useFrame((state) => {
    if (!talk && !smile) return;

    if (!boneRef.current) {
      const bone = findBone(groupRef.current, boneName);
      if (bone) {
        boneRef.current = bone;
        baseScaleRef.current = bone.scale.clone();
      }
    }
    const bone = boneRef.current;
    const baseScale = baseScaleRef.current;
    if (!bone || !baseScale) return;

    // Parte siempre de la escala base (restaura fuera de ventana / entre efectos).
    bone.scale.copy(baseScale);
    const clock = state.clock.elapsedTime + phaseOffset;

    if (talk) {
      const phase = clock % MOUTH_PERIOD;
      if (phase < MOUTH_DURATION) {
        const envelope = Math.sin((phase / MOUTH_DURATION) * Math.PI);
        const flap = 0.5 - 0.5 * Math.cos(phase * MOUTH_SPEED);
        bone.scale[MOUTH_OPEN_AXIS] *= 1 + MOUTH_OPEN_AMOUNT * envelope * flap;
      }
    }

    if (smile) {
      const phase = clock % SMILE_PERIOD;
      if (phase < SMILE_DURATION) {
        const env = plateau(phase / SMILE_DURATION);
        bone.scale[MOUTH_WIDTH_AXIS] *= 1 + SMILE_WIDEN * env;
        bone.scale[MOUTH_OPEN_AXIS] *= 1 - SMILE_FLATTEN * env;
      }
    }
  });
}
