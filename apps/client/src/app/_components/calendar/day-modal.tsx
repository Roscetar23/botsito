'use client';

import { useAuth } from '@asistente/auth-ui';
import { useEffect, useState } from 'react';
import { dateKey, dayLongLabel, monthName } from './calendar-dates';
import type { CalendarDay } from './calendar-dates';
import { DayAgenda } from './day-agenda';
import { ReminderForm } from './reminder-form';
import type { Reminder } from '@asistente/reminders-model';
import styles from './calendar.module.css';

interface DayModalProps {
  day: CalendarDay;
  /** Recordatorios (completos) cuyas ocurrencias caen en `day`. */
  reminders: Reminder[];
  /**
   * Con `rect` (X o "Cerrar"): el robot viaja hasta ese botón y lo toca antes
   * de cerrar. Sin `rect` (Escape/click fuera, no hay botón concreto que
   * pulsar): cierre inmediato.
   */
  onClose: (rect?: DOMRect) => void;
  /** Se llama tras crear, editar o borrar un recordatorio, para refrescar el mes. */
  onChanged?: () => void;
}

/**
 * Agenda del día seleccionado, con dos modos de contenido dentro del mismo
 * diálogo: `agenda` (lista de recordatorios, por defecto, con editar/borrar
 * en `DayAgenda`/`ReminderRow`) y `form` (crear o editar un recordatorio).
 * Cierra con la X, con "Cerrar", con Escape o pulsando fuera del diálogo; el
 * cierre y la coreografía del robot no cambian entre modos.
 */
export function DayModal({ day, reminders, onClose, onChanged }: DayModalProps) {
  const { accessToken } = useAuth();
  const [mode, setMode] = useState<'agenda' | 'form'>('agenda');
  const [editing, setEditing] = useState<Reminder | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const eyebrow = mode === 'form' ? (editing ? 'Editar recordatorio' : 'Nuevo recordatorio') : 'Agenda del día';

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
            <p className={styles.eyebrow}>{eyebrow}</p>
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

        {mode === 'form' ? (
          <ReminderForm
            date={dateKey(day.date)}
            reminder={editing ?? undefined}
            onCancel={() => setMode('agenda')}
            onSaved={() => {
              onChanged?.();
              setMode('agenda');
            }}
          />
        ) : (
          <DayAgenda
            reminders={reminders}
            accessToken={accessToken}
            onClose={onClose}
            onEdit={(target) => {
              setEditing(target);
              setMode('form');
            }}
            onCreate={() => {
              setEditing(null);
              setMode('form');
            }}
            onDeleted={() => onChanged?.()}
          />
        )}
      </div>
    </div>
  );
}
