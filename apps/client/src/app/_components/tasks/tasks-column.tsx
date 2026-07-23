'use client';

import { useState } from 'react';
import type { Task, TaskStatus } from '@asistente/tasks-model';
import { TaskCard } from './task-card';
import type { TaskColumnMeta } from './task-status';
import styles from './tasks.module.css';

interface TasksColumnProps {
  meta: TaskColumnMeta;
  tasks: Task[];
  onOpen: (task: Task) => void;
  onQuickAdd: (status: TaskStatus, title: string) => void;
}

/**
 * Una columna del tablero: cabecera con el contador, la lista de cards y el
 * alta rápida al pie (solo título; el resto de campos se completan al abrir
 * la tarea, cuando exista el modal de edición).
 */
export function TasksColumn({ meta, tasks, onOpen, onQuickAdd }: TasksColumnProps) {
  const [draft, setDraft] = useState('');

  function handleAdd() {
    const title = draft.trim();
    if (!title) return;
    onQuickAdd(meta.status, title);
    setDraft('');
  }

  return (
    <section className={styles.column}>
      <header className={styles.columnHeader}>
        <p className={styles.columnLabel}>{meta.label}</p>
        <span className={styles.columnCount}>{tasks.length}</span>
      </header>

      <div className={styles.columnBody}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onOpen={onOpen} />
        ))}
      </div>

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
    </section>
  );
}
