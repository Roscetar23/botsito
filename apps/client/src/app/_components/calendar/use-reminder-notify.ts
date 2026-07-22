'use client';

import { useEffect, useRef, useState } from 'react';
import type { AvatarState } from '@asistente/avatar-model';
import { useReminderRealtime } from '../realtime/realtime-context';

/** Cuánto dura la reacción `notify` antes de volver a `idle`. */
const NOTIFY_MS = 3000;

/**
 * Estado del robot del calendario según el realtime de recordatorios: ante
 * cada disparo nuevo (`lastFired` cambia de valor), pasa a `'notify'`
 * durante `NOTIFY_MS` y vuelve a `'idle'`. Timer limpiable; si llega otro
 * disparo mientras el anterior seguía activo, se reinicia sin solaparse.
 * No toca la coreografía de viaje/toque del robot (esto solo afecta al
 * `state` de expresión que recibe `Avatar3DLazy`).
 */
export function useReminderNotifyState(): AvatarState {
  const { lastFired } = useReminderRealtime();
  const [state, setState] = useState<AvatarState>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (lastFired === null) return undefined;

    setState('notify');
    timerRef.current = setTimeout(() => setState('idle'), NOTIFY_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [lastFired]);

  return state;
}
