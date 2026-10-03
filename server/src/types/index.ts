import { Request } from 'express';

export type UserRole = 'admin' | 'manager' | 'employee';
export type UserStatus = 'active' | 'deactivated' | 'invited';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  status: UserStatus;
  teamId?: string | null;
  phone?: string;
  jobTitle?: string;
  inviteToken?: string;
  inviteExpiresAt?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  sessionId?: string;
}

export type LeadSource = 'Website' | 'Referral' | 'LinkedIn' | 'Call' | 'Walk-in' | 'Other';
export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Unqualified' | 'Converted';
export type PriorityLevel = 'Low' | 'Medium' | 'High';

export type DealStage = 'Discovery' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
export type TaskStatus = 'To Do' | 'In Progress' | 'Done';
export type ActivityType = 'Call' | 'Meeting' | 'Email' | 'Note' | 'Follow-up';

export interface CurrencyValue {
  amount: number; // Stored in major or minor units, represented with 2 decimal precision
  currency: string; // e.g. 'INR'
}
