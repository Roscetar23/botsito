'use client';

import { useAuth } from '@asistente/auth-ui';
import { ReminderFrequency, ReminderType } from '@asistente/reminders-model';
import { useState, type FormEvent } from 'react';
import type { CreateReminderDto, Reminder, UpdateReminderDto } from '@asistente/reminders-model';
import { createReminder, updateReminder, RemindersApiError } from './reminders-api';
import { SelectField } from './reminder-form-fields';
import { FREQUENCY_LABELS, TYPE_LABELS, validateReminderForm } from './reminder-form-options';
import styles from './calendar.module.css';

interface ReminderFormProps {
  /** Día del modal (`YYYY-MM-DD`); fijo, no editable. Solo se usa al crear. */
  date: string;
  /** Recordatorio a editar (PATCH); si no viene, el formulario crea (POST). */
  reminder?: Reminder;
  onCancel: () => void;
  /** Se llama tras crear o guardar el recordatorio con éxito. */
  onSaved: () => void;
}

/**
 * Formulario de "Nuevo/Editar recordatorio" que reemplaza el contenido del
 * modal del día. Sin `reminder`: crea con la `date` fija del día
 * seleccionado. Con `reminder`: edita el recordatorio completo (todas sus
 * ocurrencias) y conserva su `date` original, no la del día desde el que se
 * abrió el modal.
 */
export function ReminderForm({ date, reminder, onCancel, onSaved }: ReminderFormProps) {
  const { accessToken } = useAuth();
  const [type, setType] = useState<ReminderType>(reminder?.type ?? ReminderType.Personal);
  const [time, setTime] = useState(reminder?.time ?? '');
  const [frequency, setFrequency] = useState<ReminderFrequency>(reminder?.frequency ?? ReminderFrequency.Once);
  const [count, setCount] = useState(reminder?.count ?? 1);
  const [text, setText] = useState(reminder?.text ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOnce = frequency === ReminderFrequency.Once;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!accessToken) {
      setError('Tu sesión expiró. Vuelve a iniciar sesión.');
      return;
    }

    const effectiveCount = isOnce ? 1 : count;
    const validationError = validateReminderForm(time, text, effectiveCount);
    if (validationError) {
      setError(validationError);
      return;
    }

    const effectiveDate = reminder?.date ?? date;
    const dto: CreateReminderDto | UpdateReminderDto = {
      type,
      text: text.trim(),
      date: effectiveDate,
      time,
      frequency,
      count: effectiveCount,
    };
    setLoading(true);
    setError(null);
    try {
      if (reminder) {
        await updateReminder(reminder.id, dto, accessToken);
      } else {
        await createReminder(dto as CreateReminderDto, accessToken);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof RemindersApiError ? err.message : 'No se pudo guardar el recordatorio.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <SelectField id="reminder-type" label="Tipo" value={type} options={TYPE_LABELS} onChange={setType} />

      <div className={styles.formField}>
        <label className={styles.formLabel} htmlFor="reminder-time">
          Hora
        </label>
        <input
          id="reminder-time"
          type="time"
          className={styles.formInput}
          value={time}
          onChange={(event) => setTime(event.target.value)}
          required
        />
      </div>

      <SelectField
        id="reminder-frequency"
        label="Frecuencia"
        value={frequency}
        options={FREQUENCY_LABELS}
        onChange={setFrequency}
      />

      {!isOnce && (
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="reminder-count">
            Nº de veces
          </label>
          <input
            id="reminder-count"
            type="number"
            min={1}
            max={365}
            className={styles.formInput}
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
          />
        </div>
      )}

      <div className={styles.formField}>
        <label className={styles.formLabel} htmlFor="reminder-text">
          Texto
        </label>
        <textarea
          id="reminder-text"
          className={styles.formTextarea}
          maxLength={200}
          value={text}
          onChange={(event) => setText(event.target.value)}
          required
        />
      </div>

      {error && <p className={styles.formError}>{error}</p>}

      <div className={styles.modalFooter}>
        <button type="button" className={styles.ghostButton} onClick={onCancel} disabled={loading}>
          Cancelar
        </button>
        <button type="submit" className={styles.primaryButton} disabled={loading}>
          {loading ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
