import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  ReminderDocument,
  ReminderRepository,
  SCHEDULER_PORT,
  toReminderEntity,
} from '@asistente/reminders-data-access';
import type { SchedulerPort } from '@asistente/reminders-data-access';
import {
  CreateReminderDto,
  UpdateReminderDto,
} from '@asistente/reminders-model';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly repository: ReminderRepository,
    @Inject(SCHEDULER_PORT) private readonly scheduler: SchedulerPort,
  ) {}

  async create(
    dto: CreateReminderDto,
    ownerId: string,
  ): Promise<ReminderDocument> {
    const reminder = await this.repository.create(dto, ownerId);
    await this.safeSchedule(reminder);
    return reminder;
  }

  findAllByOwner(ownerId: string): Promise<ReminderDocument[]> {
    return this.repository.findAllByOwner(ownerId);
  }

  async update(
    id: string,
    ownerId: string,
    dto: UpdateReminderDto,
  ): Promise<ReminderDocument> {
    const reminder = await this.repository.update(id, ownerId, dto);
    if (!reminder) {
      throw new NotFoundException(`Reminder ${id} not found`);
    }
    // Reagendar = cancelar los jobs previos + programar los nuevos.
    await this.safeCancel(id);
    await this.safeSchedule(reminder);
    return reminder;
  }

  async remove(id: string, ownerId: string): Promise<void> {
    const removed = await this.repository.remove(id, ownerId);
    if (!removed) {
      throw new NotFoundException(`Reminder ${id} not found`);
    }
    await this.safeCancel(id);
  }

  /**
   * El scheduling es best-effort: el recordatorio ya quedó persistido en
   * Mongo, así que un fallo de Agenda no debe tumbar la petición CRUD.
   */
  private async safeSchedule(doc: ReminderDocument): Promise<void> {
    try {
      await this.scheduler.scheduleReminder(toReminderEntity(doc));
    } catch (error) {
      this.logger.error(
        `No se pudo agendar el recordatorio ${String(doc._id)}`,
        error as Error,
      );
    }
  }

  private async safeCancel(id: string): Promise<void> {
    try {
      await this.scheduler.cancelReminder(id);
    } catch (error) {
      this.logger.error(`No se pudo cancelar el recordatorio ${id}`, error as Error);
    }
  }
}
