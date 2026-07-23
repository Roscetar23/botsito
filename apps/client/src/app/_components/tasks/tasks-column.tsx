'use client';

import { useState } from 'react';
import { TaskStatus } from '@asistente/tasks-model';
import type { Task } from '@asistente/tasks-model';
import { TaskCard } from './task-card';
import type { TaskColumnMeta } from './task-status';
import styles from './tasks.module.css';

interface TasksColumnProps {
  meta: TaskColumnMeta;
  tasks: Task[];
  onOpen: (task: Task) => void;
  onQuickAdd: (status: TaskStatus, title: string) => void;
  /** Suelta una card (por id) en esta columna → la mueve a `meta.status`. */
  onDropTask: (status: TaskStatus, taskId: string) => void;
}

/**
 * Una columna del tablero: cabecera con el contador, la lista de cards y
 * (solo en "Por hacer") el alta rápida al pie. El flujo va siempre de Por
 * hacer → Hecho, así que las tareas nacen en la primera columna. Es zona de
 * soltado: arrastrar una card aquí la mueve a este estado.
 */
export function TasksColumn({ meta, tasks, onOpen, onQuickAdd, onDropTask }: TasksColumnProps) {
  const [draft, setDraft] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const canAdd = meta.status === TaskStatus.Todo;

  function handleAdd() {
    const title = draft.trim();
    if (!title) return;
    onQuickAdd(meta.status, title);
    setDraft('');
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragOver(false);
    const taskId = event.dataTransfer.getData('text/plain');
    if (taskId) onDropTask(meta.status, taskId);
  }

  return (
    <section
      className={`${styles.column} ${dragOver ? styles.columnDragOver : ''}`.trim()}
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragOver(false);
      }}
      onDrop={handleDrop}
    >
      <header className={styles.columnHeader}>
        <p className={styles.columnLabel}>{meta.label}</p>
        <span className={styles.columnCount}>{tasks.length}</span>
      </header>

      <div className={styles.columnBody}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onOpen={onOpen} />
        ))}
      </div>

      {canAdd && (
        <div className={styles.quickAdd}>
          <input
            type="text"
            className={styles.quickAddInput}
            placeholder="Nueva tarea…"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleAdd();
            }}
          />
          <button
            type="button"
            className={styles.quickAddButton}
            onClick={handleAdd}
            aria-label="Añadir tarea"
          >
            +
          </button>
        </div>
      )}
    </section>
  );
}
