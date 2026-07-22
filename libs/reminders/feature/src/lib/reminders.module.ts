import { Module } from '@nestjs/common';
import { RemindersDataAccessModule } from '@asistente/reminders-data-access';

import { RemindersController } from './reminders.controller.js';
import { RemindersService } from './reminders.service.js';
import { SchedulerModule } from './scheduler/scheduler.module.js';

@Module({
  imports: [RemindersDataAccessModule, SchedulerModule],
  controllers: [RemindersController],
  providers: [RemindersService],
  exports: [RemindersService],
})
export class RemindersModule {}
