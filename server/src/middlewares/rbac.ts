import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole, IUser } from '../types';

export const requireRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' does not have sufficient permissions to perform this action.`,
      });
      return;
    }

    next();
  };
};

export const buildRecordScopeFilter = (
  user: IUser,
  options: { teamField?: string; ownerField?: string } = {}
) => {
  const teamField = options.teamField || 'teamId';
  const ownerField = options.ownerField || 'assignedTo';

  if (user.role === 'admin') {
    return {};
  }

  if (user.role === 'manager') {
    if (user.teamId) {
      return {
        $or: [
          { [teamField]: user.teamId },
          { [ownerField]: user._id },
        ],
      };
    }
    return { [ownerField]: user._id };
  }

  // Employee: only assigned to themselves
  return { [ownerField]: user._id };
};

export const canAccessRecord = (
  user: IUser,
  record: { teamId?: any; assignedTo?: any }
): boolean => {
  if (user.role === 'admin') return true;

  const recordTeam = record.teamId?.toString();
  const recordOwner = record.assignedTo?.toString();
  const userTeam = user.teamId?.toString();
  const userId = user._id.toString();

  if (user.role === 'manager') {
    if (userTeam && recordTeam && recordTeam === userTeam) return true;
    if (recordOwner && recordOwner === userId) return true;
    return false;
  }

  // Employee: only their own assigned records
  return recordOwner === userId;
};
