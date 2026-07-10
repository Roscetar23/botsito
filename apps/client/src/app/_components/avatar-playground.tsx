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
      <div className={styles.controls}>
        <ModeToggle mode={mode} onChange={setMode} />
        {mode === '3d' && (
          <p className={styles.hint3d}>Mueve el cursor · animaciones próximamente</p>
        )}
      </div>

      {mode === '2d' ? (
        <>
          <div className={styles.stage}>
            <Avatar state={state} size={340} />
          </div>
          <StateButtons active={state} onSelect={setState} />
        </>
      ) : (
        // Capa ambiental: el robot flota sobre toda la pantalla sin
        // bloquear clics (pointer-events: none), por eso el toggle de
        // arriba sigue siendo interactivo aunque esta capa lo cubra.
        <div className={styles.stage3dFull} aria-hidden="true">
          <Avatar3DLazy fullscreen roam />
        </div>
      )}
    </section>
  );
}
