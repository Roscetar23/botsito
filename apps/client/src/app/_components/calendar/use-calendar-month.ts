'use client';

import { useAuth } from '@asistente/auth-ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addMonths,
  buildMonthGrid,
  daysInMonth,
  monthLabel,
  monthName,
  startOfDay,
  startOfMonth,
} from './calendar-dates';
import { remindersToEventsByDay } from './calendar-events';
import { fetchReminders } from './reminders-api';
import type { CalendarDay } from './calendar-dates';
import type { EventsByDay } from './calendar-events';
import type { Reminder } from '@asistente/reminders-model';

export interface CalendarMonth {
  /** Primer día del mes visible. */
  cursor: Date;
  /** Las 42 celdas de la rejilla. */
  days: CalendarDay[];
  /** `Junio 2026`, para la cabecera de la tarjeta. */
  label: string;
  /** `junio`, en minúscula, para el título de la página. */
  name: string;
  totalDays: number;
  events: EventsByDay;
  /** Recordatorios crudos del mes (sin expandir), para la agenda del día (R-5b). */
  reminders: Reminder[];
  /** `true` mientras se están (re)cargando los recordatorios del mes. */
  loading: boolean;
  /** Vuelve a pedir los recordatorios (p.ej. tras crear uno en R-4). */
  refetch: () => void;
  goPrev: () => void;
  goNext: () => void;
  goToday: () => void;
}

/**
 * Estado del mes visible: navegación (anterior/siguiente/hoy), rejilla y los
 * eventos de ese mes (a partir de los recordatorios reales del backend).
 * `today` se congela al montar en vez de recalcularse en cada render: así
 * "hoy" no cambia bajo los pies del usuario a medianoche y la rejilla no
 * depende de un valor que muta entre renders.
 */
export function useCalendarMonth(): CalendarMonth {
  const { accessToken } = useAuth();
  const [today] = useState(() => startOfDay(new Date()));
  const [cursor, setCursor] = useState(() => startOfMonth(today));
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  const days = useMemo(() => buildMonthGrid(cursor, today), [cursor, today]);
  const events = useMemo(() => remindersToEventsByDay(reminders, cursor), [reminders, cursor]);

  useEffect(() => {
    if (!accessToken) {
      setReminders([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchReminders(accessToken)
      .then((result) => {
        if (!cancelled) setReminders(result);
      })
      .catch((error: unknown) => {
        // El calendario debe seguir navegable aunque falle la carga.
        console.error('No se pudieron cargar los recordatorios', error);
        if (!cancelled) setReminders([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, cursor, reloadTick]);

  const refetch = useCallback(() => setReloadTick((tick) => tick + 1), []);
  const goPrev = useCallback(() => setCursor((prev) => addMonths(prev, -1)), []);
  const goNext = useCallback(() => setCursor((prev) => addMonths(prev, 1)), []);
  const goToday = useCallback(() => setCursor(startOfMonth(today)), [today]);

  return {
    cursor,
    days,
    label: monthLabel(cursor),
    name: monthName(cursor),
    totalDays: daysInMonth(cursor),
    events,
    reminders,
    loading,
    refetch,
    goPrev,
    goNext,
    goToday,
  };
}
