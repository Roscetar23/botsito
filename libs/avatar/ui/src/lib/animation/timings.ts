import type { Transition } from 'framer-motion';

/** Color de acento del halo de `notify`. */
export const ACCENT_COLOR = '#6C5CE7';

/** Ventana aleatoria entre parpadeos y duración del cierre. */
export const BLINK_MIN_MS = 2500;
export const BLINK_MAX_MS = 5000;
export const BLINK_CLOSED_MS = 110;

/** Periodo de la respiración idle (segundos). */
export const BREATHE_PERIOD_S = 4;

/** Intervalo de alternancia de boca mientras `speaking`. */
export const SPEAKING_MOUTH_INTERVAL_MS = 130;

/** Spring para inclinación de cabeza / transiciones de todo el rig. */
export const HEAD_SPRING: Transition = { type: 'spring', stiffness: 120, damping: 14 };

/** Spring para partes pequeñas (cejas, boca, manos). */
export const PART_SPRING: Transition = { type: 'spring', stiffness: 260, damping: 18 };

/** Crossfade rápido (parpadeo, swap de boca). */
export const CROSSFADE: Transition = { duration: 0.09, ease: 'easeInOut' };

/** Rebote en bucle usado por `notify`. */
export const NOTIFY_BOUNCE: Transition = {
  duration: 0.6,
  repeat: Infinity,
  repeatType: 'reverse',
  ease: 'easeInOut',
};

/** Bob sutil de manos en idle. */
export const HANDS_IDLE_BOB: Transition = {
  duration: 2.6,
  repeat: Infinity,
  repeatType: 'reverse',
  ease: 'easeInOut',
};

/** Bob más vivo de manos en `notify`/`happy`. */
export const HANDS_ACTIVE_BOB: Transition = {
  duration: 0.7,
  repeat: Infinity,
  repeatType: 'reverse',
  ease: 'easeInOut',
};
