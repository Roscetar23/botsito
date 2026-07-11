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
  blinkRight: boolean;
  onToggleBlinkRight: () => void;
  eyebrowLeft: boolean;
  onToggleEyebrowLeft: () => void;
  eyebrowRight: boolean;
  onToggleEyebrowRight: () => void;
  eyebrowTilt: boolean;
  onToggleEyebrowTilt: () => void;
  eyebrowAngry: boolean;
  onToggleEyebrowAngry: () => void;
}

/**
 * Toggles de calibración del 3D: permiten aislar la animación baked de
 * Blender (`playClip`), el saludo procedural por código de cada mano
 * (`gestures` = derecha, `gesturesLeft` = izquierda), el parpadeo de cada
 * ojo (`blinkLeft`/`blinkRight`) y el gesto de cada ceja
 * (`eyebrowLeft`/`eyebrowRight`) para verlos por separado.
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
  blinkRight,
  onToggleBlinkRight,
  eyebrowLeft,
  onToggleEyebrowLeft,
  eyebrowRight,
  onToggleEyebrowRight,
  eyebrowTilt,
  onToggleEyebrowTilt,
  eyebrowAngry,
  onToggleEyebrowAngry,
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
      <button
        type="button"
        aria-pressed={blinkRight}
        onClick={onToggleBlinkRight}
        className={`${styles.handsButton} ${blinkRight ? styles.handsButtonActive : ''}`.trim()}
      >
        Parpadeo ojo der.: {blinkRight ? 'ON' : 'OFF'}
      </button>
      <button
        type="button"
        aria-pressed={eyebrowLeft}
        onClick={onToggleEyebrowLeft}
        className={`${styles.handsButton} ${eyebrowLeft ? styles.handsButtonActive : ''}`.trim()}
      >
        Ceja izq.: {eyebrowLeft ? 'ON' : 'OFF'}
      </button>
      <button
        type="button"
        aria-pressed={eyebrowRight}
        onClick={onToggleEyebrowRight}
        className={`${styles.handsButton} ${eyebrowRight ? styles.handsButtonActive : ''}`.trim()}
      >
        Ceja der.: {eyebrowRight ? 'ON' : 'OFF'}
      </button>
      <button
        type="button"
        aria-pressed={eyebrowTilt}
        onClick={onToggleEyebrowTilt}
        className={`${styles.handsButton} ${eyebrowTilt ? styles.handsButtonActive : ''}`.trim()}
      >
        Inclinar cejas: {eyebrowTilt ? 'ON' : 'OFF'}
      </button>
      <button
        type="button"
        aria-pressed={eyebrowAngry}
        onClick={onToggleEyebrowAngry}
        className={`${styles.handsButton} ${eyebrowAngry ? styles.handsButtonActive : ''}`.trim()}
      >
        Fruncir (enojo): {eyebrowAngry ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}
