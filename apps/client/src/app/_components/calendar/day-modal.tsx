'use client';

import { useEffect, useState } from 'react';
import { dateKey, dayLongLabel, monthName } from './calendar-dates';
import type { CalendarDay } from './calendar-dates';
import type { CalendarEvent } from './calendar-events';
import { ReminderForm } from './reminder-form';
import styles from './calendar.module.css';

interface DayModalProps {
  day: CalendarDay;
  events: CalendarEvent[];
  /**
   * Con `rect` (X o "Cerrar"): el robot viaja hasta ese botón y lo toca antes
   * de cerrar. Sin `rect` (Escape/click fuera, no hay botón concreto que
   * pulsar): cierre inmediato.
   */
  onClose: (rect?: DOMRect) => void;
  /** Se llama tras crear un recordatorio con éxito, para refrescar el mes. */
  onCreated?: () => void;
}

/**
 * Agenda del día seleccionado, con dos modos de contenido dentro del mismo
 * diálogo: `agenda` (lista de eventos, por defecto) y `create` (formulario de
 * "Nuevo recordatorio", R-4). Cierra con la X, con "Cerrar", con Escape o
 * pulsando fuera del diálogo; el cierre y la coreografía del robot no cambian
 * entre modos.
 */
export function DayModal({ day, events, onClose, onCreated }: DayModalProps) {
  const [mode, setMode] = useState<'agenda' | 'create'>('agenda');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={() => onClose()} role="presentation">
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.modalHeader}>
          <div>
            <p className={styles.eyebrow}>{mode === 'create' ? 'Nuevo recordatorio' : 'Agenda del día'}</p>
            <h2 id="day-modal-title" className={styles.modalTitle}>
              {day.dayOfMonth} de {monthName(day.date)}
            </h2>
            <p className={styles.modalSubtitle}>{dayLongLabel(day.date)}</p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={(event) => onClose(event.currentTarget.getBoundingClientRect())}
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        {mode === 'create' ? (
          <ReminderForm
            date={dateKey(day.date)}
            onCancel={() => setMode('agenda')}
            onCreated={() => {
              onCreated?.();
              setMode('agenda');
            }}
          />
        ) : (
          <>
            {events.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>Aún no hay actividades.</p>
                <p className={styles.emptyText}>Este día está libre. Puedes crear un recordatorio.</p>
              </div>
            ) : (
              <ul className={styles.eventList}>
                {events.map((event) => (
                  <li key={event.id} className={styles.eventRow}>
                    {event.time && <span className={styles.eventTime}>{event.time}</span>}
                    <span className={styles.eventTitle}>{event.title}</span>
                  </li>
                ))}
              </ul>
            )}

            <footer className={styles.modalFooter}>
              <button
                type="button"
                className={styles.ghostButton}
                onClick={(event) => onClose(event.currentTarget.getBoundingClientRect())}
              >
                Cerrar
              </button>
              <button type="button" className={styles.primaryButton} onClick={() => setMode('create')}>
                <CalendarPlusIcon />
                Crear recordatorio
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

function CalendarPlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4M12 13v5M9.5 15.5h5" />
    </svg>
  );
}
