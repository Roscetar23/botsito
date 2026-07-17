import { Module } from '@nestjs/common';
import { RemindersDataAccessModule } from '@asistente/reminders-data-access';

import { RemindersController } from './reminders.controller.js';
import { RemindersService } from './reminders.service.js';

@Module({
  imports: [RemindersDataAccessModule],
  controllers: [RemindersController],
  providers: [RemindersService],
  exports: [RemindersService],
})
export class RemindersModule {}
