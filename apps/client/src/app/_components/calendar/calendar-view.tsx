'use client';

import { CalendarCard } from './calendar-card';
import { CalendarRobot } from './calendar-robot';
import { DayModal } from './day-modal';
import { useCalendarMonth } from './use-calendar-month';
import { useRobotChoreography } from './use-robot-choreography';
import styles from './calendar.module.css';

/**
 * Vista Calendario: cabecera de página, tarjeta del planificador, el modal
 * con la agenda del día seleccionado y el robot 3D decorativo que "camina"
 * hasta el día elegido antes de abrir su modal (orquestado en
 * `useRobotChoreography`). Módulo autocontenido (§2.1 de FRONTEND.md): no
 * conoce nada del resto de la Home.
 */
export function CalendarView() {
  const month = useCalendarMonth();
  const { viewRef, selected, robotTarget, pressTrigger, handleSelectDay, handleCloseModal } =
    useRobotChoreography();

  return (
    <section ref={viewRef} className={styles.view}>
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

      <CalendarCard month={month} onSelectDay={handleSelectDay} />

      {selected && (
        <DayModal
          day={selected}
          events={month.events[selected.key] ?? []}
          onClose={handleCloseModal}
        />
      )}

      <CalendarRobot target={robotTarget} pressTrigger={pressTrigger} />
    </section>
  );
}
