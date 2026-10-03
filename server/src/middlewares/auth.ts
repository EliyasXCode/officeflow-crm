import { Response, NextFunction } from 'express';
import { Session } from '../models/Session';
import { User } from '../models/User';
import { hashToken, sanitizeUser } from '../utils/auth';
import { AuthenticatedRequest } from '../types';

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = req.cookies?.officeflow_session;

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      res.status(401).json({ success: false, message: 'Authentication required. No session token provided.' });
      return;
    }

    const tokenHash = hashToken(token);
    const session = await Session.findOne({
      tokenHash,
      isValid: true,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
      return;
    }

    const user = await User.findById(session.userId);
    if (!user) {
      await Session.updateOne({ _id: session._id }, { isValid: false });
      res.status(401).json({ success: false, message: 'User account not found.' });
      return;
    }

    if (user.status === 'deactivated') {
      await Session.updateMany({ userId: user._id }, { isValid: false });
      res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact an administrator.' });
      return;
    }

    req.user = sanitizeUser(user);
    req.sessionId = (session._id as any).toString();
    next();
  } catch (err: any) {
    console.error('[Auth Middleware] Error verifying session:', err);
    res.status(500).json({ success: false, message: 'Internal authentication error.' });
  }
};
