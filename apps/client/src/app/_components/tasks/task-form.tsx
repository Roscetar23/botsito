'use client';

import { useAuth } from '@asistente/auth-ui';
import type { Task, TaskPriority, TaskStatus, UpdateTaskDto } from '@asistente/tasks-model';
import { useState, type FormEvent } from 'react';
import { deleteTask, updateTask, TasksApiError } from './tasks-api';
import { TaskFormFields } from './task-form-fields';
import styles from './tasks.module.css';

interface TaskFormProps {
  task: Task;
  /** Se llama tras guardar la tarea con éxito. */
  onSaved: () => void;
  /** Se llama tras borrar la tarea con éxito. */
  onDeleted: () => void;
}

/**
 * Formulario de edición completa de una tarea: título, notas, progreso,
 * estado y prioridad, con guardado (PATCH) y borrado. El borrado pide
 * confirmación inline (patrón `ReminderRow`) antes de llamar a la API.
 */
export function TaskForm({ task, onSaved, onDeleted }: TaskFormProps) {
  const { accessToken } = useAuth();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [progress, setProgress] = useState(task.progress ?? 0);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority | ''>(task.priority ?? '');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!accessToken) {
      setError('Tu sesión expiró. Vuelve a iniciar sesión.');
      return;
    }
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('El título no puede estar vacío.');
      return;
    }

    const dto: UpdateTaskDto = {
      title: trimmedTitle,
      description: description.trim(),
      status,
      progress,
      ...(priority ? { priority } : {}),
    };
    setLoading(true);
    setError(null);
    try {
      await updateTask(task.id, dto, accessToken);
      onSaved();
    } catch (err) {
      setError(err instanceof TasksApiError ? err.message : 'No se pudo guardar la tarea.');
      setLoading(false);
    }
  }

  async function handleConfirmDelete() {
    if (!accessToken) {
      setError('Tu sesión expiró.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await deleteTask(task.id, accessToken);
      onDeleted();
    } catch (err) {
      setError(err instanceof TasksApiError ? err.message : 'No se pudo borrar la tarea.');
      setLoading(false);
      setConfirmingDelete(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <TaskFormFields
        title={title}
        onTitleChange={setTitle}
        description={description}
        onDescriptionChange={setDescription}
        progress={progress}
        onProgressChange={setProgress}
        status={status}
        onStatusChange={setStatus}
        priority={priority}
        onPriorityChange={setPriority}
      />

      {error && <p className={styles.formError}>{error}</p>}

      <div className={styles.formFooter}>
        {confirmingDelete ? (
          <span className={styles.rowConfirmActions}>
            <span className={styles.rowConfirmText}>¿Eliminar tarea?</span>
            <button type="button" className={styles.rowConfirmYes} onClick={handleConfirmDelete} disabled={loading}>
              Sí
            </button>
            <button
              type="button"
              className={styles.rowConfirmNo}
              onClick={() => setConfirmingDelete(false)}
              disabled={loading}
            >
              No
            </button>
          </span>
        ) : (
          <button
            type="button"
            className={styles.dangerButton}
            onClick={() => setConfirmingDelete(true)}
            disabled={loading}
          >
            Borrar
          </button>
        )}

        <button type="submit" className={styles.primaryButton} disabled={loading || confirmingDelete}>
          {loading ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
