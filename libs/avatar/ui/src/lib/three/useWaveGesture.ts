'use client';

import { useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Euler, Quaternion, Vector3 } from 'three';
import type { Group, Object3D } from 'three';

// --- Constantes calibrables del saludo (ya calibradas, no tocar el look) --
/** Eje local sobre el que gira/oscila el saludo. */
const WAVE_AXIS: 'x' | 'y' | 'z' = 'z';
/** Giro base para LEVANTAR la mano (dedos arriba) antes de saludar, en
 *  radianes, sobre `WAVE_AXIS`. ~π ≈ 180° voltea de "dedos abajo" a "arriba". */
const WAVE_LIFT_ANGLE = Math.PI;
/** Amplitud del vaivén (saludo) alrededor de la posición levantada, en radianes. */
const WAVE_AMPLITUDE = 0.5;
/** Velocidad de oscilación dentro del gesto (osc/seg aprox). */
const WAVE_SPEED = 8;
/** Cada cuántos segundos se repite el gesto. Exportada: se usa para
 *  escalonar el `phaseOffset` de la segunda mano (media vuelta). */
export const WAVE_PERIOD = 7;
/** Cuánto dura el gesto, en segundos (debe ser < WAVE_PERIOD). */
const WAVE_DURATION = 3.4;
/** Eje local por el que se LEVANTA la mano completa durante el saludo. */
const WAVE_RAISE_AXIS: 'x' | 'y' | 'z' = 'y';
/** Cuánto se levanta la mano (unidades locales). */
const WAVE_RAISE_AMOUNT = 1;
// ---------------------------------------------------------------------------

const eulerScratch = new Euler();
const offsetScratch = new Quaternion();

/**
 * Replica el saneo de nombres de nodo que hace three al cargar un GLTF
 * (`GLTFLoader.createUniqueName` → `PropertyBinding.sanitizeNodeName`):
 * espacios a `_`, fuera `[ ] . : /`. Así un hueso fuente `Hueso.001`
 * termina llamándose `Hueso001` en la escena cargada (`Hueso cuerpo` →
 * `Hueso_cuerpo`). Sin esto, `getObjectByName('Hueso.001')` da `null`.
 */
function sanitize(name: string): string {
  return name.replace(/\s/g, '_').replace(/[[\].:/]/g, '');
}

function findBone(root: Group | null, boneName: string): Object3D | null {
  if (!root) return null;
  return root.getObjectByName(sanitize(boneName)) ?? root.getObjectByName(boneName) ?? null;
}

/**
 * Gesto de saludo reutilizable: mueve el hueso `boneName` por código.
 * Captura su pose base (quaternion + position) **una vez**, al
 * encontrarlo, y dentro de la ventana activa del gesto aplica
 * `base.quat · offset` + sube `base.position` en `WAVE_RAISE_AXIS` según
 * la envolvente; fuera de la ventana no toca el hueso — así el clip
 * (encendido o pausado) sigue mandando el resto del tiempo.
 *
 * `phaseOffset` (segundos) se suma al reloj antes del `% WAVE_PERIOD`,
 * para escalonar el gesto entre varias manos (llamando el hook una vez
 * por hueso) sin duplicar la lógica de temporización.
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
export function useWaveGesture(
  groupRef: RefObject<Group | null>,
  boneName: string,
  enabled: boolean,
  phaseOffset = 0,
): void {
  const boneRef = useRef<Object3D | null>(null);
  const baseQuatRef = useRef<Quaternion | null>(null);
  const basePosRef = useRef<Vector3 | null>(null);

  useFrame((state) => {
    if (!enabled) return;

    if (!boneRef.current) {
      const bone = findBone(groupRef.current, boneName);
      if (bone) {
        boneRef.current = bone;
        baseQuatRef.current = bone.quaternion.clone();
        basePosRef.current = bone.position.clone();
      }
    }
    const bone = boneRef.current;
    const baseQuat = baseQuatRef.current;
    const basePos = basePosRef.current;
    if (!bone || !baseQuat || !basePos) return;

    const phase = (state.clock.elapsedTime + phaseOffset) % WAVE_PERIOD;
    if (phase >= WAVE_DURATION) return;

    // Envolvente 0→1→0 (fade in/out): la mano sube (lift) mientras saluda y baja.
    const envelope = Math.sin((phase / WAVE_DURATION) * Math.PI);
    const wave = Math.sin(phase * WAVE_SPEED) * WAVE_AMPLITUDE;
    const angle = envelope * (WAVE_LIFT_ANGLE + wave);

    eulerScratch.set(0, 0, 0);
    eulerScratch[WAVE_AXIS] = angle;
    offsetScratch.setFromEuler(eulerScratch);
    bone.quaternion.copy(baseQuat).multiply(offsetScratch);

    // Levanta la mano completa mientras saluda (sube con la envolvente y baja).
    bone.position.copy(basePos);
    bone.position[WAVE_RAISE_AXIS] += envelope * WAVE_RAISE_AMOUNT;
  });
}
