import type { Variants } from 'framer-motion';
import type { AvatarState, BrowsVariant } from '@asistente/avatar-model';
import { AVATAR_EXPRESSIONS } from '@asistente/avatar-model';
import { ACCENT_COLOR, HEAD_SPRING } from './timings.js';

function glowFilter(active?: boolean): string {
  return active
    ? `drop-shadow(0 0 18px ${ACCENT_COLOR}) drop-shadow(0 0 6px ${ACCENT_COLOR})`
    : 'drop-shadow(0 0 0 transparent)';
}

function stateVariant(state: AvatarState) {
  const expr = AVATAR_EXPRESSIONS[state];
  return {
    rotate: expr.headTilt ?? 0,
    filter: glowFilter(expr.glow),
    transition: HEAD_SPRING,
  };
}

/**
 * Variantes del "rig" completo por `AvatarState`: inclinación de cabeza
 * (`rotate`) y halo de atención (`filter`). El rebote de `notify` se maneja
 * aparte (es un bucle infinito, no encaja bien como variante estática).
 */
export const rigVariants: Variants = {
  idle: stateVariant('idle'),
  listening: stateVariant('listening'),
  speaking: stateVariant('speaking'),
  thinking: stateVariant('thinking'),
  happy: stateVariant('happy'),
  sad: stateVariant('sad'),
  notify: stateVariant('notify'),
};

/** Desplazamiento/rotación del grupo de cejas según la emoción. */
export const browsOffset: Record<BrowsVariant, { y: number; rotate: number }> = {
  neutral: { y: 0, rotate: 0 },
  up: { y: -10, rotate: -3 },
  down: { y: 8, rotate: 4 },
};
