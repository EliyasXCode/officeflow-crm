import { Response } from 'express';
import { Deal } from '../models/Deal';
import { Activity } from '../models/Activity';
import { AuthenticatedRequest, DealStage } from '../types';
import { buildRecordScopeFilter, canAccessRecord } from '../middlewares/rbac';
import { recordAuditLog } from '../utils/audit';

export const listDeals = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const { stage, assignedTo, search } = req.query;

  const scopeFilter = buildRecordScopeFilter(user);
  const filter: any = { ...scopeFilter, isArchived: false };

  if (stage) filter.stage = stage;
  if (assignedTo && (user.role === 'admin' || user.role === 'manager')) {
    filter.assignedTo = assignedTo;
  }

  if (search) {
    const s = String(search).trim();
    filter.title = { $regex: s, $options: 'i' };
  }

  const deals = await Deal.find(filter)
    .populate('contactId', 'name email phone')
    .populate('companyId', 'name industry')
    .populate('assignedTo', 'name email')
    .populate('teamId', 'name')
    .sort({ createdAt: -1 });

  // Compute stage aggregates (count & sum of value in INR)
  const defaultStages: DealStage[] = ['Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost'];
  const stageSummaries = defaultStages.map((st) => {
    const stageDeals = deals.filter((d) => d.stage === st);
    const totalValue = stageDeals.reduce((sum, d) => sum + (d.value?.amount || 0), 0);
    return {
      stage: st,
      count: stageDeals.length,
      totalValue,
      currency: 'INR',
    };
  });

  const wonDealsValue = deals
    .filter((d) => d.stage === 'Won')
    .reduce((sum, d) => sum + (d.value?.amount || 0), 0);

  const openDealsValue = deals
    .filter((d) => ['Discovery', 'Proposal', 'Negotiation'].includes(d.stage))
    .reduce((sum, d) => sum + (d.value?.amount || 0), 0);

  res.json({
    success: true,
    data: deals,
    summary: {
      stageSummaries,
      openPipelineValue: openDealsValue,
      wonDealValue: wonDealsValue, // Won deal contracted value (distinguished from cash collected)
      currency: 'INR',
    },
  });
};

export const getDealById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;

  const deal = await Deal.findById(id)
    .populate('contactId')
    .populate('companyId')
    .populate('assignedTo', 'name email role')
    .populate('teamId', 'name')
    .populate('stageHistory.changedBy', 'name');

  if (!deal || deal.isArchived) {
    res.status(404).json({ success: false, message: 'Deal not found.' });
    return;
  }

  if (!canAccessRecord(user, deal)) {
    res.status(403).json({ success: false, message: 'Access denied.' });
    return;
  }

  const activities = await Activity.find({ relatedType: 'deal', relatedId: deal._id })
    .populate('authorId', 'name email')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: deal,
    activities,
  });
};

export const createDeal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const {
    title,
    contactId,
    companyId,
    amount,
    currency = 'INR',
    stage = 'Discovery',
    expectedCloseDate,
    assignedTo,
    notes,
  } = req.body;

  let finalAssignedTo = user._id;
  let finalTeamId = user.teamId || null;

  if (user.role === 'admin' && assignedTo) {
    finalAssignedTo = assignedTo;
  } else if (user.role === 'manager' && assignedTo) {
    finalAssignedTo = assignedTo;
    finalTeamId = user.teamId || null;
  }

  const deal = await Deal.create({
    title: title.trim(),
    contactId: contactId || null,
    companyId: companyId || null,
    value: {
      amount: Math.max(0, Number(amount) || 0),
      currency: currency.toUpperCase(),
    },
    stage,
    expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
    assignedTo: finalAssignedTo,
    teamId: finalTeamId,
    notes: notes?.trim(),
    stageHistory: [
      {
        stage,
        changedBy: user._id,
        changedAt: new Date(),
        notes: 'Initial creation',
      },
    ],
  });

  await recordAuditLog({
    action: 'DEAL_CREATED',
    entityType: 'Deal',
    entityId: (deal._id as any).toString(),
    details: { title: deal.title, amount: deal.value.amount, stage },
    req,
  });

  res.status(201).json({
    success: true,
    message: 'Deal created successfully.',
    data: deal,
  });
};

