'use client';

import type { Reminder } from '@asistente/reminders-model';
import { ReminderRow } from './reminder-row';
import styles from './calendar.module.css';

interface DayAgendaProps {
  reminders: Reminder[];
  accessToken: string | null;
  /** `false` en días pasados: se ve la agenda pero no se puede crear. */
  canCreate: boolean;
  onClose: (rect?: DOMRect) => void;
  onEdit: (reminder: Reminder) => void;
  onCreate: () => void;
  onDeleted: () => void;
}

/**
 * Contenido del `DayModal` en modo agenda: la lista de recordatorios del día
 * (o el estado vacío) y el pie con "Cerrar" / "Crear recordatorio".
 */
export function DayAgenda({ reminders, accessToken, canCreate, onClose, onEdit, onCreate, onDeleted }: DayAgendaProps) {
  return (
    <>
      {reminders.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>Aún no hay actividades.</p>
          <p className={styles.emptyText}>
            {canCreate ? 'Este día está libre. Puedes crear un recordatorio.' : 'Este día ya pasó.'}
          </p>
        </div>
      ) : (
        <ul className={styles.eventList}>
          {reminders.map((reminder) => (
            <ReminderRow
              key={reminder.id}
              reminder={reminder}
              accessToken={accessToken}
              onEdit={onEdit}
              onDeleted={onDeleted}
            />
          ))}
        </ul>
      )}

      <footer className={styles.modalFooter}>
        <button
          type="button"
          className={styles.ghostButton}
          onClick={(event) => onClose(event.currentTarget.getBoundingClientRect())}
        >
          Cerrar
        </button>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={onCreate}
          disabled={!canCreate}
          title={canCreate ? undefined : 'No puedes crear recordatorios en días pasados'}
        >
          <CalendarPlusIcon />
          Crear recordatorio
        </button>
      </footer>
    </>
  );
}

function CalendarPlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4M12 13v5M9.5 15.5h5" />
    </svg>
  );
}
