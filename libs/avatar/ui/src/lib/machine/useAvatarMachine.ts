'use client';

import type { AvatarState, BrowsVariant, MouthVariant } from '@asistente/avatar-model';
import { AVATAR_EXPRESSIONS } from '@asistente/avatar-model';
import { useBlink } from '../behaviors/useBlink.js';
import { useSpeaking } from '../behaviors/useSpeaking.js';

/** Directivas visuales resueltas que las partes del rig consumen directamente. */
export interface AvatarDirectives {
  mouth: MouthVariant;
  brows: BrowsVariant;
  eyesClosed: boolean;
  bounce: boolean;
  glow: boolean;
  headTilt: number;
}

/**
 * Combina la expresión estática de `AVATAR_EXPRESSIONS[state]` con
 * comportamientos en vivo (parpadeo aleatorio, alternancia de boca al
 * hablar) para producir las directivas finales del rig en cada render.
 */
export function useAvatarMachine(state: AvatarState, blinkEnabled = true): AvatarDirectives {
  const expression = AVATAR_EXPRESSIONS[state];
  const eyesClosed = useBlink(blinkEnabled);
  const mouth = useSpeaking(state === 'speaking', expression.mouth);

  return {
    mouth,
    brows: expression.brows,
    eyesClosed,
    bounce: Boolean(expression.bounce),
    glow: Boolean(expression.glow),
    headTilt: expression.headTilt ?? 0,
  };
}
