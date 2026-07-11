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
import { ThreeControls } from './three-controls';
import { Avatar3DLazy } from './avatar-3d-lazy';
import styles from './avatar-playground.module.css';

/**
 * Panel de pruebas del avatar: alterna entre el rig 2D (con botones de
 * `AvatarState`) y el renderer 3D (modelo GLB que levita, sigue el cursor
 * y permite calibrar por separado la animación baked de Blender y los
 * gestos procedurales por código). Sin lógica de negocio: solo estado
 * local de UI.
 */
export function AvatarPlayground() {
  const [mode, setMode] = useState<AvatarMode>('2d');
  const [state, setState] = useState<AvatarState>('idle');
  const [playClip, setPlayClip] = useState(true);
  const [gestures, setGestures] = useState(true);
  const [gesturesLeft, setGesturesLeft] = useState(true);
  const [blinkLeft, setBlinkLeft] = useState(true);
  const [blinkRight, setBlinkRight] = useState(true);
  const [eyebrowLeft, setEyebrowLeft] = useState(true);
  const [eyebrowRight, setEyebrowRight] = useState(true);
  const [eyebrowTilt, setEyebrowTilt] = useState(true);

  return (
    <section className={styles.playground}>
      <div className={styles.controls}>
        <ModeToggle mode={mode} onChange={setMode} />
        {mode === '3d' && (
          <>
            <ThreeControls
              playClip={playClip}
              onTogglePlayClip={() => setPlayClip((prev) => !prev)}
              gestures={gestures}
              onToggleGestures={() => setGestures((prev) => !prev)}
              gesturesLeft={gesturesLeft}
              onToggleGesturesLeft={() => setGesturesLeft((prev) => !prev)}
              blinkLeft={blinkLeft}
              onToggleBlinkLeft={() => setBlinkLeft((prev) => !prev)}
              blinkRight={blinkRight}
              onToggleBlinkRight={() => setBlinkRight((prev) => !prev)}
              eyebrowLeft={eyebrowLeft}
              onToggleEyebrowLeft={() => setEyebrowLeft((prev) => !prev)}
              eyebrowRight={eyebrowRight}
              onToggleEyebrowRight={() => setEyebrowRight((prev) => !prev)}
              eyebrowTilt={eyebrowTilt}
              onToggleEyebrowTilt={() => setEyebrowTilt((prev) => !prev)}
            />
            <p className={styles.hint3d}>
              Enciende/apaga cada mano o el clip para verlos por separado
            </p>
          </>
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
          <Avatar3DLazy
            fullscreen
            roam
            playClip={playClip}
            gestures={gestures}
            gesturesLeft={gesturesLeft}
            blinkLeft={blinkLeft}
            blinkRight={blinkRight}
            eyebrowLeft={eyebrowLeft}
            eyebrowRight={eyebrowRight}
            eyebrowTilt={eyebrowTilt}
          />
        </div>
      )}
    </section>
  );
}
