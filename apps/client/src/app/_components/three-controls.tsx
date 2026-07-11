'use client';

import styles from './avatar-playground.module.css';

export interface ThreeControlsProps {
  playClip: boolean;
  onTogglePlayClip: () => void;
  gestures: boolean;
  onToggleGestures: () => void;
  gesturesLeft: boolean;
  onToggleGesturesLeft: () => void;
}

/**
 * Toggles de calibración del 3D: permiten aislar la animación baked de
 * Blender (`playClip`) del saludo procedural por código de cada mano
 * (`gestures` = derecha, `gesturesLeft` = izquierda) para verlos por
 * separado.
 */
export function ThreeControls({
  playClip,
  onTogglePlayClip,
  gestures,
  onToggleGestures,
  gesturesLeft,
  onToggleGesturesLeft,
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
    </div>
  );
}
