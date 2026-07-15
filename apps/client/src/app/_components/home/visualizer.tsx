'use client';

import { useState } from 'react';
import type { AvatarState } from '@asistente/avatar-model';
// `Avatar` (2D) es SSR-safe y se importa estático, como en `avatar-playground.tsx`.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { Avatar } from '@asistente/avatar-ui';
import { Avatar3DLazy } from '../avatar-3d-lazy';
import { ModeToggle } from '../mode-toggle';
import type { AvatarMode } from '../mode-toggle';
import { StateButtons } from '../state-buttons';
import styles from './visualizer.module.css';

const AVATAR_SIZE = 320;
const CAMERA_Z = 12.5;

/**
 * Área principal de la Home: el avatar (2D o 3D, alternable con
 * `<ModeToggle>`) reacciona a los botones de emoción (`<StateButtons>`). La
 * misma `emotion` alimenta ambos modos, así que no se pierde al alternar.
 * Sin controles de calibración manual (eso vive solo en
 * `avatar-playground.tsx`, que queda de referencia sin usarse aquí).
 */
export function Visualizer() {
  const [mode, setMode] = useState<AvatarMode>('2d');
  const [emotion, setEmotion] = useState<AvatarState>('idle');

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
        {mode === '2d' ? (
          <Avatar state={emotion} size={AVATAR_SIZE} />
        ) : (
          <Avatar3DLazy
            state={emotion}
            playClip={false}
            interactive
            size={AVATAR_SIZE}
            cameraZ={CAMERA_Z}
          />
        )}
      </div>

      <StateButtons active={emotion} onSelect={setEmotion} />
    </section>
  );
}
