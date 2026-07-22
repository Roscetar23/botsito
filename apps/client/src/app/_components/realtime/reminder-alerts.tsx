'use client';

import { ReminderAlertItem } from './reminder-alert-item';
import type { ReminderAlert } from './use-reminder-socket';
import styles from './reminder-alerts.module.css';

interface ReminderAlertsProps {
  alerts: ReminderAlert[];
  onDismiss: (id: string) => void;
}

/**
 * Pila de toasts fija en la esquina superior derecha: uno por recordatorio
 * disparado, con el texto, el tipo en su color y cuándo llegó. Cada
 * `ReminderAlertItem` gestiona su propio auto-descarte.
 */
export function ReminderAlerts({ alerts, onDismiss }: ReminderAlertsProps) {
  if (alerts.length === 0) return null;

  return (
    <div className={styles.stack} role="status" aria-live="polite">
      {alerts.map((alert) => (
        <ReminderAlertItem key={alert.id} alert={alert} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
