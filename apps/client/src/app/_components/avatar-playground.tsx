'use client';

import { useState } from 'react';
// `Avatar` (2D) is SSR-safe and stays a static import; only `Avatar3D`
// (WebGL) is lazy-loaded via `next/dynamic` in `avatar-3d-lazy.tsx`.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { Avatar } from '@asistente/avatar-ui';
import type { AvatarState } from '@asistente/avatar-model';
import { StateButtons } from './state-buttons';
import { ModeToggle } from './mode-toggle';
import type { AvatarMode } from './mode-toggle';
import { Avatar3DLazy } from './avatar-3d-lazy';
import styles from './avatar-playground.module.css';

/**
 * Panel de pruebas del avatar: alterna entre el rig 2D (con botones de
 * `AvatarState`) y el renderer 3D (modelo GLB que levita y sigue el
 * cursor, aún sin animaciones propias). Sin lógica de negocio: solo
 * estado local de UI.
 */
export function AvatarPlayground() {
  const [mode, setMode] = useState<AvatarMode>('2d');
  const [state, setState] = useState<AvatarState>('idle');

  return (
    <section className={styles.playground}>
      <ModeToggle mode={mode} onChange={setMode} />
      <div className={styles.stage}>
        {mode === '2d' ? (
          <Avatar state={state} size={340} />
        ) : (
          <Avatar3DLazy size={360} />
        )}
      </div>
      {mode === '2d' ? (
        <StateButtons active={state} onSelect={setState} />
      ) : (
        <p className={styles.hint3d}>Mueve el cursor · animaciones próximamente</p>
      )}
    </section>
  );
}
