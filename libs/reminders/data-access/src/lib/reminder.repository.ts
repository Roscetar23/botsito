import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateReminderDto } from '@asistente/reminders-model';
import { Model } from 'mongoose';

import { Reminder, ReminderDocument } from './reminder.schema.js';

@Injectable()
export class ReminderRepository {
  constructor(
    @InjectModel(Reminder.name)
    private readonly model: Model<ReminderDocument>,
  ) {}

  create(dto: CreateReminderDto, ownerId: string): Promise<ReminderDocument> {
    return this.model.create({ ...dto, ownerId });
  }

  findAllByOwner(ownerId: string): Promise<ReminderDocument[]> {
    return this.model.find({ ownerId }).exec();
  }

  findByIdForOwner(
    id: string,
    ownerId: string,
  ): Promise<ReminderDocument | null> {
    return this.model.findOne({ _id: id, ownerId }).exec();
  }

  async remove(id: string, ownerId: string): Promise<boolean> {
    const result = await this.model.deleteOne({ _id: id, ownerId }).exec();
    return result.deletedCount > 0;
  }
}
