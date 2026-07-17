import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Reminder, ReminderSchema } from './reminder.schema.js';
import { ReminderRepository } from './reminder.repository.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reminder.name, schema: ReminderSchema },
    ]),
  ],
  providers: [ReminderRepository],
  exports: [ReminderRepository],
})
export class RemindersDataAccessModule {}
