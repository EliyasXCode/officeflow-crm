import { Response } from 'express';
import { User } from '../models/User';
import { Session } from '../models/Session';
import { Team } from '../models/Team';
import { comparePassword, createSession, hashPassword, hashToken, sanitizeUser } from '../utils/auth';
import { recordAuditLog } from '../utils/audit';
import { AuthenticatedRequest } from '../types';
import { ENV } from '../config/env';

export const login = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user || !user.passwordHash) {
    res.status(401).json({ success: false, message: 'Invalid email or password.' });
    return;
  }

  if (user.status === 'deactivated') {
    res.status(403).json({ success: false, message: 'Account has been deactivated. Please contact an admin.' });
    return;
  }

  const isValidPassword = await comparePassword(password, user.passwordHash);
  if (!isValidPassword) {
    res.status(401).json({ success: false, message: 'Invalid email or password.' });
    return;
  }

  const ipAddress = (req.ip || req.socket.remoteAddress || '') as string;
  const userAgent = req.headers['user-agent'] || '';

  const rawToken = await createSession((user._id as any).toString(), ipAddress, userAgent);

  user.lastLoginAt = new Date();
  await user.save();

  // Set secure HttpOnly cookie
  res.cookie('officeflow_session', rawToken, {
    httpOnly: true,
    secure: ENV.NODE_ENV === 'production',
    sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });

  await recordAuditLog({
    userId: (user._id as any).toString(),
    userName: user.name,
    userRole: user.role,
    action: 'USER_LOGIN',
    entityType: 'User',
    entityId: (user._id as any).toString(),
    details: { ip: ipAddress },
    req,
  });

  const team = user.teamId ? await Team.findById(user.teamId) : null;

  res.json({
    success: true,
    message: 'Login successful.',
    user: { ...sanitizeUser(user), team },
    token: rawToken,
  });
};

export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (req.sessionId) {
    await Session.findByIdAndUpdate(req.sessionId, { isValid: false });
  }

  res.clearCookie('officeflow_session', {
    httpOnly: true,
    secure: ENV.NODE_ENV === 'production',
    sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });

  if (req.user) {
    await recordAuditLog({
      action: 'USER_LOGOUT',
      entityType: 'User',
      entityId: req.user._id,
      req,
    });
  }

  res.json({ success: true, message: 'Logged out successfully.' });
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated.' });
    return;
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  const team = user.teamId ? await Team.findById(user.teamId) : null;

  res.json({
    success: true,
    user: {
      ...sanitizeUser(user),
      team,
    },
  });
};

export const acceptInvite = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { inviteToken, password } = req.body;

  const user = await User.findOne({
    inviteToken,
    inviteExpiresAt: { $gt: new Date() },
  }).select('+inviteToken +inviteExpiresAt');

  if (!user) {
    res.status(400).json({ success: false, message: 'Invalid or expired invitation token.' });
    return;
  }

  user.passwordHash = await hashPassword(password);
  user.status = 'active';
  user.inviteToken = undefined;
  user.inviteExpiresAt = undefined;
  await user.save();

  await recordAuditLog({
    userId: (user._id as any).toString(),
    userName: user.name,
    userRole: user.role,
    action: 'INVITE_ACCEPTED',
    entityType: 'User',
    entityId: (user._id as any).toString(),
    req,
  });

  res.json({
    success: true,
    message: 'Password set and account activated successfully. You may now log in.',
  });
};
