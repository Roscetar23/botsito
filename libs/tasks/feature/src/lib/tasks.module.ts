import { Module } from '@nestjs/common';
import { TasksDataAccessModule } from '@asistente/tasks-data-access';

import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';

@Module({
  imports: [TasksDataAccessModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
