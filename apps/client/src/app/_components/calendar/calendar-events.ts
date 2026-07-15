import { dateKey, daysInMonth } from './calendar-dates';

/**
 * Evento pintado en el calendario. **Provisional**: cuando exista el dominio
 * `reminders` en el backend (T-17/T-18 del PLAN), este tipo se sustituye por
 * el `Reminder` de `@asistente/reminders-model` y `useMonthEvents` pasará a
 * leer de la API en vez de este mock.
 */
export interface CalendarEvent {
  id: string;
  title: string;
  /** Hora local `HH:MM`; opcional porque un recordatorio puede ser de todo el día. */
  time?: string;
}

/** Eventos de un mes, indexados por `YYYY-MM-DD`. */
export type EventsByDay = Record<string, CalendarEvent[]>;

/** Plantilla de datos falsos: día del mes → eventos de ese día. */
const SAMPLE: { day: number; events: CalendarEvent[] }[] = [
  { day: 4, events: [{ id: 'a', title: 'Revisión de proyecto', time: '10:00' }] },
  {
    day: 12,
    events: [
      { id: 'b', title: 'Sprint de diseño', time: '09:30' },
      { id: 'c', title: 'Llamar al dentista', time: '17:00' },
    ],
  },
  { day: 18, events: [{ id: 'd', title: 'Prueba de integración', time: '12:00' }] },
  { day: 25, events: [{ id: 'e', title: 'Entrega de estimaciones', time: '16:00' }] },
];

/**
 * Datos de ejemplo del mes visible. Se generan **relativos al mes en pantalla**
 * (no a junio de 2026 como el mockup) para que la maqueta se vea poblada al
 * navegar entre meses. Los días que no existen en el mes se descartan.
 */
export function mockEventsFor(cursor: Date): EventsByDay {
  const total = daysInMonth(cursor);

  return SAMPLE.reduce<EventsByDay>((acc, { day, events }) => {
    if (day > total) return acc;
    const key = dateKey(new Date(cursor.getFullYear(), cursor.getMonth(), day));
    acc[key] = events;
    return acc;
  }, {});
}
