'use client';

import { useState } from 'react';
import { CalendarCard } from './calendar-card';
import { CalendarRobot } from './calendar-robot';
import { DayModal } from './day-modal';
import { useCalendarMonth } from './use-calendar-month';
import type { CalendarDay } from './calendar-dates';
import styles from './calendar.module.css';

/**
 * Vista Calendario: cabecera de página, tarjeta del planificador y el modal
 * con la agenda del día seleccionado. Módulo autocontenido (§2.1 de
 * FRONTEND.md): no conoce nada del resto de la Home.
 */
export function CalendarView() {
  const month = useCalendarMonth();
  const [selected, setSelected] = useState<CalendarDay | null>(null);

  return (
    <section className={styles.view}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Planificación personal</p>
          <h1 className={styles.title}>Calendario de {month.name}.</h1>
          <p className={styles.subtitle}>Organiza tus recordatorios y revisa el ritmo de tu mes.</p>
        </div>

        <p className={styles.legend}>
          <span className={styles.legendDot} aria-hidden="true" />
          {month.label.split(' ')[0]} · {month.totalDays} días
        </p>
      </header>

      <CalendarCard month={month} onSelectDay={setSelected} />

      {selected && (
        <DayModal
          day={selected}
          events={month.events[selected.key] ?? []}
          onClose={() => setSelected(null)}
        />
      )}

      <CalendarRobot />
    </section>
  );
}
