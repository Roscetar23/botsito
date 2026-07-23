'use client';

import { useAuth } from '@asistente/auth-ui';
import { ReminderFrequency, ReminderType } from '@asistente/reminders-model';
import type { CreateReminderDto } from '@asistente/reminders-model';
import type { Task } from '@asistente/tasks-model';
import { useState, type FormEvent } from 'react';
import { createReminder, RemindersApiError } from '../calendar/reminders-api';
import { TYPE_LABELS } from '../calendar/reminder-form-options';
import { typeClass } from '../calendar/reminder-type-style';
import styles from './tasks.module.css';

interface TaskReminderFormProps {
  task: Task;
  onCancel: () => void;
  /** Se llama tras crear el recordatorio con éxito, para refrescar la lista. */
  onAdded: () => void;
}

/**
 * Mini-formulario de alta de un recordatorio enlazado a la tarea: siempre
 * puntual (`ReminderFrequency.Once`, `count: 1`), sin controles de
 * recurrencia. Reutiliza las etiquetas y colores por tipo del calendario
 * para que quede coherente con la agenda, donde también aparecerá.
 */
export function TaskReminderForm({ task, onCancel, onAdded }: TaskReminderFormProps) {
  const { accessToken } = useAuth();
  const [type, setType] = useState<ReminderType>(ReminderType.Tarea);
  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!accessToken) {
      setError('Tu sesión expiró. Vuelve a iniciar sesión.');
      return;
    }
    const trimmedText = text.trim();
    if (!trimmedText) {
      setError('Escribe el texto del recordatorio.');
      return;
    }
    if (!date || !time) {
      setError('Elige fecha y hora.');
      return;
    }

    const dto: CreateReminderDto = {
      type,
      text: trimmedText,
      date,
      time,
      frequency: ReminderFrequency.Once,
      count: 1,
      taskId: task.id,
    };
    setLoading(true);
    setError(null);
    try {
      await createReminder(dto, accessToken);
      onAdded();
    } catch (err) {
      setError(err instanceof RemindersApiError ? err.message : 'No se pudo crear el recordatorio.');
      setLoading(false);
    }
  }

  return (
    <form className={styles.reminderForm} onSubmit={handleSubmit}>
      <div className={styles.formField}>
        <label className={styles.formLabel} htmlFor="task-reminder-text">
          Texto
        </label>
        <input
          id="task-reminder-text"
          type="text"
          className={styles.formInput}
          maxLength={200}
          value={text}
          onChange={(event) => setText(event.target.value)}
          required
        />
      </div>

      <div className={styles.reminderFormRow}>
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="task-reminder-date">
            Fecha
          </label>
          <input
            id="task-reminder-date"
            type="date"
            className={styles.formInput}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="task-reminder-time">
            Hora
          </label>
          <input
            id="task-reminder-time"
            type="time"
            className={styles.formInput}
            value={time}
            onChange={(event) => setTime(event.target.value)}
            required
          />
        </div>
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel} htmlFor="task-reminder-type">
          Tipo
          <span className={typeClass('typeDot', type)} aria-hidden="true" />
        </label>
        <select
          id="task-reminder-type"
          className={styles.formSelect}
          value={type}
          onChange={(event) => setType(event.target.value as ReminderType)}
        >
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className={styles.formError}>{error}</p>}

      <div className={styles.reminderFormFooter}>
        <button type="button" className={styles.ghostButton} onClick={onCancel} disabled={loading}>
          Cancelar
        </button>
        <button type="submit" className={styles.primaryButton} disabled={loading}>
          {loading ? 'Guardando…' : 'Añadir'}
        </button>
      </div>
    </form>
  );
}
