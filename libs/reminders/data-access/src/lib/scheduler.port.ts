import { Reminder } from '@asistente/reminders-model';

/**
 * Puerto de scheduling para recordatorios.
 *
 * El dominio (RemindersService) solo conoce esta interfaz, nunca la
 * librería concreta de jobs. Hoy la implementa `AgendaScheduler`
 * (paquete `agenda` sobre el mismo Mongo); mañana podría migrarse a
 * BullMQ/Redis u otro motor sin tocar `model`/`feature`.
 */
export interface SchedulerPort {
  /** Programa un job por cada ocurrencia futura del recordatorio. */
  scheduleReminder(reminder: Reminder): Promise<void>;

  /** Cancela todos los jobs pendientes asociados a ese recordatorio. */
  cancelReminder(reminderId: string): Promise<void>;
}

/** Token de inyección de Nest para el {@link SchedulerPort}. */
export const SCHEDULER_PORT = Symbol('SCHEDULER_PORT');
