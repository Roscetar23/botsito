'use client';

import { useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Euler, Quaternion } from 'three';
import type { Group, Object3D } from 'three';

// --- Constantes calibrables del saludo (primera prueba) -------------------
/** Hueso que hace el gesto (`Hueso.001` ≈ la mano en x≈+3.27; nombre fuente,
 *  legible — el saneo al nombre real de three se hace en `sanitize`). */
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
const offsetScratch = new Quaternion();

/**
 * Replica el saneo de nombres de nodo que hace three al cargar un GLTF
 * (`GLTFLoader.createUniqueName` → `PropertyBinding.sanitizeNodeName`):
 * espacios a `_`, fuera `[ ] . : /`. Así el hueso fuente `Hueso.001`
 * termina llamándose `Hueso001` en la escena cargada (`Hueso cuerpo` →
 * `Hueso_cuerpo`). Sin esto, `getObjectByName('Hueso.001')` da `null`.
 */
function sanitize(name: string): string {
  return name.replace(/\s/g, '_').replace(/[[\].:/]/g, '');
}

function findBone(root: Group | null): Object3D | null {
  if (!root) return null;
  return root.getObjectByName(sanitize(WAVE_BONE)) ?? root.getObjectByName(WAVE_BONE) ?? null;
}

/**
 * Gestos procedurales: mueve huesos del rig por código. Captura la pose
 * base del hueso **una vez**, al encontrarlo, y dentro de la ventana
 * activa del gesto aplica `base · offset` (no acumula sobre el valor del
 * frame anterior); fuera de la ventana no toca el hueso — así el clip
 * (encendido o pausado) sigue mandando el resto del tiempo.
 *
 * Fiabilidad del orden de ejecución: este hook debe llamarse **después**
 * de `useModelAnimation` dentro del mismo componente (`RobotModel`). R3F
 * ejecuta los `useFrame` sin prioridad explícita (0) en orden de
 * suscripción, que sigue el orden de los hooks del componente — así este
 * `useFrame` corre después del `mixer.update()` de `useAnimations` en el
 * mismo frame.
 *
 * Con `enabled=false` (gestos apagados o `prefers-reduced-motion`) no
 * toca ningún hueso.
 */
export function useProceduralGestures(groupRef: RefObject<Group | null>, enabled: boolean): void {
  const boneRef = useRef<Object3D | null>(null);
  const baseQuatRef = useRef<Quaternion | null>(null);

  useFrame((state) => {
    if (!enabled) return;

    if (!boneRef.current) {
      const bone = findBone(groupRef.current);
      if (bone) {
        boneRef.current = bone;
        baseQuatRef.current = bone.quaternion.clone();
      }
    }
    const bone = boneRef.current;
    const baseQuat = baseQuatRef.current;
    if (!bone || !baseQuat) return;

    const elapsed = state.clock.elapsedTime;
    const phase = elapsed % WAVE_PERIOD;
    if (phase >= WAVE_DURATION) return;

    // Envolvente 0→1→0 (fade in/out) a lo largo del gesto.
    const envelope = Math.sin((phase / WAVE_DURATION) * Math.PI);
    const angle = Math.sin(phase * WAVE_SPEED) * WAVE_AMPLITUDE * envelope;

    eulerScratch.set(0, 0, 0);
    eulerScratch[WAVE_AXIS] = angle;
    offsetScratch.setFromEuler(eulerScratch);
    bone.quaternion.copy(baseQuat).multiply(offsetScratch);
  });
}
