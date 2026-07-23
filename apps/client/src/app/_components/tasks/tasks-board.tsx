'use client';

import { useAuth } from '@asistente/auth-ui';
import type { Task, TaskStatus } from '@asistente/tasks-model';
import { createTask, TasksApiError } from './tasks-api';
import { TASK_COLUMNS, groupTasksByStatus } from './task-status';
import { TasksColumn } from './tasks-column';
import { useTasks } from './use-tasks';
import styles from './tasks.module.css';

/** Edición completa: aún no implementada, el modal llega en la siguiente parte. */
function handleOpenTask(_task: Task) {
  // no-op por ahora
}

/**
 * Vista Tareas: cabecera de página + tablero Kanban de 3 columnas (Por
 * hacer / En progreso / Hecho). Módulo autocontenido (§2.1 de FRONTEND.md):
 * no conoce nada del resto de la Home. La edición completa de cada tarea
 * (modal) y el enlace con recordatorios llegan en partes siguientes.
 */
export function TasksBoard() {
  const { accessToken } = useAuth();
  const { tasks, loading, error, refetch } = useTasks();
  const grouped = groupTasksByStatus(tasks);

  async function handleQuickAdd(status: TaskStatus, title: string) {
    if (!accessToken) return;
    try {
      await createTask({ title, status }, accessToken);
      refetch();
    } catch (err) {
      console.error(
        'No se pudo crear la tarea',
        err instanceof TasksApiError ? err.message : err,
      );
    }
  }

  return (
    <section className={styles.view}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Espacio de trabajo</p>
          <h1 className={styles.title}>Tareas</h1>
          <p className={styles.subtitle}>Organiza tu trabajo en un tablero simple.</p>
        </div>
        {loading && <p className={styles.legend}>Cargando…</p>}
      </header>

      {error && <p className={styles.boardError}>{error}</p>}

      <div className={styles.board}>
        {TASK_COLUMNS.map((meta) => (
          <TasksColumn
            key={meta.status}
            meta={meta}
            tasks={grouped[meta.status]}
            onOpen={handleOpenTask}
            onQuickAdd={handleQuickAdd}
          />
        ))}
      </div>
    </section>
  );
}
