'use client';

import { useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Euler, Quaternion, Vector3 } from 'three';
import type { Group, Object3D } from 'three';

// --- Constantes calibrables del toque (impulso corto, una sola pasada) -----
/** Eje LOCAL de traslación para "empujar hacia adelante" (mismo eje que usa
 *  `useWalkSwing` para adelante/atrás: reutilizamos su lectura ya calibrada
 *  de "hacia dónde mira la mano al desplazarse"). */
const PRESS_FORWARD_AXIS: 'x' | 'y' | 'z' = 'z';
/** Cuánto se estira la mano hacia adelante en el pico (unidades locales). */
const PRESS_FORWARD_AMOUNT = 1.6;
/** Eje LOCAL de traslación para el pequeño componente "hacia abajo" (mismo
 *  eje que `useWaveGesture` usa para levantar; aquí con signo negativo). */
const PRESS_DOWN_AXIS: 'x' | 'y' | 'z' = 'y';
/** Cuánto baja la mano en el pico (unidades locales; negativo = abajo). */
const PRESS_DOWN_AMOUNT = -0.6;
/** Eje LOCAL de rotación para el golpe de "empuje" (pitch). Distinto del eje
 *  que usa el saludo (`z`) para no leerse como el mismo gesto. */
const PRESS_ROT_AXIS: 'x' | 'y' | 'z' = 'x';
/** Ángulo de la inclinación de empuje en el pico (rad). */
const PRESS_ROT_ANGLE = 0.6;
/** Duración total del toque, en segundos (impulso corto, una sola pasada). */
const PRESS_DURATION = 0.4;
/** Fracción de `PRESS_DURATION` dedicada al ataque (extender); el resto es
 *  la vuelta a la pose base. 0.3 = golpe rápido, retirada algo más suave. */
const PRESS_ATTACK_FRAC = 0.3;
// ---------------------------------------------------------------------------

const eulerScratch = new Euler();
const offsetScratch = new Quaternion();

/** Replica el saneo de nombres de nodo de three (ver `useWaveGesture`). */
function sanitize(name: string): string {
  return name.replace(/\s/g, '_').replace(/[[\].:/]/g, '');
}

function findBone(root: Group | null, boneName: string): Object3D | null {
  if (!root) return null;
  return root.getObjectByName(sanitize(boneName)) ?? root.getObjectByName(boneName) ?? null;
}

/**
 * Envolvente 0→1→0 de UNA sola pasada, asimétrica ("ease out-in"): el
 * ataque (`t < PRESS_ATTACK_FRAC`) es un ease-out cúbico (arranca rápido y
 * se frena justo al llegar al pico, como un golpe seco); la vuelta es un
 * ease-in cúbico invertido (empieza despacio y acelera de vuelta a la base,
 * como si la mano se relajara). Nada de repetición: fuera de [0,1) el
 * llamador ya no invoca esta función.
 */
function pressEnvelope(t: number): number {
  if (t < PRESS_ATTACK_FRAC) {
    const u = t / PRESS_ATTACK_FRAC;
    return 1 - (1 - u) ** 3;
  }
  const u = (t - PRESS_ATTACK_FRAC) / (1 - PRESS_ATTACK_FRAC);
  return 1 - u ** 3;
}