export const updateDealStage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;
  const { stage, notes, lostReason } = req.body;

  const deal = await Deal.findById(id);
  if (!deal || deal.isArchived) {
    res.status(404).json({ success: false, message: 'Deal not found.' });
    return;
  }

  if (!canAccessRecord(user, deal)) {
    res.status(403).json({ success: false, message: 'Access denied.' });
    return;
  }

  const prevStage = deal.stage;
  deal.stage = stage;
  if (stage === 'Lost' && lostReason) {
    deal.lostReason = lostReason.trim();
  }

  deal.stageHistory.push({
    stage,
    changedBy: user._id as any,
    changedAt: new Date(),
    notes: notes || `Moved stage from ${prevStage} to ${stage}`,
  });

  await deal.save();

  // Record an activity entry for this transition
  await Activity.create({
    type: 'Note',
    authorId: user._id,
    relatedType: 'deal',
    relatedId: deal._id,
    title: `Stage changed to ${stage}`,
    notes: `Deal stage moved from ${prevStage} to ${stage}.${lostReason ? ` Reason: ${lostReason}` : ''}`,
  });

  await recordAuditLog({
    action: 'DEAL_STAGE_CHANGED',
    entityType: 'Deal',
    entityId: id,
    details: { from: prevStage, to: stage, lostReason },
    req,
  });

  res.json({
    success: true,
    message: `Deal stage updated to ${stage}.`,
    data: deal,
  });
};

export const updateDeal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;
  const { title, contactId, companyId, amount, stage, expectedCloseDate, notes, lostReason } = req.body;

  const deal = await Deal.findById(id);
  if (!deal || deal.isArchived) {
    res.status(404).json({ success: false, message: 'Deal not found.' });
    return;
  }

  if (!canAccessRecord(user, deal)) {
    res.status(403).json({ success: false, message: 'Access denied.' });
    return;
  }

  if (title !== undefined) deal.title = title.trim();
  if (contactId !== undefined) deal.contactId = contactId || null;
  if (companyId !== undefined) deal.companyId = companyId || null;
  if (amount !== undefined) deal.value.amount = Math.max(0, Number(amount) || 0);
  if (expectedCloseDate !== undefined) {
    deal.expectedCloseDate = expectedCloseDate ? new Date(expectedCloseDate) : null;
  }
  if (notes !== undefined) deal.notes = notes?.trim();
  if (lostReason !== undefined) deal.lostReason = lostReason?.trim();

  if (stage && stage !== deal.stage) {
    const prevStage = deal.stage;
    deal.stage = stage;
    deal.stageHistory.push({
      stage,
      changedBy: user._id as any,
      changedAt: new Date(),
      notes: `Updated stage from ${prevStage} to ${stage}`,
    });
  }

  await deal.save();

  await recordAuditLog({
    action: 'DEAL_UPDATED',
    entityType: 'Deal',
    entityId: id,
    req,
  });

  res.json({
    success: true,
    message: 'Deal updated successfully.',
    data: deal,
  });
};

export const archiveDeal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;

  const deal = await Deal.findById(id);
  if (!deal) {
    res.status(404).json({ success: false, message: 'Deal not found.' });
    return;
  }

  if (!canAccessRecord(user, deal)) {
    res.status(403).json({ success: false, message: 'Access denied.' });
    return;
  }

  deal.isArchived = true;
  await deal.save();

  await recordAuditLog({
    action: 'DEAL_ARCHIVED',
    entityType: 'Deal',
    entityId: id,
    req,
  });

  res.json({ success: true, message: 'Deal archived successfully.' });
};
