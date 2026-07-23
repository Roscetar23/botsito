'use client';

import { useAuth } from '@asistente/auth-ui';
import { useCallback, useEffect, useState } from 'react';
import type { Task } from '@asistente/tasks-model';
import { fetchTasks } from './tasks-api';

export interface UseTasksResult {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  /** Vuelve a pedir las tareas (p. ej. tras crear/editar una). */
  refetch: () => void;
}

/**
 * Estado de las tareas del usuario: carga desde el backend con el
 * `accessToken` de la sesión y expone un `refetch` para refrescar tras
 * mutaciones (alta rápida, futura edición). Ver `useCalendarMonth` (patrón
 * hermano para recordatorios).
 */
export function useTasks(): UseTasksResult {
  const { accessToken } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    if (!accessToken) {
      setTasks([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchTasks(accessToken)
      .then((result) => {
        if (!cancelled) setTasks(result);
      })
      .catch((err: unknown) => {
        console.error('No se pudieron cargar las tareas', err);
        if (!cancelled) setError('No se pudieron cargar las tareas.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, reloadTick]);

  const refetch = useCallback(() => setReloadTick((tick) => tick + 1), []);

  return { tasks, loading, error, refetch };
}
