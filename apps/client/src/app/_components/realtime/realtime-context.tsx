'use client';

import { createContext, useContext } from 'react';
import type { ReminderAlert } from './use-reminder-socket';

export interface RealtimeContextValue {
  /** Avisos activos (para los toasts); `ReminderAlerts` los renderiza y descarta. */
  alerts: ReminderAlert[];
  /** Timestamp del último `'reminder'` recibido; cambia en cada disparo (nonce para que el robot reaccione). */
  lastFired: number | null;
  dismissAlert: (id: string) => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

/** Solo lo usa `RealtimeProvider`, que es quien conoce el valor real. */
export const RealtimeContextProvider = RealtimeContext.Provider;

/**
 * Estado del realtime de recordatorios: la lista de avisos activos y el
 * nonce del último disparo. Lo consumen `ReminderAlerts` (toasts) y
 * `CalendarRobot` (reacción `notify`). Debe usarse dentro de `<RealtimeProvider>`.
 */
export function useReminderRealtime(): RealtimeContextValue {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useReminderRealtime debe usarse dentro de <RealtimeProvider>');
  return ctx;
}
