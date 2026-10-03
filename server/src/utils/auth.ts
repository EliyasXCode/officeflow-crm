import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Session } from '../models/Session';
import { IUserDocument } from '../models/User';

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateSecureToken = (bytes: number = 32): string => {
  return crypto.randomBytes(bytes).toString('hex');
};

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const createSession = async (
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> => {
  const rawToken = generateSecureToken(32);
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await Session.create({
    userId,
    tokenHash,
    expiresAt,
    ipAddress,
    userAgent,
    isValid: true,
  });

  return rawToken;
};

export const sanitizeUser = (user: IUserDocument | any) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.passwordHash;
  delete obj.inviteToken;
  delete obj.inviteExpiresAt;
  return obj;
};
