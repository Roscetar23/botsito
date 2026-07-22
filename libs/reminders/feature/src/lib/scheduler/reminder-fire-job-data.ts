import { ReminderType } from '@asistente/reminders-model';

/** Nombre del job de Agenda que dispara un recordatorio. */
export const REMINDER_FIRE_JOB = 'reminder-fire';

/**
 * Datos que viaja con cada job `reminder-fire`. F-2 (notifications) los
 * usará para emitir el evento hacia el cliente; por ahora el handler solo
 * los loguea.
 */
export interface ReminderFireJobData {
  reminderId: string;
  ownerId: string;
  /** YYYY-MM-DD de la ocurrencia concreta que se dispara. */
  occurrenceDate: string;
  text: string;
  type: ReminderType;
}
