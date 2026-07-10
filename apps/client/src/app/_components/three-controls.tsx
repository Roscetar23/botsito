'use client';

import styles from './avatar-playground.module.css';

export interface ThreeControlsProps {
  playClip: boolean;
  onTogglePlayClip: () => void;
  gestures: boolean;
  onToggleGestures: () => void;
}

/**
 * Toggles de calibración del 3D: permiten aislar la animación baked de
 * Blender (`playClip`) de los gestos procedurales por código (`gestures`)
 * para verlas por separado.
 */
export function ThreeControls({
  playClip,
  onTogglePlayClip,
  gestures,
  onToggleGestures,
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
        Gesto código (mío): {gestures ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}
