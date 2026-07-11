'use client';

import { useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { Group, Object3D } from 'three';

// --- Defaults calibrables de la boca (rasgo-plano, se anima por escala) -------
/** Eje LOCAL del hueso que, al escalar, agranda el ALTO de la boca en el mundo
 *  (medido: escalar X del hueso ⇒ alto ×2.9 sin tocar el ancho) → "abrir". */
const MOUTH_OPEN_AXIS: 'x' | 'y' | 'z' = 'x';
/** Cuánto se abre en el pico (factor extra sobre la escala base; 2 ⇒ hasta ×3). */
const MOUTH_OPEN_AMOUNT = 2;
/** Rapidez del abrir/cerrar al hablar (flaps ≈ por segundo). */
const MOUTH_SPEED = 12;
/** Cada cuántos segundos se repite la ráfaga de habla. */
const MOUTH_PERIOD = 5;
/** Cuánto dura la ráfaga de habla, en segundos (`< period`). */
const MOUTH_DURATION = 2;
// ---------------------------------------------------------------------------

/** Replica el saneo de nombres de nodo de three (ver `useWaveGesture`). */
function sanitize(name: string): string {
  return name.replace(/\s/g, '_').replace(/[[\].:/]/g, '');
}

function findBone(root: Group | null, boneName: string): Object3D | null {
  if (!root) return null;
  return root.getObjectByName(sanitize(boneName)) ?? root.getObjectByName(boneName) ?? null;
}

/**
 * Gesto de boca reutilizable — **hablar**: abre y cierra la boca en ráfagas
 * escalando el hueso en `MOUTH_OPEN_AXIS` (la boca es un plano emparentado
 * al hueso; escalar ese eje agranda su alto → simula abrir la boca). Dentro
 * de la ventana activa oscila entre cerrada (escala base) y abierta con una
 * envolvente que hace entrar/salir suave la ráfaga; fuera de la ventana
 * restaura la escala base (la escala no la anima el clip → seguro), igual
 * que `useBlinkGesture`.
 *
 * `phaseOffset` (s) desplaza la ráfaga en el tiempo. Orden: llamar
 * **después** de `useModelAnimation` en `RobotModel`. Con `enabled=false`
 * no toca el hueso.
 */
export function useMouthGesture(
  groupRef: RefObject<Group | null>,
  boneName: string,
  enabled: boolean,
  phaseOffset = 0,
): void {
  const boneRef = useRef<Object3D | null>(null);
  const baseScaleRef = useRef<Vector3 | null>(null);

  useFrame((state) => {
    if (!enabled) return;

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

    const phase = (state.clock.elapsedTime + phaseOffset) % MOUTH_PERIOD;
    // Fuera de la ráfaga: boca CERRADA (restaura la escala base).
    if (phase >= MOUTH_DURATION) {
      bone.scale.copy(baseScale);
      return;
    }

    // Envolvente 0→1→0 (la ráfaga entra y sale) × oscilación de habla 0→1→0…
    const envelope = Math.sin((phase / MOUTH_DURATION) * Math.PI);
    const flap = 0.5 - 0.5 * Math.cos(phase * MOUTH_SPEED);
    const open = MOUTH_OPEN_AMOUNT * envelope * flap;

    bone.scale.copy(baseScale);
    bone.scale[MOUTH_OPEN_AXIS] = baseScale[MOUTH_OPEN_AXIS] * (1 + open);
  });
}
