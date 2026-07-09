import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateTaskDto, UpdateTaskDto } from '@asistente/tasks-model';
import { Model } from 'mongoose';

import { Task, TaskDocument } from './task.schema.js';

@Injectable()
export class TaskRepository {
  constructor(
    @InjectModel(Task.name) private readonly model: Model<TaskDocument>,
  ) {}

  create(dto: CreateTaskDto, ownerId: string): Promise<TaskDocument> {
    return this.model.create({ ...dto, ownerId });
  }

  findAllByOwner(ownerId: string): Promise<TaskDocument[]> {
    return this.model.find({ ownerId }).exec();
  }

  findByIdForOwner(id: string, ownerId: string): Promise<TaskDocument | null> {
    return this.model.findOne({ _id: id, ownerId }).exec();
  }

  update(
    id: string,
    ownerId: string,
    dto: UpdateTaskDto,
  ): Promise<TaskDocument | null> {
    return this.model
      .findOneAndUpdate({ _id: id, ownerId }, dto, { new: true })
      .exec();
  }

  async remove(id: string, ownerId: string): Promise<boolean> {
    const result = await this.model.deleteOne({ _id: id, ownerId }).exec();
    return result.deletedCount > 0;
  }
}
