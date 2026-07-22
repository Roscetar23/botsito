/**
 * Contrato del evento de dominio que emite `reminders` cuando un recordatorio
 * se dispara a su hora, y que escucha `notifications` para avisar al usuario.
 * Vive en `shared` para que ninguno de los dos dominios dependa del otro
 * (solo comparten este tipo). El transporte es `@nestjs/event-emitter`.
 */
export const REMINDER_FIRED_EVENT = 'reminder.fired';

/** Payload de {@link REMINDER_FIRED_EVENT}. */
export interface ReminderFiredEvent {
  /** Dueño del recordatorio (sala/room a la que se emite por WebSocket). */
  ownerId: string;
  reminderId: string;
  /** Día de la ocurrencia que se disparó (`YYYY-MM-DD`). */
  occurrenceDate: string;
  text: string;
  /** `ReminderType` como string (shared no depende de `reminders-model`). */
  type: string;
}
