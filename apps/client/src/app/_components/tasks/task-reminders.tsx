'use client';

import { useAuth } from '@asistente/auth-ui';
import type { Reminder } from '@asistente/reminders-model';
import type { Task } from '@asistente/tasks-model';
import { useCallback, useEffect, useState } from 'react';
import { deleteReminder, fetchReminders, RemindersApiError } from '../calendar/reminders-api';
import { TYPE_LABELS } from '../calendar/reminder-form-options';
import { typeClass } from '../calendar/reminder-type-style';
import { TaskReminderForm } from './task-reminder-form';
import styles from './tasks.module.css';

interface TaskRemindersProps {
  task: Task;
}

/** `YYYY-MM-DD` → fecha corta en español, p. ej. `23 jul.`. */
function shortDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return parsed.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

/**
 * Sección "Recordatorios" del modal de tarea: lista los recordatorios
 * enlazados a esta tarea (`taskId`) y permite añadir uno nuevo puntual desde
 * aquí. El calendario ya pinta todos los recordatorios (enlazados o no); esta
 * sección solo gestiona el enlace con la tarea, es independiente del
 * guardar/cerrar del `TaskForm`.
 */
export function TaskReminders({ task }: TaskRemindersProps) {
  const { accessToken } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const all = await fetchReminders(accessToken);
      setReminders(all.filter((reminder) => reminder.taskId === task.id));
    } catch (err) {
      setError(err instanceof RemindersApiError ? err.message : 'No se pudieron cargar los recordatorios.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, task.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleDelete(id: string) {
    if (!accessToken) return;
    try {
      await deleteReminder(id, accessToken);
      await refresh();
    } catch (err) {
      setError(err instanceof RemindersApiError ? err.message : 'No se pudo borrar el recordatorio.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className={styles.remindersSection}>
      <div className={styles.remindersHeader}>
        <h3 className={styles.sectionTitle}>Recordatorios</h3>
        {!showForm && (
          <button type="button" className={styles.ghostAddButton} onClick={() => setShowForm(true)}>
            + Añadir recordatorio
          </button>
        )}
      </div>

      {error && <p className={styles.formError}>{error}</p>}

      {loading ? (
        <p className={styles.remindersEmpty}>Cargando…</p>
      ) : reminders.length === 0 && !showForm ? (
        <p className={styles.remindersEmpty}>Sin recordatorios enlazados.</p>
      ) : (
        <ul className={styles.reminderList}>
          {reminders.map((reminder) => (
            <li key={reminder.id} className={styles.reminderItem}>
              <span className={typeClass('typeDot', reminder.type)} aria-hidden="true" />
              <span className={styles.reminderDate}>{shortDate(reminder.date)}</span>
              <span className={styles.reminderTime}>{reminder.time}</span>
              <span className={typeClass('typeLabel', reminder.type)}>{TYPE_LABELS[reminder.type]}</span>
              <span className={styles.reminderText}>{reminder.text}</span>

              {deletingId === reminder.id ? (
                <span className={styles.rowConfirmActions}>
                  <button type="button" className={styles.rowConfirmYes} onClick={() => handleDelete(reminder.id)}>
                    Sí
                  </button>
                  <button type="button" className={styles.rowConfirmNo} onClick={() => setDeletingId(null)}>
                    No
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  className={styles.reminderDeleteButton}
                  onClick={() => setDeletingId(reminder.id)}
                  aria-label="Eliminar recordatorio"
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <TaskReminderForm
          task={task}
          onCancel={() => setShowForm(false)}
          onAdded={() => {
            setShowForm(false);
            refresh();
          }}
        />
      )}
    </section>
  );
}
