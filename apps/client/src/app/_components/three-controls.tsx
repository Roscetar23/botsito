'use client';

import styles from './avatar-playground.module.css';

export interface ThreeControlsProps {
  playClip: boolean;
  onTogglePlayClip: () => void;
  gestures: boolean;
  onToggleGestures: () => void;
  gesturesLeft: boolean;
  onToggleGesturesLeft: () => void;
  blinkLeft: boolean;
  onToggleBlinkLeft: () => void;
}

/**
 * Toggles de calibración del 3D: permiten aislar la animación baked de
 * Blender (`playClip`), el saludo procedural por código de cada mano
 * (`gestures` = derecha, `gesturesLeft` = izquierda) y el parpadeo del
 * ojo izquierdo (`blinkLeft`) para verlos por separado.
 */
export function ThreeControls({
  playClip,
  onTogglePlayClip,
  gestures,
  onToggleGestures,
  gesturesLeft,
  onToggleGesturesLeft,
  blinkLeft,
  onToggleBlinkLeft,
}: ThreeControlsProps) {
  return (
    <div className={styles.threeControlsRow} role="group" aria-label="Controles de animación 3D">
      <button
        type="button"
        aria-pressed={playClip}
        onClick={onTogglePlayClip}
        className={`${styles.handsButton} ${playClip ? styles.handsButtonActive : ''}`.trim()}
      >
        Animación Blender (tuya): {playClip ? 'ON' : 'OFF'}
      </button>
      <button
        type="button"
        aria-pressed={gestures}
        onClick={onToggleGestures}
        className={`${styles.handsButton} ${gestures ? styles.handsButtonActive : ''}`.trim()}
      >
        Saludo mano der.: {gestures ? 'ON' : 'OFF'}
      </button>
      <button
        type="button"
        aria-pressed={gesturesLeft}
        onClick={onToggleGesturesLeft}
        className={`${styles.handsButton} ${gesturesLeft ? styles.handsButtonActive : ''}`.trim()}
      >
        Saludo mano izq.: {gesturesLeft ? 'ON' : 'OFF'}
      </button>
      <button
        type="button"
        aria-pressed={blinkLeft}
        onClick={onToggleBlinkLeft}
        className={`${styles.handsButton} ${blinkLeft ? styles.handsButtonActive : ''}`.trim()}
      >
        Parpadeo ojo izq.: {blinkLeft ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}
