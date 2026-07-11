'use client';

import { useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Euler, Quaternion, Vector3 } from 'three';
import type { Group, Object3D } from 'three';

// --- Defaults calibrables de la ceja -----------------------------------------
/** Eje (en espacio del padre `Hueso cuerpo`, que es identidad ⇒ ≈ mundo) por
 *  el que se LEVANTA la ceja. 'y' = sube en vertical real. */
const EYEBROW_LIFT_AXIS: 'x' | 'y' | 'z' = 'y';
/** Cuánto sube la ceja en el pico del gesto (unidades de mundo). */
const EYEBROW_LIFT_AMOUNT = 0.4;
/** Eje EN ESPACIO DEL PADRE (≈ mundo; Z = hacia la cámara) sobre el que se
 *  INCLINA la ceja (fruncir/dudar). Se aplica con `premultiply` (frame del
 *  padre), NO en el eje local del hueso: así ambas cejas giran igual dentro
 *  del plano de la cara. Si fuera local, la ceja izquierda (cuyo hueso está
 *  más inclinado fuera del plano) se escorzaría/"contraería" al girar. */
const EYEBROW_TILT_AXIS: 'x' | 'y' | 'z' = 'z';
/** Ángulo de inclinación por defecto (rad) en el pico del fruncido. */
const EYEBROW_TILT_ANGLE = 0.6;
/** Cada cuántos segundos se repite el gesto por defecto. */
const EYEBROW_PERIOD = 5;
/** Duración del gesto (s, `< period`); más largo que un parpadeo. */
const EYEBROW_DURATION = 1.2;
// ---------------------------------------------------------------------------

/**
 * Opciones por instancia: cada ceja puede personalizarse por separado.
 * Los dos efectos se activan de forma **independiente** (`raise`/`tilt`)
 * para poder aislarlos con toggles distintos; lo demás usa defaults de
 * módulo si se omite.
 */
export interface EyebrowOptions {
  /** Activa el LEVANTAR (posición). Default false. */
  raise?: boolean;
  /** Activa la INCLINACIÓN/fruncido (rotación). Default false. */
  tilt?: boolean;
  /** Cuánto sube (unidades de mundo). Default `EYEBROW_LIFT_AMOUNT`. */
  liftAmount?: number;
  /** Inclinación en `EYEBROW_TILT_AXIS` (rad) en el pico. Signo OPUESTO por ceja. Default `EYEBROW_TILT_ANGLE`. */
  tiltAngle?: number;
  /** Cada cuántos segundos se repite. Default `EYEBROW_PERIOD`. */
  period?: number;
  /** Duración del gesto (s). Default `EYEBROW_DURATION`. */
  duration?: number;
  /** Desfase (s) sumado al reloj antes del `% period` (para escalonar). Default 0. */
  phaseOffset?: number;
}

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
 * Gesto de ceja reutilizable y **personalizable por instancia**, con dos
 * efectos independientes que se activan por separado:
 * - `raise`: **levanta** la ceja (posición en `EYEBROW_LIFT_AXIS`; como el
 *   padre `Hueso cuerpo` es identidad, equivale a subir en el mundo) → sorpresa.
 * - `tilt`: **inclina** la ceja (rotación en `EYEBROW_TILT_AXIS`, con signo
 *   opuesto por ceja porque están dibujadas en espejo) → fruncir/enojo.
 *
 * Ambos comparten la misma envolvente 0→1→0 y se combinan en una sola
 * escritura del hueso (sin conflicto). Captura la pose base una vez; fuera
 * de la ventana activa restaura la pose base (así, con el gesto encendido
 * pero en reposo, la ceja no queda desplazada). Con ambos apagados no toca
 * el hueso → el clip manda.
 *
 * Se instancia una vez por ceja con sus propias `options`, de modo que
 * cada una es independiente. Orden: llamar **después** de
 * `useModelAnimation` en `RobotModel` (para correr tras el `AnimationMixer`).
 */
export function useEyebrowGesture(
  groupRef: RefObject<Group | null>,
  boneName: string,
  options: EyebrowOptions = {},
): void {
  const {
    raise = false,
    tilt = false,
    liftAmount = EYEBROW_LIFT_AMOUNT,
    tiltAngle = EYEBROW_TILT_ANGLE,
    period = EYEBROW_PERIOD,
    duration = EYEBROW_DURATION,
    phaseOffset = 0,
  } = options;

  const boneRef = useRef<Object3D | null>(null);
  const baseQuatRef = useRef<Quaternion | null>(null);
  const basePosRef = useRef<Vector3 | null>(null);

  useFrame((state) => {
    if (!raise && !tilt) return;

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

    // Parte de la pose base siempre (restaura fuera de la ventana / entre efectos).
    bone.position.copy(basePos);
    bone.quaternion.copy(baseQuat);

    const phase = (state.clock.elapsedTime + phaseOffset) % period;
    if (phase >= duration) return;

    // Envolvente 0→1→0: la ceja sube y/o inclina y vuelve a su sitio.
    const envelope = Math.sin((phase / duration) * Math.PI);

    if (raise) {
      bone.position[EYEBROW_LIFT_AXIS] += envelope * liftAmount;
    }
    if (tilt) {
      eulerScratch.set(0, 0, 0);
      eulerScratch[EYEBROW_TILT_AXIS] = envelope * tiltAngle;
      offsetScratch.setFromEuler(eulerScratch);
      // premultiply = giro en el frame del padre (≈ mundo), no en el local:
      // ambas cejas rotan dentro del plano de la cara sin escorzarse.
      bone.quaternion.premultiply(offsetScratch);
    }
  });
}
