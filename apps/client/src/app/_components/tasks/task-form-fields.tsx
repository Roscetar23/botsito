'use client';

import { TaskStatus } from '@asistente/tasks-model';
import type { TaskPriority } from '@asistente/tasks-model';
import { PRIORITY_LABELS, TASK_COLUMNS } from './task-status';
import styles from './tasks.module.css';

interface TaskFormFieldsProps {
  title: string;
  onTitleChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  progress: number;
  onProgressChange: (value: number) => void;
  status: TaskStatus;
  onStatusChange: (value: TaskStatus) => void;
  /** `''` significa "sin prioridad" (no se envía el campo al guardar). */
  priority: TaskPriority | '';
  onPriorityChange: (value: TaskPriority | '') => void;
}

/**
 * Campos editables del formulario de tarea: título, notas, progreso
 * (control deslizante con el % junto a la etiqueta), estado y prioridad.
 * Presentacional puro; el estado vive en `TaskForm`.
 */
export function TaskFormFields({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  progress,
  onProgressChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
}: TaskFormFieldsProps) {
  return (
    <>
      <div className={styles.formField}>
        <label className={styles.formLabel} htmlFor="task-title">
          Título
        </label>
        <input
          id="task-title"
          type="text"
          className={styles.formInput}
          maxLength={200}
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          required
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel} htmlFor="task-description">
          Notas
        </label>
        <textarea
          id="task-description"
          className={styles.formTextarea}
          maxLength={2000}
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel} htmlFor="task-progress">
          Progreso <span className={styles.rangeValue}>{progress}%</span>
        </label>
        <input
          id="task-progress"
          type="range"
          min={0}
          max={100}
          className={styles.formRange}
          value={progress}
          onChange={(event) => onProgressChange(Number(event.target.value))}
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel} htmlFor="task-status">
          Estado
        </label>
        <select
          id="task-status"
          className={styles.formSelect}
          value={status}
          onChange={(event) => onStatusChange(event.target.value as TaskStatus)}
        >
          {TASK_COLUMNS.map((column) => (
            <option key={column.status} value={column.status}>
              {column.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel} htmlFor="task-priority">
          Prioridad
        </label>
        <select
          id="task-priority"
          className={styles.formSelect}
          value={priority}
          onChange={(event) => onPriorityChange(event.target.value as TaskPriority | '')}
        >
          <option value="">—</option>
          {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
