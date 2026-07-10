'use client';

import type { AvatarState } from '@asistente/avatar-model';
import styles from './avatar-playground.module.css';

export interface StateButtonsProps {
  active: AvatarState;
  onSelect: (state: AvatarState) => void;
}

const STATES: ReadonlyArray<{ value: AvatarState; label: string }> = [
  { value: 'idle', label: 'Reposo' },
  { value: 'listening', label: 'Escuchando' },
  { value: 'speaking', label: 'Hablando' },
  { value: 'thinking', label: 'Pensando' },
  { value: 'happy', label: 'Feliz' },
  { value: 'sad', label: 'Triste' },
  { value: 'notify', label: 'Notificación' },
];

/** Fila de botones para probar cada `AvatarState` del avatar. */
export function StateButtons({ active, onSelect }: StateButtonsProps) {
  return (
    <div className={styles.buttonRow} role="group" aria-label="Estados del avatar">
      {STATES.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          aria-pressed={active === value}
          onClick={() => onSelect(value)}
          className={`${styles.button} ${active === value ? styles.buttonActive : ''}`.trim()}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
