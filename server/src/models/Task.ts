import mongoose, { Schema, Document } from 'mongoose';
import { PriorityLevel, TaskStatus } from '../types';

export interface ITaskDocument extends Document {
  title: string;
  description?: string;
  assignedTo: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId | null;
  priority: PriorityLevel;
  status: TaskStatus;
  dueDate: Date;
  relatedType?: 'lead' | 'contact' | 'deal' | 'company' | null;
  relatedId?: mongoose.Types.ObjectId | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITaskDocument>(
  {
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, trim: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', default: null, index: true },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['To Do', 'In Progress', 'Done'],
      default: 'To Do',
      required: true,
      index: true,
    },
    dueDate: { type: Date, required: true, index: true },
    relatedType: {
      type: String,
      enum: ['lead', 'contact', 'deal', 'company', null],
      default: null,
    },
    relatedId: { type: Schema.Types.ObjectId, default: null, index: true },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

export const Task = mongoose.model<ITaskDocument>('Task', TaskSchema);
