'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { ReminderFiredEvent } from '@asistente/shared-types';
import { playDing } from './play-ding';

/** URL del gateway Socket.IO (mismo host que la API); fallback a :3001 en local. */
const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001';

/** Un `ReminderFiredEvent` recibido, con datos propios del cliente para la lista de toasts. */
export interface ReminderAlert extends ReminderFiredEvent {
  /** Clave estable para React y para descartar el aviso concreto. */
  id: string;
  /** `Date.now()` de cuando llegó (el payload no trae hora, solo el día). */
  firedAt: number;
}

/**
 * Conecta el socket de notificaciones autenticado con `accessToken` (handshake
 * `{ auth: { token } }`) y escucha `'reminder'`. Reconecta si el token cambia
 * (nueva sesión) y desconecta siempre al desmontar o antes de reconectar.
 * Decorativo respecto al CRUD de recordatorios: sin token no conecta, y
 * cualquier error de conexión solo se registra (nunca rompe la app).
 */
export function useReminderSocket(accessToken: string | null) {
  const [alerts, setAlerts] = useState<ReminderAlert[]>([]);
  const [lastFired, setLastFired] = useState<number | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!accessToken) return undefined;

    let socket: Socket;
    try {
      socket = io(WS_URL, { auth: { token: accessToken }, transports: ['websocket', 'polling'] });
    } catch (err) {
      console.warn('[realtime] no se pudo iniciar el socket de recordatorios', err);
      return undefined;
    }
    socketRef.current = socket;

    socket.on('connect_error', (err: Error) => {
      console.warn('[realtime] error de conexión del socket de recordatorios', err.message);
    });

    socket.on('reminder', (payload: ReminderFiredEvent) => {
      playDing();
      const firedAt = Date.now();
      setAlerts((prev) => [...prev, { ...payload, id: `${payload.reminderId}-${firedAt}`, firedAt }]);
      setLastFired(firedAt);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken]);

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  return { alerts, lastFired, dismissAlert };
}
