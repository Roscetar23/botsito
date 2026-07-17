import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ReminderDocument,
  ReminderRepository,
} from '@asistente/reminders-data-access';
import {
  CreateReminderDto,
  UpdateReminderDto,
} from '@asistente/reminders-model';

@Injectable()
export class RemindersService {
  constructor(private readonly repository: ReminderRepository) {}

  create(
    dto: CreateReminderDto,
    ownerId: string,
  ): Promise<ReminderDocument> {
    return this.repository.create(dto, ownerId);
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
    return reminder;
  }

  async remove(id: string, ownerId: string): Promise<void> {
    const removed = await this.repository.remove(id, ownerId);
    if (!removed) {
      throw new NotFoundException(`Reminder ${id} not found`);
    }
  }
}
