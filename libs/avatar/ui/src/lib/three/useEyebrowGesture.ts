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
/** Eje LOCAL del hueso sobre el que se INCLINA la ceja (fruncir/dudar). */
const EYEBROW_TILT_AXIS: 'x' | 'y' | 'z' = 'z';
/** Cada cuántos segundos se repite el gesto por defecto. */
const EYEBROW_PERIOD = 5;
/** Duración del gesto (s, `< period`); más largo que un parpadeo. */
const EYEBROW_DURATION = 1.2;
// ---------------------------------------------------------------------------

/**
 * Opciones por instancia: cada ceja puede personalizarse por separado.
 * Todo es opcional; lo que se omite usa el default de módulo. `tiltAngle`
 * es 0 por defecto (solo levanta); para fruncir se pasa un ángulo con
 * **signo opuesto en cada ceja** (están dibujadas en espejo).
 */
export interface EyebrowOptions {
  /** Cuánto sube (unidades de mundo). Default `EYEBROW_LIFT_AMOUNT`. */
  liftAmount?: number;
  /** Inclinación en `EYEBROW_TILT_AXIS` (rad) en el pico. Default 0. */
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
 * Gesto de ceja reutilizable y **personalizable por instancia**: levanta
 * (posición en `EYEBROW_LIFT_AXIS`, que al ser el padre identidad equivale
 * a subir en el mundo) y, opcionalmente, **inclina** (rotación en
 * `EYEBROW_TILT_AXIS`) el hueso `boneName`, todo escalado por una
 * envolvente 0→1→0. Captura la pose base (quaternion + position) una vez;
 * fuera de la ventana activa no toca el hueso (el clip manda el resto del
 * tiempo) — misma filosofía que `useWaveGesture`/`useBlinkGesture`.
 *
 * Se instancia una vez por ceja con sus propias `options`, de modo que
 * cada una es independiente: p. ej. subir ambas (sorpresa) o inclinarlas
 * con signo opuesto (enojo), ya que las cejas están dibujadas en espejo.
 *
 * Orden: llamar **después** de `useModelAnimation` en `RobotModel` (para
 * correr tras el `AnimationMixer`). Con `enabled=false` no toca el hueso.
 */
export function useEyebrowGesture(
  groupRef: RefObject<Group | null>,
  boneName: string,
  enabled: boolean,
  options: EyebrowOptions = {},
): void {
  const {
    liftAmount = EYEBROW_LIFT_AMOUNT,
    tiltAngle = 0,
    period = EYEBROW_PERIOD,
    duration = EYEBROW_DURATION,
    phaseOffset = 0,
  } = options;

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

    const phase = (state.clock.elapsedTime + phaseOffset) % period;
    if (phase >= duration) return;

    // Envolvente 0→1→0: la ceja sube (e inclina) y vuelve a su sitio.
    const envelope = Math.sin((phase / duration) * Math.PI);

    bone.position.copy(basePos);
    bone.position[EYEBROW_LIFT_AXIS] += envelope * liftAmount;

    if (tiltAngle !== 0) {
      eulerScratch.set(0, 0, 0);
      eulerScratch[EYEBROW_TILT_AXIS] = envelope * tiltAngle;
      offsetScratch.setFromEuler(eulerScratch);
      bone.quaternion.copy(baseQuat).multiply(offsetScratch);
    }
  });
}
