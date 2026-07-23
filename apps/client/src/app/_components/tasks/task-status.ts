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

/** Columna que le tocaría a la tarea según su progreso, sin mirar su
 * `status` actual (0% → Por hacer, 100% → Hecho, cualquier otro → En
 * progreso). Usada por `taskNeedsAdvance` para detectar cards olvidadas. */
export function expectedStatusForProgress(progress = 0): TaskStatus {
  if (progress >= 100) return TaskStatus.Done;
  if (progress > 0) return TaskStatus.InProgress;
  return TaskStatus.Todo;
}

/** Orden de las columnas, para comparar "por delante"/"por detrás". */
const STATUS_ORDER: Record<TaskStatus, number> = {
  [TaskStatus.Todo]: 0,
  [TaskStatus.InProgress]: 1,
  [TaskStatus.Done]: 2,
};

/**
 * Si el progreso de `task` va por delante de su columna actual (el usuario
 * olvidó arrastrarla), devuelve la columna a la que debería moverse.
 * Devuelve `null` si ya está al día o si el progreso va por DETRÁS (nunca
 * empuja hacia atrás: eso lo decide el usuario a mano).
 */
export function taskNeedsAdvance(task: Task): TaskStatus | null {
  const expected = expectedStatusForProgress(task.progress);
  return STATUS_ORDER[expected] > STATUS_ORDER[task.status] ? expected : null;
}
