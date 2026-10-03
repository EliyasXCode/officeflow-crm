import { Response } from 'express';
import { Activity } from '../models/Activity';
import { Lead } from '../models/Lead';
import { AuthenticatedRequest } from '../types';
import { recordAuditLog } from '../utils/audit';

export const listActivities = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { relatedType, relatedId, type } = req.query;

  const filter: any = {};
  if (relatedType) filter.relatedType = relatedType;
  if (relatedId) filter.relatedId = relatedId;
  if (type) filter.type = type;

  const activities = await Activity.find(filter)
    .populate('authorId', 'name email role')
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({
    success: true,
    data: activities,
  });
};

export const createActivity = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const { type, relatedType, relatedId, title, notes, outcome, scheduledAt } = req.body;

  const activity = await Activity.create({
    type,
    authorId: user._id,
    relatedType,
    relatedId,
    title: title.trim(),
    notes: notes?.trim(),
    outcome: outcome?.trim(),
    scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
  });

  // If this is a follow-up scheduled on a Lead, update the lead's nextFollowUpDate
  if (relatedType === 'lead') {
    if (type === 'Follow-up' && scheduledAt) {
      await Lead.findByIdAndUpdate(relatedId, { nextFollowUpDate: new Date(scheduledAt) });
    } else if (type === 'Follow-up' && outcome) {
      // Completed follow up - if outcome recorded and no new follow-up date, clear or keep
      await Lead.findByIdAndUpdate(relatedId, { status: 'Contacted' });
    }
  }

  await recordAuditLog({
    action: 'ACTIVITY_LOGGED',
    entityType: 'Activity',
    entityId: (activity._id as any).toString(),
    details: { type, relatedType, relatedId, title },
    req,
  });

  res.status(201).json({
    success: true,
    message: 'Activity recorded successfully.',
    data: activity,
  });
};

export const getCalendarEvents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { start, end } = req.query;

  const startDate = start ? new Date(start as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = end ? new Date(end as string) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  // Return activities that have a scheduled date, plus leads with upcoming nextFollowUpDate
  const [activities, leads] = await Promise.all([
    Activity.find({
      scheduledAt: { $gte: startDate, $lte: endDate },
    })
      .populate('authorId', 'name email')
      .sort({ scheduledAt: 1 }),

    Lead.find({
      nextFollowUpDate: { $gte: startDate, $lte: endDate },
      isArchived: false,
    })
      .populate('assignedTo', 'name email')
      .select('fullName company nextFollowUpDate assignedTo status priority'),
  ]);

  const events = [
    ...activities.map((a: any) => ({
      id: a._id,
      title: `${a.type}: ${a.title}`,
      type: a.type,
      start: a.scheduledAt,
      author: a.authorId?.name,
      notes: a.notes,
      relatedType: a.relatedType,
      relatedId: a.relatedId,
    })),
    ...leads.map((l: any) => ({
      id: `lead-${l._id}`,
      title: `Follow-up: ${l.fullName} (${l.company || 'No Company'})`,
      type: 'Follow-up',
      start: l.nextFollowUpDate,
      author: l.assignedTo?.name || 'Unassigned',
      notes: `Status: ${l.status}, Priority: ${l.priority}`,
      relatedType: 'lead',
      relatedId: l._id,
    })),
  ];

  res.json({
    success: true,
    data: events,
  });
};
