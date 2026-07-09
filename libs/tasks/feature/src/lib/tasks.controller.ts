import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { TaskDocument } from '@asistente/tasks-data-access';
import { CreateTaskDto, UpdateTaskDto } from '@asistente/tasks-model';

import { DEMO_OWNER_ID } from './tasks.constants.js';
import { TasksService } from './tasks.service.js';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() dto: CreateTaskDto): Promise<TaskDocument> {
    return this.tasksService.create(dto, DEMO_OWNER_ID);
  }

  @Get()
  findAll(): Promise<TaskDocument[]> {
    return this.tasksService.findAll(DEMO_OWNER_ID);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<TaskDocument> {
    return this.tasksService.findOne(id, DEMO_OWNER_ID);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<TaskDocument> {
    return this.tasksService.update(id, DEMO_OWNER_ID, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string): Promise<void> {
    return this.tasksService.remove(id, DEMO_OWNER_ID);
  }
}
