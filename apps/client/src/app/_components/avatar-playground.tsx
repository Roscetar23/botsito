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
  // Modo de control del 3D: por emoción (el muñeco se expresa solo) o
  // manual (toggles de calibración por gesto).
  const [drive, setDrive] = useState<'emotion' | 'manual'>('emotion');
  const [emotion, setEmotion] = useState<AvatarState>('idle');
  // Modo manual: todos los gestos arrancan en OFF (se encienden a mano al calibrar).
  const [playClip, setPlayClip] = useState(false);
  const [gestures, setGestures] = useState(false);
  const [gesturesLeft, setGesturesLeft] = useState(false);
  const [blinkLeft, setBlinkLeft] = useState(false);
  const [blinkRight, setBlinkRight] = useState(false);
  const [eyebrowLeft, setEyebrowLeft] = useState(false);
  const [eyebrowRight, setEyebrowRight] = useState(false);
  const [eyebrowTilt, setEyebrowTilt] = useState(false);
  const [eyebrowAngry, setEyebrowAngry] = useState(false);
  const [mouth, setMouth] = useState(false);

  return (
    <section className={styles.playground}>
      <div className={styles.controls}>
        <ModeToggle mode={mode} onChange={setMode} />
        {mode === '3d' && (
          <>
            <div className={styles.threeControlsRow} role="group" aria-label="Modo de control 3D">
              <button
                type="button"
                aria-pressed={drive === 'emotion'}
                onClick={() => setDrive('emotion')}
                className={`${styles.handsButton} ${drive === 'emotion' ? styles.handsButtonActive : ''}`.trim()}
              >
                Emociones
              </button>
              <button
                type="button"
                aria-pressed={drive === 'manual'}
                onClick={() => setDrive('manual')}
                className={`${styles.handsButton} ${drive === 'manual' ? styles.handsButtonActive : ''}`.trim()}
              >
                Manual (calibrar)
              </button>
            </div>
            {drive === 'emotion' ? (
              <StateButtons active={emotion} onSelect={setEmotion} />
            ) : (
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
                eyebrowAngry={eyebrowAngry}
                onToggleEyebrowAngry={() => setEyebrowAngry((prev) => !prev)}
                mouth={mouth}
                onToggleMouth={() => setMouth((prev) => !prev)}
              />
            )}
            <p className={styles.hint3d}>
              {drive === 'emotion'
                ? 'Elige una emoción y el muñeco se expresa solo'
                : 'Enciende/apaga cada gesto para calibrarlo por separado'}
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
            {...(drive === 'emotion'
              ? { state: emotion }
              : {
                  gestures,
                  gesturesLeft,
                  blinkLeft,
                  blinkRight,
                  eyebrowLeft,
                  eyebrowRight,
                  eyebrowTilt,
                  eyebrowAngry,
                  mouth,
                })}
          />
        </div>
      )}
    </section>
  );
}
