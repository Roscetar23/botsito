'use client';

import { useAuth } from '@asistente/auth-ui';
import { useState } from 'react';
import type { Task, TaskStatus } from '@asistente/tasks-model';
import { createTask, updateTask, TasksApiError } from './tasks-api';
import { TASK_COLUMNS, groupTasksByStatus } from './task-status';
import { TaskModal } from './task-modal';
import { TasksColumn } from './tasks-column';
import { useTasks } from './use-tasks';
import styles from './tasks.module.css';

/**
 * Vista Tareas: cabecera de página + tablero Kanban de 3 columnas (Por
 * hacer / En progreso / Hecho). Módulo autocontenido (§2.1 de FRONTEND.md):
 * no conoce nada del resto de la Home. El enlace con recordatorios llega en
 * una parte siguiente.
 */
export function TasksBoard() {
  const { accessToken } = useAuth();
  const { tasks, loading, error, refetch } = useTasks();
  const [selected, setSelected] = useState<Task | null>(null);
  const grouped = groupTasksByStatus(tasks);

  async function handleQuickAdd(status: TaskStatus, title: string) {
    if (!accessToken) return;
    try {
      const created = await createTask({ title, status }, accessToken);
      refetch();
      setSelected(created); // abre el modal para editarla al instante
    } catch (err) {
      console.error(
        'No se pudo crear la tarea',
        err instanceof TasksApiError ? err.message : err,
      );
    }
  }

  async function handleDropTask(status: TaskStatus, taskId: string) {
    if (!accessToken) return;
    const task = tasks.find((item) => item.id === taskId);
    if (!task || task.status === status) return;
    try {
      await updateTask(taskId, { status }, accessToken);
      refetch();
    } catch (err) {
      console.error(
        'No se pudo mover la tarea',
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
            onOpen={setSelected}
            onQuickAdd={handleQuickAdd}
            onDropTask={handleDropTask}
          />
        ))}
      </div>

      {selected && (
        <TaskModal
          task={selected}
          onClose={() => setSelected(null)}
          onChanged={refetch}
        />
      )}
    </section>
  );
}
