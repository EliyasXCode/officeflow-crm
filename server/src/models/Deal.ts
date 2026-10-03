import mongoose, { Schema, Document } from 'mongoose';
import { DealStage } from '../types';

export interface IStageHistoryItem {
  stage: DealStage;
  changedBy?: mongoose.Types.ObjectId | null;
  changedAt: Date;
  notes?: string;
}

export interface IDealDocument extends Document {
  title: string;
  contactId?: mongoose.Types.ObjectId | null;
  companyId?: mongoose.Types.ObjectId | null;
  value: {
    amount: number;
    currency: string;
  };
  stage: DealStage;
  expectedCloseDate?: Date | null;
  assignedTo?: mongoose.Types.ObjectId | null;
  teamId?: mongoose.Types.ObjectId | null;
  notes?: string;
  lostReason?: string;
  stageHistory: IStageHistoryItem[];
  sourceLeadId?: mongoose.Types.ObjectId | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DealSchema = new Schema<IDealDocument>(
  {
    title: { type: String, required: true, trim: true, index: true },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', default: null, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', default: null, index: true },
    value: {
      amount: { type: Number, required: true, min: 0, default: 0 },
      currency: { type: String, required: true, default: 'INR', uppercase: true },
    },
    stage: {
      type: String,
      enum: ['Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost'],
      default: 'Discovery',
      required: true,
      index: true,
    },
    expectedCloseDate: { type: Date, default: null, index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', default: null, index: true },
    notes: { type: String, trim: true },
    lostReason: { type: String, trim: true },
    stageHistory: [
      {
        stage: { type: String, required: true },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        changedAt: { type: Date, default: Date.now },
        notes: { type: String },
      },
    ],
    sourceLeadId: { type: Schema.Types.ObjectId, ref: 'Lead', default: null, index: true },
    isArchived: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

export const Deal = mongoose.model<IDealDocument>('Deal', DealSchema);
