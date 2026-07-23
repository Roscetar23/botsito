import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { TaskPriority, TaskStatus } from '@asistente/tasks-model';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true, collection: 'tasks' })
export class Task {
  @Prop({ type: String, required: true })
  title!: string;

  @Prop({ type: String })
  description?: string;

  @Prop({
    type: String,
    enum: Object.values(TaskStatus),
    default: TaskStatus.Todo,
  })
  status!: TaskStatus;

  @Prop({ type: String, enum: Object.values(TaskPriority) })
  priority?: TaskPriority;

  @Prop({ type: Number, min: 0, max: 100, default: 0 })
  progress?: number;

  @Prop({ type: Date })
  dueDate?: Date;

  @Prop({ type: String, required: true, index: true })
  ownerId!: string;
}

export type TaskDocument = HydratedDocument<Task>;

export const TaskSchema = SchemaFactory.createForClass(Task);
