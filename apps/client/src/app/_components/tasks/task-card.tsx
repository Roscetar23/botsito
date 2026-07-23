'use client';

import type { Task } from '@asistente/tasks-model';
import { PRIORITY_LABELS } from './task-status';
import styles from './tasks.module.css';

interface TaskCardProps {
  task: Task;
  /** Abre el modal de edición completa de la tarea. */
  onOpen: (task: Task) => void;
}

/** Recorta las notas de la card para la vista previa (no rompe palabras). */
function previewNotes(notes: string): string {
  const trimmed = notes.trim();
  return trimmed.length > 90 ? `${trimmed.slice(0, 90).trimEnd()}…` : trimmed;
}

/**
 * Card de una tarea: título, vista previa de las notas, barra de progreso y
 * chip de prioridad si la tiene. `onOpen` abre el modal de edición completa.
 */
export function TaskCard({ task, onOpen }: TaskCardProps) {
  const progress = Math.max(0, Math.min(100, task.progress ?? 0));

  return (
    <button type="button" className={styles.card} onClick={() => onOpen(task)}>
      <div className={styles.cardHeaderRow}>
        <p className={styles.cardTitle}>{task.title}</p>
        {task.priority && (
          <span className={`${styles.priorityChip} ${styles[`priority-${task.priority}`]}`}>
            {PRIORITY_LABELS[task.priority]}
          </span>
        )}
      </div>

      {task.description && <p className={styles.cardNotes}>{previewNotes(task.description)}</p>}

      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>
    </button>
  );
}
