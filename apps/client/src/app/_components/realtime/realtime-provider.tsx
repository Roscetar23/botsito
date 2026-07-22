'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@asistente/auth-ui';
import { RealtimeContextProvider } from './realtime-context';
import { useReminderSocket } from './use-reminder-socket';
import { ReminderAlerts } from './reminder-alerts';

/**
 * Capa realtime app-wide (montada en la rama autenticada de `AppShell`, así
 * que funciona en cualquier vista): conecta el socket de notificaciones con
 * el `accessToken` de la sesión, publica el estado por contexto
 * (`useReminderRealtime`) y monta los toasts de aviso in-app aquí mismo,
 * flotando sobre lo que sea que renderice `children`.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { accessToken } = useAuth();
  const { alerts, lastFired, dismissAlert } = useReminderSocket(accessToken);

  return (
    <RealtimeContextProvider value={{ alerts, lastFired, dismissAlert }}>
      {children}
      <ReminderAlerts alerts={alerts} onDismiss={dismissAlert} />
    </RealtimeContextProvider>
  );
}
