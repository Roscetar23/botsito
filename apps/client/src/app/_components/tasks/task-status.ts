import { TaskPriority, TaskStatus } from '@asistente/tasks-model';
import type { Task } from '@asistente/tasks-model';

export interface TaskColumnMeta {
  status: TaskStatus;
  label: string;
}

/** Orden y etiquetas de las columnas del tablero. */
export const TASK_COLUMNS: readonly TaskColumnMeta[] = [
  { status: TaskStatus.Todo, label: 'Por hacer' },
  { status: TaskStatus.InProgress, label: 'En progreso' },
  { status: TaskStatus.Done, label: 'Hecho' },
];

/** Etiquetas de prioridad, compartidas entre la card y el formulario de edición. */
export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.Low]: 'Baja',
  [TaskPriority.Medium]: 'Media',
  [TaskPriority.High]: 'Alta',
};

/** Agrupa las tareas por `status`, conservando el orden de llegada. */
export function groupTasksByStatus(tasks: readonly Task[]): Record<TaskStatus, Task[]> {
  const groups: Record<TaskStatus, Task[]> = {
    [TaskStatus.Todo]: [],
    [TaskStatus.InProgress]: [],
    [TaskStatus.Done]: [],
  };
  for (const task of tasks) {
    groups[task.status]?.push(task);
  }
  return groups;
}
