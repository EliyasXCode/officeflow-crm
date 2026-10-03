import { Response } from 'express';
import { OfficeSettings } from '../models/OfficeSettings';
import { AuditLog } from '../models/AuditLog';
import { AuthenticatedRequest } from '../types';
import { recordAuditLog } from '../utils/audit';

export const getSettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  let settings = await OfficeSettings.findOne();
  if (!settings) {
    settings = await OfficeSettings.create({
      officeName: 'OfficeFlow Headquarters',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
    });
  }

  res.json({
    success: true,
    data: settings,
  });
};

export const updateSettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const { officeName, currency, timezone, allowedLeadSources, pipelineStages } = req.body;

  let settings = await OfficeSettings.findOne();
  if (!settings) {
    settings = new OfficeSettings();
  }

  if (officeName !== undefined) settings.officeName = officeName.trim();
  if (currency !== undefined) settings.currency = currency.trim().toUpperCase();
  if (timezone !== undefined) settings.timezone = timezone.trim();
  if (allowedLeadSources !== undefined) settings.allowedLeadSources = allowedLeadSources;
  if (pipelineStages !== undefined) settings.pipelineStages = pipelineStages;
  settings.updatedBy = user._id as any;

  await settings.save();

  await recordAuditLog({
    action: 'SETTINGS_UPDATED',
    entityType: 'OfficeSettings',
    entityId: (settings._id as any).toString(),
    details: { officeName, currency, timezone },
    req,
  });

  res.json({
    success: true,
    message: 'Office settings updated successfully.',
    data: settings,
  });
};

export const getAuditLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '30', action, entityType } = req.query;

  const filter: any = {};
  if (action) filter.action = action;
  if (entityType) filter.entityType = entityType;

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    AuditLog.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: logs,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
};
