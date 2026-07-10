'use client';

import styles from './avatar-playground.module.css';

export type AvatarMode = '2d' | '3d';

export interface ModeToggleProps {
  mode: AvatarMode;
  onChange: (mode: AvatarMode) => void;
}

const MODES: ReadonlyArray<{ value: AvatarMode; label: string }> = [
  { value: '2d', label: '2D' },
  { value: '3d', label: '3D' },
];

/** Alterna entre el avatar 2D (rig por capas) y el 3D (modelo GLB). */
export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className={styles.modeRow} role="group" aria-label="Modo del avatar">
      {MODES.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          aria-pressed={mode === value}
          onClick={() => onChange(value)}
          className={`${styles.modeButton} ${mode === value ? styles.modeButtonActive : ''}`.trim()}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
