export type UserRole = 'admin' | 'manager' | 'employee';
export type UserStatus = 'active' | 'deactivated' | 'invited';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  teamId?: { _id: string; name: string } | string | null;
  team?: { _id: string; name: string } | null;
  phone?: string;
  jobTitle?: string;
  workload?: {
    openLeads: number;
    openDeals: number;
    overdueTasks: number;
  };
  createdAt: string;
  updatedAt: string;
}

export type LeadSource = 'Website' | 'Referral' | 'LinkedIn' | 'Call' | 'Walk-in' | 'Other';
export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Unqualified' | 'Converted';
export type PriorityLevel = 'Low' | 'Medium' | 'High';

export interface Lead {
  _id: string;
  fullName: string;
  company?: string;
  email: string;
  phone?: string;
  source: LeadSource;
  status: LeadStatus;
  priority: PriorityLevel;
  assignedTo?: { _id: string; name: string; email: string } | null;
  teamId?: { _id: string; name: string } | null;
  tags: string[];
  notes?: string;
  nextFollowUpDate?: string | null;
  isArchived: boolean;
  convertedContactId?: any;
  convertedCompanyId?: any;
  convertedDealId?: any;
  convertedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DealStage = 'Discovery' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';

export interface Deal {
  _id: string;
  title: string;
  contactId?: { _id: string; name: string; email: string; phone?: string } | null;
  companyId?: { _id: string; name: string; industry?: string } | null;
  value: {
    amount: number;
    currency: string;
  };
  stage: DealStage;
  expectedCloseDate?: string | null;
  assignedTo?: { _id: string; name: string; email: string } | null;
  teamId?: { _id: string; name: string } | null;
  notes?: string;
  lostReason?: string;
  stageHistory?: {
    stage: DealStage;
    changedBy?: { name: string };
    changedAt: string;
    notes?: string;
  }[];
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  _id: string;
  name: string;
  jobTitle?: string;
  email: string;
  phone?: string;
  companyId?: { _id: string; name: string; industry?: string } | null;
  companyName?: string;
  assignedTo?: { _id: string; name: string } | null;
  teamId?: { _id: string; name: string } | null;
  tags: string[];
  notes?: string;
  createdAt: string;
}

export interface Company {
  _id: string;
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
  assignedTo?: { _id: string; name: string } | null;
  teamId?: { _id: string; name: string } | null;
  notes?: string;
  createdAt: string;
}

export type TaskStatus = 'To Do' | 'In Progress' | 'Done';

export interface Task {
  _id: string;
  title: string;
  description?: string;
  assignedTo: { _id: string; name: string; email: string };
  teamId?: { _id: string; name: string } | null;
  priority: PriorityLevel;
  status: TaskStatus;
  dueDate: string;
  relatedType?: 'lead' | 'contact' | 'deal' | 'company' | null;
  relatedId?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

export type ActivityType = 'Call' | 'Meeting' | 'Email' | 'Note' | 'Follow-up';

export interface Activity {
  _id: string;
  type: ActivityType;
  authorId: { _id: string; name: string; email: string };
  relatedType: 'lead' | 'contact' | 'deal' | 'company';
  relatedId: string;
  title: string;
  notes?: string;
  outcome?: string;
  scheduledAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

export interface AppNotification {
  _id: string;
  title: string;
  message: string;
  type: 'task_assigned' | 'task_due' | 'lead_assigned' | 'system';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Team {
  _id: string;
  name: string;
  description?: string;
  managerId?: { _id: string; name: string; email: string } | null;
  memberCount?: number;
  createdAt: string;
}
