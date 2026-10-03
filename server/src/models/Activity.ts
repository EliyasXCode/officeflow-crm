import mongoose, { Schema, Document } from 'mongoose';
import { ActivityType } from '../types';

export interface IActivityDocument extends Document {
  type: ActivityType;
  authorId: mongoose.Types.ObjectId;
  relatedType: 'lead' | 'contact' | 'deal' | 'company';
  relatedId: mongoose.Types.ObjectId;
  title: string;
  notes?: string;
  outcome?: string;
  scheduledAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivityDocument>(
  {
    type: {
      type: String,
      enum: ['Call', 'Meeting', 'Email', 'Note', 'Follow-up'],
      required: true,
      index: true,
    },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    relatedType: {
      type: String,
      enum: ['lead', 'contact', 'deal', 'company'],
      required: true,
      index: true,
    },
    relatedId: { type: Schema.Types.ObjectId, required: true, index: true },
    title: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    outcome: { type: String, trim: true },
    scheduledAt: { type: Date, default: null, index: true },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Activity = mongoose.model<IActivityDocument>('Activity', ActivitySchema);
