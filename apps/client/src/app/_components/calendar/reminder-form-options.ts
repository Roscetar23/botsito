import { ReminderFrequency, ReminderType } from '@asistente/reminders-model';

/** Etiquetas en español para el select de tipo, en el orden del enum. */
export const TYPE_LABELS: Record<ReminderType, string> = {
  [ReminderType.Medicina]: 'Medicina',
  [ReminderType.Cita]: 'Cita',
  [ReminderType.Tarea]: 'Tarea',
  [ReminderType.Personal]: 'Personal',
  [ReminderType.Otro]: 'Otro',
};

/** Etiquetas en español para el select de frecuencia, en el orden del enum. */
export const FREQUENCY_LABELS: Record<ReminderFrequency, string> = {
  [ReminderFrequency.Once]: 'Una vez',
  [ReminderFrequency.Daily]: 'Cada día',
  [ReminderFrequency.Weekly]: 'Cada semana',
  [ReminderFrequency.Monthly]: 'Cada mes',
};

/** Valida los campos mínimos en cliente antes de llamar a la API (el backend igual valida). */
export function validateReminderForm(time: string, text: string, count: number): string | null {
  if (!text.trim()) return 'Escribe el texto del recordatorio.';
  if (!time) return 'Elige una hora.';
  if (!Number.isInteger(count) || count < 1 || count > 365) {
    return 'El número de veces debe estar entre 1 y 365.';
  }
  return null;
}
