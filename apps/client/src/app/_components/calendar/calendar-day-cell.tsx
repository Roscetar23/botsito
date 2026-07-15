'use client';

import type { CalendarDay } from './calendar-dates';
import type { CalendarEvent } from './calendar-events';
import styles from './calendar.module.css';

interface CalendarDayCellProps {
  day: CalendarDay;
  events: CalendarEvent[];
  onSelect: (day: CalendarDay) => void;
}

/** Cuántos chips caben antes de resumir el resto en "+N". */
const MAX_CHIPS = 2;

/**
 * Una celda de la rejilla: el número del día (resaltado en azul si es hoy) y
 * los chips de sus eventos. Es un `<button>` porque abre la agenda del día:
 * así entra en el orden de tabulación y responde a Enter/Espacio gratis.
 */
export function CalendarDayCell({ day, events, onSelect }: CalendarDayCellProps) {
  const visible = events.slice(0, MAX_CHIPS);
  const hidden = events.length - visible.length;

  const classes = [
    styles.cell,
    day.inMonth ? '' : styles.cellOutside,
    day.isToday ? styles.cellToday : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={classes} onClick={() => onSelect(day)} aria-label={label(day, events.length)}>
      <span className={styles.dayNumber}>{day.dayOfMonth}</span>

      <span className={styles.chips}>
        {visible.map((event) => (
          <span key={event.id} className={styles.chip} title={event.title}>
            {event.title}
          </span>
        ))}
        {hidden > 0 && <span className={styles.chipMore}>+{hidden} más</span>}
      </span>
    </button>
  );
}

/** Etiqueta accesible: el lector de pantalla no ve los chips truncados. */
function label(day: CalendarDay, count: number): string {
  const date = day.date.toLocaleDateString('es', { day: 'numeric', month: 'long' });
  if (count === 0) return `${date}, sin actividades`;
  return `${date}, ${count} ${count === 1 ? 'actividad' : 'actividades'}`;
}
