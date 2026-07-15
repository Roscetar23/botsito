'use client';

import { CalendarDayCell } from './calendar-day-cell';
import { WEEKDAYS } from './calendar-dates';
import type { CalendarDay } from './calendar-dates';
import type { CalendarMonth } from './use-calendar-month';
import styles from './calendar.module.css';

interface CalendarCardProps {
  month: CalendarMonth;
  onSelectDay: (day: CalendarDay, rect: DOMRect) => void;
}

/**
 * Tarjeta "Planificador": cabecera con el mes y los controles ‹ Hoy ›, fila de
 * días de la semana y la rejilla de seis semanas.
 */
export function CalendarCard({ month, onSelectDay }: CalendarCardProps) {
  return (
    <section className={styles.card} aria-label={`Calendario de ${month.label}`}>
      <header className={styles.cardHeader}>
        <div>
          <p className={styles.eyebrow}>Planificador</p>
          <h2 className={styles.monthLabel}>{month.label}</h2>
        </div>

        <div className={styles.monthNav}>
          <button type="button" className={styles.navButton} onClick={month.goPrev} aria-label="Mes anterior">
            ‹
          </button>
          <button type="button" className={styles.todayButton} onClick={month.goToday}>
            Hoy
          </button>
          <button type="button" className={styles.navButton} onClick={month.goNext} aria-label="Mes siguiente">
            ›
          </button>
        </div>
      </header>

      <div className={styles.weekdays} aria-hidden="true">
        {WEEKDAYS.map((weekday) => (
          <span key={weekday} className={styles.weekday}>
            {weekday}
          </span>
        ))}
      </div>

      <div className={styles.grid}>
        {month.days.map((day) => (
          <CalendarDayCell
            key={day.key}
            day={day}
            events={month.events[day.key] ?? []}
            onSelect={onSelectDay}
          />
        ))}
      </div>
    </section>
  );
}
