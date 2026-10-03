import mongoose, { Schema, Document } from 'mongoose';
import { LeadSource, LeadStatus, PriorityLevel } from '../types';

export interface ILeadDocument extends Document {
  fullName: string;
  company?: string;
  email: string;
  phone?: string;
  normalizedEmail: string;
  normalizedPhone?: string;
  source: LeadSource;
  status: LeadStatus;
  priority: PriorityLevel;
  assignedTo?: mongoose.Types.ObjectId | null;
  teamId?: mongoose.Types.ObjectId | null;
  tags: string[];
  notes?: string;
  nextFollowUpDate?: Date | null;
  isArchived: boolean;
  convertedContactId?: mongoose.Types.ObjectId | null;
  convertedCompanyId?: mongoose.Types.ObjectId | null;
  convertedDealId?: mongoose.Types.ObjectId | null;
  convertedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILeadDocument>(
  {
    fullName: { type: String, required: true, trim: true, index: true },
    company: { type: String, trim: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    normalizedEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    normalizedPhone: { type: String, trim: true, index: true },
    source: {
      type: String,
      enum: ['Website', 'Referral', 'LinkedIn', 'Call', 'Walk-in', 'Other'],
      default: 'Website',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted'],
      default: 'New',
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
      required: true,
      index: true,
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', default: null, index: true },
    tags: [{ type: String, trim: true }],
    notes: { type: String, trim: true },
    nextFollowUpDate: { type: Date, default: null, index: true },
    isArchived: { type: Boolean, default: false, index: true },
    convertedContactId: { type: Schema.Types.ObjectId, ref: 'Contact', default: null },
    convertedCompanyId: { type: Schema.Types.ObjectId, ref: 'Company', default: null },
    convertedDealId: { type: Schema.Types.ObjectId, ref: 'Deal', default: null },
    convertedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// Pre-validate hook to calculate normalized email and normalized phone
LeadSchema.pre('validate', function (next) {
  if (this.email) {
    this.normalizedEmail = this.email.trim().toLowerCase();
  }
  if (this.phone) {
    this.normalizedPhone = this.phone.replace(/[^0-9+]/g, '');
  }
  next();
});

export const Lead = mongoose.model<ILeadDocument>('Lead', LeadSchema);
