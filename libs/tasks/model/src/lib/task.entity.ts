import { TaskPriority } from './task-priority.enum.js';
import { TaskStatus } from './task-status.enum.js';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}
