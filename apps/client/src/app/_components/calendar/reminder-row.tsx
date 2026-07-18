'use client';

import { ReminderFrequency } from '@asistente/reminders-model';
import { useState } from 'react';
import type { Reminder } from '@asistente/reminders-model';
import { deleteReminder, RemindersApiError } from './reminders-api';
import styles from './calendar.module.css';

interface ReminderRowProps {
  reminder: Reminder;
  accessToken: string | null;
  onEdit: (reminder: Reminder) => void;
  /** Se llama tras borrar el recordatorio con éxito, para refrescar el mes. */
  onDeleted: () => void;
}

/**
 * Fila de la agenda del día: hora + texto, con acciones de editar y borrar.
 * El borrado pide confirmación inline porque actúa sobre el `Reminder`
 * completo (todas sus ocurrencias), no solo sobre el día que se ve aquí.
 */
export function ReminderRow({ reminder, accessToken, onEdit, onDeleted }: ReminderRowProps) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isRecurring = reminder.frequency !== ReminderFrequency.Once;

  async function handleConfirmDelete() {
    if (!accessToken) {
      setError('Tu sesión expiró.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await deleteReminder(reminder.id, accessToken);
      onDeleted();
    } catch (err) {
      setError(err instanceof RemindersApiError ? err.message : 'No se pudo borrar.');
      setLoading(false);
      setConfirming(false);
    }
  }

  return (
    <li className={styles.eventRow}>
      <div className={styles.rowMain}>
        <span className={styles.eventTime}>{reminder.time}</span>
        <span className={styles.eventTitle}>{reminder.text}</span>

        {confirming ? (
          <span className={styles.rowConfirmActions}>
            <button type="button" className={styles.rowConfirmYes} onClick={handleConfirmDelete} disabled={loading}>
              Sí
            </button>
            <button
              type="button"
              className={styles.rowConfirmNo}
              onClick={() => setConfirming(false)}
              disabled={loading}
            >
              No
            </button>
          </span>
        ) : (
          <span className={styles.rowActions}>
            <button
              type="button"
              className={styles.rowIconButton}
              onClick={() => onEdit(reminder)}
              aria-label="Editar recordatorio"
            >
              <PencilIcon />
            </button>
            <button
              type="button"
              className={`${styles.rowIconButton} ${styles.rowIconButtonDanger}`}
              onClick={() => setConfirming(true)}
              aria-label="Eliminar recordatorio"
            >
              <TrashIcon />
            </button>
          </span>
        )}
      </div>

      {confirming && (
        <p className={styles.rowConfirmText}>
          ¿Eliminar?{isRecurring && ' Se eliminarán todas sus repeticiones.'}
        </p>
      )}
      {error && <p className={styles.rowError}>{error}</p>}
    </li>
  );
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M17 3l4 4L7 21H3v-4L17 3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path
        d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
