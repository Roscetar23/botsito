'use client';

import { useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Euler, Quaternion } from 'three';
import type { Group, Object3D } from 'three';

// --- Constantes calibrables del saludo (primera prueba) -------------------
/** Hueso que hace el gesto (`Hueso.001` ≈ la mano en x≈+3.27). */
const WAVE_BONE = 'Hueso.001';
/** Eje local sobre el que oscila el saludo. */
const WAVE_AXIS: 'x' | 'y' | 'z' = 'z';
/** Amplitud del vaivén, en radianes. */
const WAVE_AMPLITUDE = 0.5;
/** Velocidad de oscilación dentro del gesto (osc/seg aprox). */
const WAVE_SPEED = 8;
/** Cada cuántos segundos se repite el gesto. */
const WAVE_PERIOD = 5;
/** Cuánto dura el gesto, en segundos (debe ser < WAVE_PERIOD). */
const WAVE_DURATION = 2;
// ---------------------------------------------------------------------------

const eulerScratch = new Euler();
const quaternionScratch = new Quaternion();

/**
 * Gestos procedurales: mueve huesos del rig por código, **aditivo** sobre
 * la pose que ya fijó el `AnimationMixer` de la animación baked (idle) —
 * multiplica una quaternion de offset sobre la del hueso, no la
 * reemplaza. Cachea el hueso por nombre la primera vez que lo encuentra.
 *
 * Fiabilidad del orden de ejecución: este hook debe llamarse **después**
 * de `useModelAnimation` dentro del mismo componente (`RobotModel`). R3F
 * ejecuta los `useFrame` sin prioridad explícita (0) en el orden en que
 * se suscribieron, y ese orden sigue el orden de los hooks dentro del
 * componente — así que este `useFrame` corre después del
 * `mixer.update()` interno de `useAnimations` en el mismo frame, y el
 * offset queda encima de la pose del clip en vez de ser pisado por él.
 *
 * Con `enabled=false` (gestos apagados o `prefers-reduced-motion`) no
 * toca ningún hueso.
 */
export function useProceduralGestures(groupRef: RefObject<Group | null>, enabled: boolean): void {
  const boneRef = useRef<Object3D | null>(null);

  useFrame((state) => {
    if (!enabled) return;

    const elapsed = state.clock.elapsedTime;
    const phase = elapsed % WAVE_PERIOD;
    if (phase >= WAVE_DURATION) return;

    if (!boneRef.current) {
      boneRef.current = groupRef.current?.getObjectByName(WAVE_BONE) ?? null;
    }
    const bone = boneRef.current;
    if (!bone) return;

    // Envolvente 0→1→0 (fade in/out) a lo largo del gesto.
    const envelope = Math.sin((phase / WAVE_DURATION) * Math.PI);
    const angle = Math.sin(phase * WAVE_SPEED) * WAVE_AMPLITUDE * envelope;

    eulerScratch.set(0, 0, 0);
    eulerScratch[WAVE_AXIS] = angle;
    quaternionScratch.setFromEuler(eulerScratch);
    bone.quaternion.multiply(quaternionScratch);
  });
}
