import { ReminderFrequency } from './reminder-frequency.enum.js';

export interface ReminderOccurrencesInput {
  /** YYYY-MM-DD */
  date: string;
  frequency: ReminderFrequency;
  count: number;
}

/**
 * Calcula las fechas (YYYY-MM-DD) de las ocurrencias de un recordatorio.
 * Trabaja siempre en UTC para evitar corrimientos por zona horaria del
 * proceso que ejecuta el código (no usa librerías de fechas).
 */
export function reminderOccurrences(input: ReminderOccurrencesInput): string[] {
  const { date, frequency, count } = input;
  const [year, month, day] = parseIsoDate(date);

  if (frequency === ReminderFrequency.Once) {
    return [date];
  }

  const occurrences: string[] = [];
  for (let i = 0; i < count; i++) {
    occurrences.push(computeOccurrence(year, month, day, frequency, i));
  }
  return occurrences;
}

function computeOccurrence(
  year: number,
  month: number,
  day: number,
  frequency: ReminderFrequency,
  index: number,
): string {
  if (frequency === ReminderFrequency.Daily) {
    return formatIsoDate(Date.UTC(year, month - 1, day + index));
  }

  if (frequency === ReminderFrequency.Weekly) {
    return formatIsoDate(Date.UTC(year, month - 1, day + index * 7));
  }

  // Monthly: sumamos meses al índice 0-based y luego reconstruimos el año
  // y mes de destino manualmente (en vez de dejar que Date.UTC "desborde"
  // el día). Decisión: si el mes destino tiene menos días que el día base
  // (ej. 31-ene + 1 mes -> feb no tiene día 31), se recorta ("clamp") al
  // último día de ese mes (28/29-feb) en vez de correr al mes siguiente
  // (evita que "31" se convierta en "2 o 3 de marzo").
  const totalMonths = month - 1 + index;
  const targetYear = year + Math.floor(totalMonths / 12);
  const targetMonthIndex0 = ((totalMonths % 12) + 12) % 12;
  const targetDay = Math.min(day, daysInMonth(targetYear, targetMonthIndex0));
  return formatIsoDate(Date.UTC(targetYear, targetMonthIndex0, targetDay));
}

function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

function parseIsoDate(date: string): [number, number, number] {
  const [year, month, day] = date.split('-').map(Number);
  return [year, month, day];
}

function formatIsoDate(ms: number): string {
  const d = new Date(ms);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
