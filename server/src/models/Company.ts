import mongoose, { Schema, Document } from 'mongoose';

export interface ICompanyDocument extends Document {
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  assignedTo?: mongoose.Types.ObjectId | null;
  teamId?: mongoose.Types.ObjectId | null;
  notes?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompanyDocument>(
  {
    name: { type: String, required: true, trim: true, index: true },
    industry: { type: String, trim: true },
    website: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'India' },
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', default: null, index: true },
    notes: { type: String, trim: true },
    isArchived: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

export const Company = mongoose.model<ICompanyDocument>('Company', CompanySchema);
