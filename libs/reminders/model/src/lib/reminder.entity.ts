import { ReminderFrequency } from './reminder-frequency.enum.js';
import { ReminderType } from './reminder-type.enum.js';

export interface Reminder {
  id: string;
  ownerId: string;
  type: ReminderType;
  text: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm 24h */
  time: string;
  frequency: ReminderFrequency;
  count: number;
  /** Id de la Task a la que pertenece, si el recordatorio se creó desde una card. */
  taskId?: string;
  createdAt: string;
  updatedAt: string;
}
