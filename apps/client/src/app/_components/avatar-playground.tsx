'use client';

import { useState } from 'react';
import { Avatar } from '@asistente/avatar-ui';
import type { AvatarState } from '@asistente/avatar-model';
import { StateButtons } from './state-buttons';
import styles from './avatar-playground.module.css';

/**
 * Panel de pruebas del avatar: lo muestra en grande y permite cambiar su
 * `AvatarState` desde una fila de botones, sin lógica de negocio (solo
 * estado local de UI).
 */
export function AvatarPlayground() {
  const [state, setState] = useState<AvatarState>('idle');

  return (
    <section className={styles.playground}>
      <div className={styles.stage}>
        <Avatar state={state} size={340} />
      </div>
      <StateButtons active={state} onSelect={setState} />
    </section>
  );
}
