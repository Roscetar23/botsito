'use client';

import { useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { Group, Object3D } from 'three';

// --- Constantes calibrables del parpadeo (ojo = plano emparentado a un hueso) --
/** Eje local del hueso por el que se "aplasta" el ojo para cerrarlo (vertical). */
const BLINK_AXIS: 'x' | 'y' | 'z' = 'y';
/** Cuánto se cierra el ojo (0..1). 0.9 = se cierra casi todo (queda ~10% abierto). */
const BLINK_CLOSE = 0.9;
/** Duración de UN parpadeo, en segundos (rápido: cerrar y abrir). */
const BLINK_DURATION = 0.18;
/** Cada cuántos segundos parpadea. Exportado para escalonar entre ojos. */
export const BLINK_PERIOD = 4;
// ---------------------------------------------------------------------------

/**
 * Replica el saneo de nombres de nodo de three al cargar un GLTF
 * (`PropertyBinding.sanitizeNodeName`): espacios a `_`, fuera `[ ] . : /`.
 * Así `Hueso cuerpo.003` (fuente) se busca como `Hueso_cuerpo003` en la
 * escena cargada. Sin esto, `getObjectByName` devuelve `null` (ver el
 * mismo gotcha en `useWaveGesture`).
 */
function sanitize(name: string): string {
  return name.replace(/\s/g, '_').replace(/[[\].:/]/g, '');
}

function findBone(root: Group | null, boneName: string): Object3D | null {
  if (!root) return null;
  return root.getObjectByName(sanitize(boneName)) ?? root.getObjectByName(boneName) ?? null;
}

/**
 * Gesto de parpadeo reutilizable: cierra y abre un ojo aplastando su hueso
 * en `BLINK_AXIS` (el ojo es un plano emparentado al hueso, así que escalar
 * el hueso a ~0 en vertical cierra el párpado). Captura la escala base
 * **una vez** y, dentro de la ventana activa del parpadeo, interpola
 * `escala = base · (1 − BLINK_CLOSE · envelope)`; fuera de la ventana no
 * toca el hueso — así el clip baked sigue mandando el resto del tiempo
 * (mismo criterio que `useWaveGesture`).
 *
 * `phaseOffset` (segundos) se suma al reloj antes del `% BLINK_PERIOD`
 * para escalonar o sincronizar ambos ojos (llamando el hook una vez por
 * hueso). Con 0 en ambos ojos, parpadean a la vez.
 *
 * Orden de ejecución: llamar **después** de `useModelAnimation` en
 * `RobotModel`, para que este `useFrame` corra tras el `AnimationMixer`
 * (misma razón detallada en `useWaveGesture`).
 *
 * Con `enabled=false` (parpadeo apagado o `prefers-reduced-motion`) no
 * toca ningún hueso.
 */
export function useBlinkGesture(
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

    const phase = (state.clock.elapsedTime + phaseOffset) % BLINK_PERIOD;
    if (phase >= BLINK_DURATION) return;

    // Envolvente 0→1→0: el ojo se cierra (aplasta) y se vuelve a abrir.
    const envelope = Math.sin((phase / BLINK_DURATION) * Math.PI);
    bone.scale.copy(baseScale);
    bone.scale[BLINK_AXIS] = baseScale[BLINK_AXIS] * (1 - BLINK_CLOSE * envelope);
  });
}
