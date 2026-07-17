import { reminderOccurrences } from '@asistente/reminders-model';
import type { Reminder } from '@asistente/reminders-model';

/**
 * Evento pintado en el calendario. Se construye a partir de las ocurrencias
 * de los `Reminder` reales (ver `remindersToEventsByDay`) que caen en el mes
 * visible.
 */
export interface CalendarEvent {
  id: string;
  title: string;
  /** Hora local `HH:mm`; opcional porque un recordatorio puede ser de todo el día. */
  time?: string;
}

/** Eventos de un mes, indexados por `YYYY-MM-DD`. */
export type EventsByDay = Record<string, CalendarEvent[]>;

/** `true` si `date` (YYYY-MM-DD) cae en el mismo año/mes que `monthCursor`. */
function isInMonth(date: string, monthCursor: Date): boolean {
  const [year, month] = date.split('-').map(Number);
  return year === monthCursor.getFullYear() && month === monthCursor.getMonth() + 1;
}

/**
 * Expande los `reminders` a sus ocurrencias, filtra las que caen en el mes de
 * `monthCursor` y las agrupa por día. Los eventos de cada día quedan
 * ordenados por `time` ascendente.
 */
export function remindersToEventsByDay(reminders: Reminder[], monthCursor: Date): EventsByDay {
  const byDay: EventsByDay = {};

  for (const reminder of reminders) {
    const occurrences = reminderOccurrences(reminder);
    for (const date of occurrences) {
      if (!isInMonth(date, monthCursor)) continue;
      const event: CalendarEvent = {
        id: `${reminder.id}:${date}`,
        title: reminder.text,
        time: reminder.time,
      };
      (byDay[date] ??= []).push(event);
    }
  }

  for (const events of Object.values(byDay)) {
    events.sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
  }

  return byDay;
}
