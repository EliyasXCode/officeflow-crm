import mongoose, { Schema, Document } from 'mongoose';

export interface ISessionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  isValid: boolean;
  createdAt: Date;
}

const SessionSchema = new Schema<ISessionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: { expires: '7d' } },
    ipAddress: { type: String },
    userAgent: { type: String },
    isValid: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Session = mongoose.model<ISessionDocument>('Session', SessionSchema);
