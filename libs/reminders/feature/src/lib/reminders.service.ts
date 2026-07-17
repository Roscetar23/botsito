import { Injectable } from '@nestjs/common';
import {
  ReminderDocument,
  ReminderRepository,
} from '@asistente/reminders-data-access';
import { CreateReminderDto } from '@asistente/reminders-model';

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
}
