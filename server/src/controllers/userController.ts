import { Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Lead } from '../models/Lead';
import { Deal } from '../models/Deal';
import { Task } from '../models/Task';
import { Session } from '../models/Session';
import { generateSecureToken, sanitizeUser } from '../utils/auth';
import { recordAuditLog } from '../utils/audit';
import { AuthenticatedRequest } from '../types';

export const listUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const currentUser = req.user!;
  const { role, status, teamId } = req.query;

  const query: any = {};

  if (currentUser.role === 'employee') {
    // Employees can only view themselves or colleagues in their team
    if (currentUser.teamId) {
      query.teamId = currentUser.teamId;
    } else {
      query._id = currentUser._id;
    }
  } else if (currentUser.role === 'manager') {
    // Managers can view users in their team
    if (currentUser.teamId) {
      query.teamId = currentUser.teamId;
    }
  }

  if (role) query.role = role;
  if (status) query.status = status;
  if (teamId && currentUser.role === 'admin') query.teamId = teamId;

  const users = await User.find(query).populate('teamId', 'name').sort({ name: 1 });

  res.json({
    success: true,
    data: users.map(sanitizeUser),
  });
};

export const inviteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { name, email, role, teamId, jobTitle, phone } = req.body;

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    res.status(400).json({ success: false, message: 'User with this email already exists.' });
    return;
  }

  const rawInviteToken = generateSecureToken(24);
  const inviteExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

  const newUser = await User.create({
    name,
    email: normalizedEmail,
    role: role || 'employee',
    status: 'invited',
    teamId: teamId || null,
    jobTitle,
    phone,
    inviteToken: rawInviteToken,
    inviteExpiresAt,
  });

  await recordAuditLog({
    action: 'USER_INVITED',
    entityType: 'User',
    entityId: (newUser._id as any).toString(),
    details: { email: newUser.email, role: newUser.role, teamId },
    req,
  });

  // Secure invitation link for development / direct onboarding
  const inviteLink = `/accept-invite?token=${rawInviteToken}`;

  res.status(201).json({
    success: true,
    message: 'User invited successfully.',
    user: sanitizeUser(newUser),
    invitation: {
      token: rawInviteToken,
      expiresAt: inviteExpiresAt,
      inviteLink,
      note: 'In development mode, provide this inviteLink or token to the employee to set their password.',
    },
  });
};

export const updateUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, role, teamId, jobTitle, phone } = req.body;

  const userToUpdate = await User.findById(id);
  if (!userToUpdate) {
    res.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  // Prevent demoting the last active admin
  if (userToUpdate.role === 'admin' && role && role !== 'admin') {
    const activeAdminCount = await User.countDocuments({ role: 'admin', status: 'active' });
    if (activeAdminCount <= 1) {
      res.status(400).json({ success: false, message: 'Cannot demote the last remaining active admin.' });
      return;
    }
  }

  if (name !== undefined) userToUpdate.name = name;
  if (role !== undefined) userToUpdate.role = role;
  if (teamId !== undefined) userToUpdate.teamId = teamId ? new mongoose.Types.ObjectId(teamId) : null;
  if (jobTitle !== undefined) userToUpdate.jobTitle = jobTitle;
  if (phone !== undefined) userToUpdate.phone = phone;

  await userToUpdate.save();

  await recordAuditLog({
    action: 'USER_UPDATED',
    entityType: 'User',
    entityId: id,
    details: { name, role, teamId, jobTitle },
    req,
  });

  res.json({
    success: true,
    message: 'User updated successfully.',
    user: sanitizeUser(userToUpdate),
  });
};

export const deactivateUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { reassignToUserId } = req.body;

  const user = await User.findById(id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  // Prevent deactivating the last active admin
  if (user.role === 'admin') {
    const activeAdminCount = await User.countDocuments({ role: 'admin', status: 'active' });
    if (activeAdminCount <= 1) {
      res.status(400).json({ success: false, message: 'Cannot deactivate the last remaining active admin.' });
      return;
    }
  }

  // If reassignment is specified, validate destination user
  if (reassignToUserId) {
    const reassignee = await User.findOne({ _id: reassignToUserId, status: 'active' });
    if (!reassignee) {
      res.status(400).json({ success: false, message: 'Reassignee user does not exist or is inactive.' });
      return;
    }

    // Reassign open leads, deals, tasks
    await Lead.updateMany({ assignedTo: user._id, status: { $ne: 'Converted' } }, { assignedTo: reassignee._id });
    await Deal.updateMany({ assignedTo: user._id, stage: { $nin: ['Won', 'Lost'] } }, { assignedTo: reassignee._id });
    await Task.updateMany({ assignedTo: user._id, status: { $ne: 'Done' } }, { assignedTo: reassignee._id });
  }

  user.status = 'deactivated';
  await user.save();

  // Invalidate all active sessions for this user immediately
  await Session.updateMany({ userId: user._id }, { isValid: false });

  await recordAuditLog({
    action: 'USER_DEACTIVATED',
    entityType: 'User',
    entityId: id,
    details: { reassignToUserId },
    req,
  });

  res.json({
    success: true,
    message: 'User deactivated and active sessions revoked successfully.',
  });
};
