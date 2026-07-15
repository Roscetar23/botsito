'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  addMonths,
  buildMonthGrid,
  daysInMonth,
  monthLabel,
  monthName,
  startOfDay,
  startOfMonth,
} from './calendar-dates';
import { mockEventsFor } from './calendar-events';
import type { CalendarDay } from './calendar-dates';
import type { EventsByDay } from './calendar-events';

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
  goPrev: () => void;
  goNext: () => void;
  goToday: () => void;
}

/**
 * Estado del mes visible: navegación (anterior/siguiente/hoy), rejilla y los
 * eventos de ese mes. `today` se congela al montar en vez de recalcularse en
 * cada render: así "hoy" no cambia bajo los pies del usuario a medianoche y la
 * rejilla no depende de un valor que muta entre renders.
 */
export function useCalendarMonth(): CalendarMonth {
  const [today] = useState(() => startOfDay(new Date()));
  const [cursor, setCursor] = useState(() => startOfMonth(today));

  const days = useMemo(() => buildMonthGrid(cursor, today), [cursor, today]);
  const events = useMemo(() => mockEventsFor(cursor), [cursor]);

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
    goPrev,
    goNext,
    goToday,
  };
}
