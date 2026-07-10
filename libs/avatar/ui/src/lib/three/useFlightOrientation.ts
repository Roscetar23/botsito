'use client';

import { useRef } from 'react';

const MAX_YAW_RAD = 1.1;
const MAX_ROLL_RAD = 0.15;
const MAX_PITCH_RAD = 0.12;

/** rad de giro por cada unidad/seg de velocidad, antes del clamp. */
const YAW_GAIN = 1.6;
const ROLL_GAIN = 0.22;
const PITCH_GAIN = 0.2;

/** Suavizado de la orientación resultante (independiente del framerate). */
const ORIENTATION_LERP_SPEED = 6;

export interface FlightOrientation {
  yaw: number;
  roll: number;
  pitch: number;
}

export interface FlightOrientationController {
  orientation: { current: FlightOrientation };
  update: (x: number, y: number, delta: number) => void;
}

function clamp(value: number, limit: number): number {
  return Math.min(Math.max(value, -limit), limit);
}

/**
 * Orienta el personaje según su **desplazamiento** (no según el cursor):
 * cuadro a cuadro calcula la velocidad (delta de posición / delta de
 * tiempo) y la mapea a `yaw` (gira hacia donde se mueve → se ve de lado
 * en tramos rápidos; cuando la trayectoria gira, la velocidad cae y
 * queda de frente de forma natural), más un leve `roll` de "banqueo" y
 * un `pitch` sutil por velocidad vertical. Todo suavizado con lerp para
 * que no salte entre frames.
 *
 * No es un hook de estado de React (no re-renderiza): guarda todo en
 * refs para poder llamarse desde un `useFrame` en cada tick.
 */
export function useFlightOrientation(): FlightOrientationController {
  const orientation = useRef<FlightOrientation>({ yaw: 0, roll: 0, pitch: 0 });
  const previous = useRef<{ x: number; y: number } | null>(null);

  function update(x: number, y: number, delta: number): void {
    const last = previous.current;
    previous.current = { x, y };
    if (!last || delta <= 0) return;

    const vx = (x - last.x) / delta;
    const vy = (y - last.y) / delta;

    const targetYaw = clamp(vx * YAW_GAIN, MAX_YAW_RAD);
    const targetRoll = clamp(vx * ROLL_GAIN, MAX_ROLL_RAD);
    const targetPitch = clamp(-vy * PITCH_GAIN, MAX_PITCH_RAD);

    const t = Math.min(1, ORIENTATION_LERP_SPEED * delta);
    const current = orientation.current;
    current.yaw += (targetYaw - current.yaw) * t;
    current.roll += (targetRoll - current.roll) * t;
    current.pitch += (targetPitch - current.pitch) * t;
  }

  return { orientation, update };
}
