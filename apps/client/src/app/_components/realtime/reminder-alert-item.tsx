'use client';

import { useEffect } from 'react';
import type { ReminderAlert } from './use-reminder-socket';
import styles from './reminder-alerts.module.css';

/** Vida del toast antes de autodescartarse (el usuario también puede cerrarlo). */
const AUTO_DISMISS_MS = 8000;

/** Etiquetas en español del tipo; `otro` cubre cualquier valor no reconocido. */
const TYPE_LABELS: Record<string, string> = {
  medicina: 'Medicina',
  cita: 'Cita',
  tarea: 'Tarea',
  personal: 'Personal',
  otro: 'Otro',
};

/** `occurrenceDate` (día) + `firedAt` (hora real de llegada; el payload no trae hora). */
function formatWhen(occurrenceDate: string, firedAt: number): string {
  const day = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(
    new Date(`${occurrenceDate}T00:00:00`),
  );
  const time = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(firedAt),
  );
  return `${day} · ${time}`;
}

interface ReminderAlertItemProps {
  alert: ReminderAlert;
  onDismiss: (id: string) => void;
}

/**
 * Un aviso: color del tipo (tokens `--rem-{tipo}` de `global.css`), texto y
 * cuándo llegó. Se autodescarta a los ~8s con un timer limpiable, o antes si
 * se pulsa cerrar.
 */
export function ReminderAlertItem({ alert, onDismiss }: ReminderAlertItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(alert.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [alert.id, onDismiss]);

  const label = TYPE_LABELS[alert.type] ?? alert.type;

  return (
    <div
      className={styles.toast}
      style={{ ['--toast-color' as string]: `var(--rem-${alert.type}, var(--rem-otro))` }}
    >
      <span className={styles.dot} aria-hidden="true" />
      <div className={styles.body}>
        <p className={styles.text}>{alert.text}</p>
        <p className={styles.meta}>
          {label} · {formatWhen(alert.occurrenceDate, alert.firedAt)}
        </p>
      </div>
      <button
        type="button"
        className={styles.closeButton}
        onClick={() => onDismiss(alert.id)}
        aria-label="Cerrar aviso"
      >
        ×
      </button>
    </div>
  );
}
