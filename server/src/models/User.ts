import mongoose, { Schema, Document } from 'mongoose';
import { UserRole, UserStatus } from '../types';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  status: UserStatus;
  teamId?: mongoose.Types.ObjectId | null;
  phone?: string;
  jobTitle?: string;
  inviteToken?: string;
  inviteExpiresAt?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String },
    role: {
      type: String,
      enum: ['admin', 'manager', 'employee'],
      default: 'employee',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'deactivated', 'invited'],
      default: 'active',
      required: true,
      index: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
      index: true,
    },
    phone: { type: String, trim: true },
    jobTitle: { type: String, trim: true },
    inviteToken: { type: String, select: false, index: true },
    inviteExpiresAt: { type: Date, select: false },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUserDocument>('User', UserSchema);
