'use client';

import { useEffect } from 'react';
import type { Task } from '@asistente/tasks-model';
import { TaskForm } from './task-form';
import styles from './tasks.module.css';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  /** Se llama tras guardar o borrar la tarea, para refrescar el tablero. */
  onChanged: () => void;
}

/**
 * Modal de edición completa de una tarea: overlay con click-fuera para
 * cerrar, cierre con Escape y con el botón ×. El contenido es el
 * `TaskForm`; guardar o borrar refrescan el tablero y cierran el modal.
 */
export function TaskModal({ task, onClose, onChanged }: TaskModalProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.modalHeader}>
          <div>
            <p className={styles.eyebrow}>Tarea</p>
            <h2 id="task-modal-title" className={styles.modalTitle}>
              Editar tarea
            </h2>
            <p className={styles.modalSubtitle}>{task.title}</p>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </header>

        <TaskForm
          task={task}
          onSaved={() => {
            onChanged();
            onClose();
          }}
          onDeleted={() => {
            onChanged();
            onClose();
          }}
        />
      </div>
    </div>
  );
}
