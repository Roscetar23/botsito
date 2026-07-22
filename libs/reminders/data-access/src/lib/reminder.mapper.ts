import { Reminder } from '@asistente/reminders-model';

import { ReminderDocument } from './reminder.schema.js';

/** Convierte un documento Mongoose en la entidad de dominio `Reminder`. */
export function toReminderEntity(doc: ReminderDocument): Reminder {
  return {
    id: String(doc._id),
    ownerId: doc.ownerId,
    type: doc.type,
    text: doc.text,
    date: doc.date,
    time: doc.time,
    frequency: doc.frequency,
    count: doc.count,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
