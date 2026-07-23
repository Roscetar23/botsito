/**
 * Utilidades puras de fecha para la rejilla del calendario. Sin dependencias:
 * el calendario solo necesita aritmética de mes y formato en español, y una
 * lib (date-fns/luxon) no compensa aquí. La semana empieza en **lunes**.
 */

export const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const WEEKDAYS_LONG = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** Una celda de la rejilla: seis semanas × siete días, incluidos los bordes. */
export interface CalendarDay {
  /** Clave estable `YYYY-MM-DD`; se usa para indexar eventos y como `key`. */
  key: string;
  date: Date;
  dayOfMonth: number;
  /** `false` en los días de relleno del mes anterior/siguiente. */
  inMonth: boolean;
  isToday: boolean;
  /** Día anterior a hoy: se puede abrir/ver, pero no crear recordatorios. */
  isPast: boolean;
}

/** Medianoche local: normaliza para comparar días sin que estorbe la hora. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function dateKey(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function monthName(date: Date): string {
  return MONTHS[date.getMonth()];
}

/** `Junio 2026` — con la inicial en mayúscula, como en el mockup. */
export function monthLabel(date: Date): string {
  const name = monthName(date);
  return `${name[0].toUpperCase()}${name.slice(1)} ${date.getFullYear()}`;
}

/** `lunes · Junio de 2026` — subtítulo del modal del día. */
export function dayLongLabel(date: Date): string {
  const weekday = WEEKDAYS_LONG[date.getDay()];
  const name = monthName(date);
  return `${weekday} · ${name[0].toUpperCase()}${name.slice(1)} de ${date.getFullYear()}`;
}

export function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/** Índice del día de la semana con lunes = 0 (JS usa domingo = 0). */
function mondayFirstIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/**
 * Construye las 42 celdas (6 semanas) del mes de `cursor`, rellenando con los
 * días vecinos para que la rejilla siempre tenga la misma altura y no salte al
 * cambiar de mes. `today` se inyecta para mantener la función pura y testeable.
 */
export function buildMonthGrid(cursor: Date, today: Date): CalendarDay[] {
  const first = startOfMonth(cursor);
  const gridStart = new Date(first);
  gridStart.setDate(1 - mondayFirstIndex(first));

  const todayKey = dateKey(today);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
    const key = dateKey(date);
    return {
      key,
      date,
      dayOfMonth: date.getDate(),
      inMonth: date.getMonth() === first.getMonth(),
      isToday: key === todayKey,
      // `date` y `today` están a medianoche local, así que esto es "antes de
      // hoy" (hoy no cuenta como pasado — sí se puede crear para más tarde).
      isPast: date.getTime() < today.getTime(),
    };
  });
}
