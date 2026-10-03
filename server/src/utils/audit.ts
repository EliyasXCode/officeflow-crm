import { Request } from 'express';
import { AuditLog } from '../models/AuditLog';
import { AuthenticatedRequest } from '../types';

interface AuditParams {
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
  req?: AuthenticatedRequest | Request;
  userId?: string;
  userName?: string;
  userRole?: any;
}

export const recordAuditLog = async ({
  action,
  entityType,
  entityId,
  details,
  req,
  userId,
  userName,
  userRole,
}: AuditParams): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const finalUserId = userId || (authReq?.user ? authReq.user._id : undefined);
    const finalUserName = userName || (authReq?.user ? authReq.user.name : 'System');
    const finalUserRole = userRole || (authReq?.user ? authReq.user.role : undefined);
    const ipAddress = req?.ip || req?.socket?.remoteAddress;

    await AuditLog.create({
      userId: finalUserId,
      userName: finalUserName,
      userRole: finalUserRole,
      action,
      entityType,
      entityId,
      details,
      ipAddress,
    });
  } catch (err) {
    console.error('[AuditLog] Failed to record audit log:', err);
  }
};