/**
 * Gesto de "toque/pulsación": impulso corto y de una sola pasada (nada de
 * bucle) en el hueso `boneName`, disparado por un **nonce edge-triggered**
 * (`trigger`): cada vez que cambia a un valor NUEVO y definido, se dispara
 * una vez el toque; `undefined` (o el mismo valor de antes) nunca dispara.
 * Pensado para que el front lo accione cuando el robot llega a su destino
 * (`target` en `RoamGroup`) — el avatar no sabe que ha llegado, solo reacciona
 * al nonce.
 *
 * Mismo patrón que `useWaveGesture`: captura la pose base (quaternion +
 * position) **una vez** al encontrar el hueso, y solo la toca **dentro** de
 * la ventana activa del toque (`PRESS_DURATION` desde el disparo); fuera de
 * ella no escribe nada — así convive con el clip baked (que también anima
 * manos) y con `useWaveGesture`/`useWalkSwing` sobre el mismo hueso: quien
 * escriba último en el frame manda, y aquí solo se escribe durante el
 * impulso. Llamar **después** de `useModelAnimation`, `useWaveGesture` y
 * `useWalkSwing` en `RobotModel` para que el toque tenga la última palabra
 * si coincidiera con ellos (en el caso de uso real no coincide: el robot ya
 * ha llegado, `state="idle"` apaga el saludo y la velocidad ~0 apaga el
 * columpio).
 */
export function usePressGesture(
  groupRef: RefObject<Group | null>,
  boneName: string,
  trigger: number | undefined,
): void {
  const boneRef = useRef<Object3D | null>(null);
  const baseQuatRef = useRef<Quaternion | null>(null);
  const basePosRef = useRef<Vector3 | null>(null);
  const lastTriggerRef = useRef<number | undefined>(trigger);
  const startRef = useRef<number | null>(null);
  const boneNameRef = useRef(boneName);

  useFrame((state) => {
    // Nada que hacer: sin nonce definido y sin impulso en curso (mismo idioma
    // `if (!enabled) return` de los demás gestos, aquí derivado del nonce).
    if (trigger === undefined && startRef.current === null) return;

    // `boneName` cambió (p.ej. `pressHand` de un lado a otro): el hueso
    // cacheado ya no vale. Si había uno resuelto, restaura SU pose base
    // (para que no quede desplazado si se cambia de mano a mitad de un
    // impulso) y fuerza la re-resolución del bloque de abajo, que capturará
    // la base del hueso NUEVO. También corta cualquier impulso en curso
    // (`startRef`): que no siga corriendo un gesto viejo en la mano nueva.
    if (boneName !== boneNameRef.current) {
      if (boneRef.current && baseQuatRef.current && basePosRef.current) {
        boneRef.current.quaternion.copy(baseQuatRef.current);
        boneRef.current.position.copy(basePosRef.current);
      }
      boneRef.current = null;
      baseQuatRef.current = null;
      basePosRef.current = null;
      startRef.current = null;
      boneNameRef.current = boneName;
    }

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

    // Nonce edge-triggered: un valor NUEVO y definido arranca el impulso.
    if (trigger !== undefined && trigger !== lastTriggerRef.current) {
      lastTriggerRef.current = trigger;
      startRef.current = state.clock.elapsedTime;
    }

    const start = startRef.current;
    if (start === null) return;

    const t = (state.clock.elapsedTime - start) / PRESS_DURATION;
    if (t >= 1) {
      // Restaura la base EXPLÍCITAMENTE una última vez: el último frame que
      // escribe con envelope>0 es el anterior a este (t<1), así que sin este
      // restore el hueso quedaría congelado a mitad de camino para siempre
      // (nadie más lo toca en el caso de uso real: ver doc de la función).
      bone.quaternion.copy(baseQuat);
      bone.position.copy(basePos);
      startRef.current = null; // impulso terminado: deja de escribir el hueso
      return;
    }

    const envelope = pressEnvelope(t);

    eulerScratch.set(0, 0, 0);
    eulerScratch[PRESS_ROT_AXIS] = envelope * PRESS_ROT_ANGLE;
    offsetScratch.setFromEuler(eulerScratch);
    bone.quaternion.copy(baseQuat).multiply(offsetScratch);

    bone.position.copy(basePos);
    bone.position[PRESS_FORWARD_AXIS] += envelope * PRESS_FORWARD_AMOUNT;
    bone.position[PRESS_DOWN_AXIS] += envelope * PRESS_DOWN_AMOUNT;
  });
}
