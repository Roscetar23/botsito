'use client';

import type { AvatarState } from '@asistente/avatar-model';
import { Avatar3DLazy } from '../avatar-3d-lazy';
import { ModeToggle } from '../mode-toggle';
import type { AvatarMode } from '../mode-toggle';
import { StateButtons } from '../state-buttons';
import styles from './visualizer-roam.module.css';

interface VisualizerRoamProps {
  mode: AvatarMode;
  onModeChange: (mode: AvatarMode) => void;
  emotion: AvatarState;
  onEmotionChange: (state: AvatarState) => void;
}

/**
 * Presentación 3D del visualizador: el robot deambula (roam) llenando el
 * `main` de la Home —nunca la barra lateral ni la topbar— y sigue el cursor
 * mientras "camina". El canvas (`fullscreen`) vive en una capa absoluta sin
 * clics propios (`pointer-events: none`); los controles (toggle de modo y
 * emociones) flotan encima en su propia capa, con `pointer-events: auto`,
 * para poder volver a 2D o cambiar la emoción mientras el robot deambula.
 */
export function VisualizerRoam({ mode, onModeChange, emotion, onEmotionChange }: VisualizerRoamProps) {
  return (
    <div className={styles.field}>
      <div className={styles.canvasLayer} aria-hidden="true">
        <Avatar3DLazy fullscreen roam playClip={false} state={emotion} />
      </div>

      <header className={styles.head}>
        <div>
          <p className={styles.kicker}>Visualizador</p>
          <h2 className={styles.title}>Botcito</h2>
        </div>
        <ModeToggle mode={mode} onChange={onModeChange} />
      </header>

      <div className={styles.controls}>
        <StateButtons active={emotion} onSelect={onEmotionChange} />
      </div>
    </div>
  );
}
