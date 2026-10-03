import { Response } from 'express';
import { Notification } from '../models/Notification';
import { AuthenticatedRequest } from '../types';

export const listNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;

  const notifications = await Notification.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(30);

  const unreadCount = await Notification.countDocuments({ userId: user._id, isRead: false });

  res.json({
    success: true,
    data: notifications,
    unreadCount,
  });
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;

  await Notification.findOneAndUpdate({ _id: id, userId: user._id }, { isRead: true });

  res.json({ success: true, message: 'Notification marked as read.' });
};

export const markAllAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;

  await Notification.updateMany({ userId: user._id, isRead: false }, { isRead: true });

  res.json({ success: true, message: 'All notifications marked as read.' });
};
