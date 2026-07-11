import type { AvatarState } from '@asistente/avatar-model';

/**
 * Banderas de gestos procedurales del robot 3D (`RobotModel`). Cada una
 * enciende un gesto por hueso; una **emoción** (`AvatarState`) es una
 * combinación de estas banderas — ver `gesturesForState`.
 */
export interface RobotGestureFlags {
  /** Saludo mano derecha (`Hueso.001`). */
  gestures: boolean;
  /** Saludo mano izquierda (`Hueso`). */
  gesturesLeft: boolean;
  /** Parpadeo ojo izquierdo (`Hueso cuerpo.003`). */
  blinkLeft: boolean;
  /** Parpadeo ojo derecho (`Hueso cuerpo.001`). */
  blinkRight: boolean;
  /** Ceja izquierda levantada (`Hueso cuerpo.005`). */
  eyebrowLeft: boolean;
  /** Ceja derecha levantada (`Hueso cuerpo.004`). */
  eyebrowRight: boolean;
  /** Inclinación de cejas adentro→afuera. */
  eyebrowTilt: boolean;
  /** Fruncido de cejas afuera→adentro (enojo). */
  eyebrowAngry: boolean;
  /** Boca hablando (`Hueso cuerpo.002`). */
  mouth: boolean;
}

/** Todo apagado: base sobre la que cada emoción enciende lo suyo. */
const NONE: RobotGestureFlags = {
  gestures: false,
  gesturesLeft: false,
  blinkLeft: false,
  blinkRight: false,
  eyebrowLeft: false,
  eyebrowRight: false,
  eyebrowTilt: false,
  eyebrowAngry: false,
  mouth: false,
};

/** Parpadeo de ambos ojos: presente en (casi) todas las emociones = "vida". */
const BLINK = { blinkLeft: true, blinkRight: true };
/** Ambas cejas levantadas (atención/ánimo). */
const BROWS_UP = { eyebrowLeft: true, eyebrowRight: true };

/**
 * Fuente de verdad del avatar 3D: qué gestos componen cada emoción.
 * Pensado para que el muñeco "se exprese solo" al recibir un `AvatarState`
 * (de eventos, del asistente, etc.) en vez de accionar gestos a mano.
 *
 * Notas de mapeo (el vocabulario de gestos es limitado, se aproxima):
 * - `sad` reutiliza el fruncido (`eyebrowAngry`) como cejas caídas/preocupadas.
 * - `thinking` usa la inclinación de cejas como gesto pensativo.
 */
const BY_STATE: Record<AvatarState, RobotGestureFlags> = {
  // Reposo: solo parpadea (tranquilo, pero vivo).
  idle: { ...NONE, ...BLINK },
  // Escuchando: atento, cejas arriba.
  listening: { ...NONE, ...BLINK, ...BROWS_UP },
  // Hablando: boca en movimiento.
  speaking: { ...NONE, ...BLINK, mouth: true },
  // Pensando: cejas inclinadas (gesto pensativo).
  thinking: { ...NONE, ...BLINK, eyebrowTilt: true },
  // Feliz: cejas arriba + saludo con ambas manos.
  happy: { ...NONE, ...BLINK, ...BROWS_UP, gestures: true, gesturesLeft: true },
  // Triste: cejas caídas/preocupadas (reutiliza el fruncido).
  sad: { ...NONE, ...BLINK, eyebrowAngry: true },
  // Notificación: llama la atención — saluda, habla y cejas arriba.
  notify: { ...NONE, ...BLINK, ...BROWS_UP, gestures: true, mouth: true },
};

/** Devuelve la combinación de gestos 3D que expresa una emoción/estado. */
export function gesturesForState(state: AvatarState): RobotGestureFlags {
  return BY_STATE[state];
}
