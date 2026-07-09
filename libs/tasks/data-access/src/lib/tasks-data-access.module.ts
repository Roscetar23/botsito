import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Task, TaskSchema } from './task.schema.js';
import { TaskRepository } from './task.repository.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
  ],
  providers: [TaskRepository],
  exports: [TaskRepository],
})
export class TasksDataAccessModule {}
