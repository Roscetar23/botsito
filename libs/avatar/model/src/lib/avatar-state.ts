/**
 * Estados posibles del avatar. Cada uno representa una emoción/actividad
 * completa que el rig traduce a una combinación de partes animadas.
 */
export type AvatarState =
  | 'idle'
  | 'listening'
  | 'speaking'
  | 'thinking'
  | 'happy'
  | 'sad'
  | 'notify';

/** Variantes de boca disponibles en el arte (una capa PNG por variante). */
export type MouthVariant = 'neutral' | 'talking' | 'happy';

/** Posición de las cejas como grupo (una sola capa, se traslada/rota). */
export type BrowsVariant = 'neutral' | 'up' | 'down';

/**
 * Metadatos de expresión por estado. El rig (`useAvatarMachine`) combina
 * esto con comportamientos en vivo (parpadeo, habla) para resolver las
 * directivas finales que reciben las partes.
 */
export interface AvatarExpression {
  mouth: MouthVariant;
  brows: BrowsVariant;
  /** Rebote de atención del conjunto (usado en `notify`). */
  bounce?: boolean;
  /** Halo/pulso de color alrededor del avatar (usado en `notify`). */
  glow?: boolean;
  /** Inclinación de cabeza en grados (positivo = hacia la derecha). */
  headTilt?: number;
}

/** Fuente de verdad: expresión asociada a cada `AvatarState`. */
export const AVATAR_EXPRESSIONS: Record<AvatarState, AvatarExpression> = {
  idle: { mouth: 'neutral', brows: 'neutral' },
  listening: { mouth: 'neutral', brows: 'up', headTilt: -4 },
  speaking: { mouth: 'talking', brows: 'up' },
  thinking: { mouth: 'neutral', brows: 'up', headTilt: 5 },
  happy: { mouth: 'happy', brows: 'up' },
  sad: { mouth: 'neutral', brows: 'down', headTilt: 3 },
  notify: { mouth: 'talking', brows: 'up', bounce: true, glow: true },
};
