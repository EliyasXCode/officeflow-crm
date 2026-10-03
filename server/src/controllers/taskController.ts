import { Response } from 'express';
import { Task } from '../models/Task';
import { Notification } from '../models/Notification';
import { AuthenticatedRequest } from '../types';
import { buildRecordScopeFilter, canAccessRecord } from '../middlewares/rbac';
import { recordAuditLog } from '../utils/audit';

export const listTasks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const { view = 'my', filter: timeFilter, status, priority, assignedTo } = req.query;

  let baseFilter: any = {};

  if (view === 'team' && (user.role === 'manager' || user.role === 'admin')) {
    if (user.role === 'manager' && user.teamId) {
      baseFilter.teamId = user.teamId;
    }
  } else {
    // "my" view: only assigned to the current user
    baseFilter.assignedTo = user._id;
  }

  if (assignedTo && (user.role === 'admin' || user.role === 'manager')) {
    baseFilter.assignedTo = assignedTo;
  }

  if (status) {
    baseFilter.status = status;
  }

  if (priority) {
    baseFilter.priority = priority;
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (timeFilter === 'today') {
    baseFilter.dueDate = { $gte: startOfToday, $lte: endOfToday };
    baseFilter.status = { $ne: 'Done' };
  } else if (timeFilter === 'overdue') {
    baseFilter.dueDate = { $lt: startOfToday };
    baseFilter.status = { $ne: 'Done' };
  } else if (timeFilter === 'upcoming') {
    baseFilter.dueDate = { $gt: endOfToday };
    baseFilter.status = { $ne: 'Done' };
  } else if (timeFilter === 'done') {
    baseFilter.status = 'Done';
  }

  const tasks = await Task.find(baseFilter)
    .populate('assignedTo', 'name email role')
    .populate('teamId', 'name')
    .sort({ dueDate: 1 });

  // Counts for tabs
  const myScope = { assignedTo: user._id };
  const [todayCount, overdueCount, upcomingCount] = await Promise.all([
    Task.countDocuments({
      ...myScope,
      status: { $ne: 'Done' },
      dueDate: { $gte: startOfToday, $lte: endOfToday },
    }),
    Task.countDocuments({
      ...myScope,
      status: { $ne: 'Done' },
      dueDate: { $lt: startOfToday },
    }),
    Task.countDocuments({
      ...myScope,
      status: { $ne: 'Done' },
      dueDate: { $gt: endOfToday },
    }),
  ]);

  res.json({
    success: true,
    data: tasks,
    counts: {
      today: todayCount,
      overdue: overdueCount,
      upcoming: upcomingCount,
    },
  });
};

export const createTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const { title, description, assignedTo, priority = 'Medium', dueDate, relatedType, relatedId } = req.body;

  let targetUserId = user._id;
  let targetTeamId = user.teamId || null;

  if (assignedTo && (user.role === 'admin' || user.role === 'manager')) {
    targetUserId = assignedTo;
  }

  const task = await Task.create({
    title: title.trim(),
    description: description?.trim(),
    assignedTo: targetUserId,
    teamId: targetTeamId,
    priority,
    status: 'To Do',
    dueDate: new Date(dueDate),
    relatedType: relatedType || null,
    relatedId: relatedId || null,
  });

  // Notify assigned user if different from author
  if (targetUserId.toString() !== user._id.toString()) {
    await Notification.create({
      userId: targetUserId,
      title: 'New Task Assigned',
      message: `${user.name} assigned you a task: "${task.title}"`,
      type: 'task_assigned',
      link: '/tasks',
    });
  }

  await recordAuditLog({
    action: 'TASK_CREATED',
    entityType: 'Task',
    entityId: (task._id as any).toString(),
    details: { title: task.title, assignedTo: targetUserId },
    req,
  });

  res.status(201).json({
    success: true,
    message: 'Task created successfully.',
    data: task,
  });
};

export const updateTaskStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;
  const { status } = req.body;

  const task = await Task.findById(id);
  if (!task) {
    res.status(404).json({ success: false, message: 'Task not found.' });
    return;
  }

  if (!canAccessRecord(user, task)) {
    res.status(403).json({ success: false, message: 'Access denied.' });
    return;
  }

  task.status = status;
  task.completedAt = status === 'Done' ? new Date() : null;
  await task.save();

  await recordAuditLog({
    action: 'TASK_STATUS_UPDATED',
    entityType: 'Task',
    entityId: id,
    details: { status },
    req,
  });

  res.json({
    success: true,
    message: `Task marked as ${status}.`,
    data: task,
  });
};

export const updateTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;
  const { title, description, assignedTo, priority, status, dueDate } = req.body;

  const task = await Task.findById(id);
  if (!task) {
    res.status(404).json({ success: false, message: 'Task not found.' });
    return;
  }

  if (!canAccessRecord(user, task)) {
    res.status(403).json({ success: false, message: 'Access denied.' });
    return;
  }

  if (title !== undefined) task.title = title.trim();
  if (description !== undefined) task.description = description.trim();
  if (priority !== undefined) task.priority = priority;
  if (dueDate !== undefined) task.dueDate = new Date(dueDate);

  if (status !== undefined) {
    task.status = status;
    task.completedAt = status === 'Done' ? new Date() : null;
  }

  if (assignedTo && (user.role === 'admin' || user.role === 'manager')) {
    task.assignedTo = assignedTo;
  }

  await task.save();

  res.json({
    success: true,
    message: 'Task updated successfully.',
    data: task,
  });
};

export const deleteTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;

  const task = await Task.findById(id);
  if (!task) {
    res.status(404).json({ success: false, message: 'Task not found.' });
    return;
  }

  if (!canAccessRecord(user, task)) {
    res.status(403).json({ success: false, message: 'Access denied.' });
    return;
  }

  await Task.findByIdAndDelete(id);

  res.json({ success: true, message: 'Task deleted successfully.' });
};
