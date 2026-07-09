import { Injectable, NotFoundException } from '@nestjs/common';
import { TaskDocument, TaskRepository } from '@asistente/tasks-data-access';
import { CreateTaskDto, UpdateTaskDto } from '@asistente/tasks-model';

@Injectable()
export class TasksService {
  constructor(private readonly repository: TaskRepository) {}

  create(dto: CreateTaskDto, ownerId: string): Promise<TaskDocument> {
    return this.repository.create(dto, ownerId);
  }

  findAll(ownerId: string): Promise<TaskDocument[]> {
    return this.repository.findAllByOwner(ownerId);
  }

  async findOne(id: string, ownerId: string): Promise<TaskDocument> {
    const task = await this.repository.findByIdForOwner(id, ownerId);
    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }
    return task;
  }

  async update(
    id: string,
    ownerId: string,
    dto: UpdateTaskDto,
  ): Promise<TaskDocument> {
    const task = await this.repository.update(id, ownerId, dto);
    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }
    return task;
  }

  async remove(id: string, ownerId: string): Promise<void> {
    const removed = await this.repository.remove(id, ownerId);
    if (!removed) {
      throw new NotFoundException(`Task ${id} not found`);
    }
  }
}
