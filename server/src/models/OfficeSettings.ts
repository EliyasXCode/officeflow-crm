import mongoose, { Schema, Document } from 'mongoose';

export interface IOfficeSettingsDocument extends Document {
  officeName: string;
  currency: string;
  timezone: string;
  allowedLeadSources: string[];
  pipelineStages: string[];
  updatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const OfficeSettingsSchema = new Schema<IOfficeSettingsDocument>(
  {
    officeName: { type: String, default: 'OfficeFlow Headquarters' },
    currency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    allowedLeadSources: {
      type: [String],
      default: ['Website', 'Referral', 'LinkedIn', 'Call', 'Walk-in', 'Other'],
    },
    pipelineStages: {
      type: [String],
      default: ['Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost'],
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

export const OfficeSettings = mongoose.model<IOfficeSettingsDocument>('OfficeSettings', OfficeSettingsSchema);
