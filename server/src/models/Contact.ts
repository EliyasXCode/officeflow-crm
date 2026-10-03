import mongoose, { Schema, Document } from 'mongoose';

export interface IContactDocument extends Document {
  name: string;
  jobTitle?: string;
  email: string;
  phone?: string;
  companyId?: mongoose.Types.ObjectId | null;
  companyName?: string;
  assignedTo?: mongoose.Types.ObjectId | null;
  teamId?: mongoose.Types.ObjectId | null;
  tags: string[];
  notes?: string;
  sourceLeadId?: mongoose.Types.ObjectId | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContactDocument>(
  {
    name: { type: String, required: true, trim: true, index: true },
    jobTitle: { type: String, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', default: null, index: true },
    companyName: { type: String, trim: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', default: null, index: true },
    tags: [{ type: String, trim: true }],
    notes: { type: String, trim: true },
    sourceLeadId: { type: Schema.Types.ObjectId, ref: 'Lead', default: null, index: true },
    isArchived: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

export const Contact = mongoose.model<IContactDocument>('Contact', ContactSchema);
