import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Connection } from 'mongoose';
import { Agenda, Job } from 'agenda';
import { MongoBackend } from '@agendajs/mongo-backend';
import { Reminder, reminderOccurrences } from '@asistente/reminders-model';
import { SchedulerPort } from '@asistente/reminders-data-access';
import {
  REMINDER_FIRED_EVENT,
  ReminderFiredEvent,
} from '@asistente/shared-types';

import {
  REMINDER_FIRE_JOB,
  ReminderFireJobData,
} from './reminder-fire-job-data.js';
import { occurrenceFireDate } from './occurrence-fire-date.js';

const JOBS_COLLECTION = 'agendaJobs';

/**
 * Adaptador de {@link SchedulerPort} sobre Agenda (misma conexión Mongo
 * que el resto del dominio, vía Mongoose). Reagendar = cancelar + volver
 * a programar (lo orquesta `RemindersService`).
 */
@Injectable()
export class AgendaScheduler
  implements SchedulerPort, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(AgendaScheduler.name);
  private readonly agenda: Agenda;

  constructor(
    @InjectConnection() connection: Connection,
    private readonly eventEmitter: EventEmitter2,
  ) {
    const db = connection.db;
    if (!db) {
      throw new Error(
        'AgendaScheduler: no hay conexión Mongo disponible (connection.db undefined)',
      );
    }
    this.agenda = new Agenda({
      backend: new MongoBackend({ mongo: db, collection: JOBS_COLLECTION }),
    });
  }

  async onModuleInit(): Promise<void> {
    this.agenda.define<ReminderFireJobData>(
      REMINDER_FIRE_JOB,
      async (job: Job<ReminderFireJobData>) => {
        const { reminderId, ownerId, occurrenceDate, text, type } =
          job.attrs.data;
        this.logger.log(
          `🔔 Recordatorio disparado: ${text} (${type}) reminderId=${reminderId} owner=${ownerId} ocurrencia=${occurrenceDate}`,
        );
        // `notifications` escucha este evento para avisar al cliente por
        // WebSocket; este dominio no conoce ni depende de ese transporte.
        const payload: ReminderFiredEvent = {
          reminderId,
          ownerId,
          occurrenceDate,
          text,
          type,
        };
        this.eventEmitter.emit(REMINDER_FIRED_EVENT, payload);
      },
    );
    await this.agenda.start();
  }

  async onModuleDestroy(): Promise<void> {
    await this.agenda.stop();
  }

  async scheduleReminder(reminder: Reminder): Promise<void> {
    const occurrences = reminderOccurrences({
      date: reminder.date,
      frequency: reminder.frequency,
      count: reminder.count,
    });
    const now = Date.now();

    for (const occurrenceDate of occurrences) {
      const fireDate = occurrenceFireDate(occurrenceDate, reminder.time);
      if (fireDate.getTime() <= now) {
        continue; // ocurrencia pasada: no tiene sentido agendarla
      }
      const data: ReminderFireJobData = {
        reminderId: reminder.id,
        ownerId: reminder.ownerId,
        occurrenceDate,
        text: reminder.text,
        type: reminder.type,
      };
      await this.agenda.schedule(fireDate, REMINDER_FIRE_JOB, data);
    }
  }

  async cancelReminder(reminderId: string): Promise<void> {
    // `data` hace partial-match por dot-notation (data.reminderId=...).
    await this.agenda.cancel({
      name: REMINDER_FIRE_JOB,
      data: { reminderId },
    });
  }
}
