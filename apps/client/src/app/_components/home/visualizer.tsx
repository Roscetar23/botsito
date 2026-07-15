'use client';

import { useState } from 'react';
import type { AvatarState } from '@asistente/avatar-model';
// `Avatar` (2D) es SSR-safe y se importa estático, como en `avatar-playground.tsx`.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { Avatar } from '@asistente/avatar-ui';
import { ModeToggle } from '../mode-toggle';
import type { AvatarMode } from '../mode-toggle';
import { StateButtons } from '../state-buttons';
import { VisualizerRoam } from './visualizer-roam';
import styles from './visualizer.module.css';

const AVATAR_SIZE = 320;

/**
 * Área principal de la Home. En 2D: tarjeta compacta centrada con el avatar
 * y los botones de emoción (sin cambios). En 3D: el robot deambula llenando
 * el `main` de la Home, delegado a `VisualizerRoam`. El estado (`mode` y
 * `emotion`) vive aquí porque lo comparten ambas presentaciones: la misma
 * `emotion` no se pierde al alternar de modo.
 */
export function Visualizer() {
  const [mode, setMode] = useState<AvatarMode>('2d');
  const [emotion, setEmotion] = useState<AvatarState>('idle');

  if (mode === '3d') {
    return (
      <VisualizerRoam
        mode={mode}
        onModeChange={setMode}
        emotion={emotion}
        onEmotionChange={setEmotion}
      />
    );
  }

  return (
    <section className={styles.card}>
      <header className={styles.head}>
        <div>
          <p className={styles.kicker}>Visualizador</p>
          <h2 className={styles.title}>Botcito</h2>
        </div>
        <ModeToggle mode={mode} onChange={setMode} />
      </header>

      <div className={styles.stage}>
        <Avatar state={emotion} size={AVATAR_SIZE} />
      </div>

      <StateButtons active={emotion} onSelect={setEmotion} />
    </section>
  );
}
