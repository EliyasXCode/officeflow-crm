import { Response } from 'express';
import { Lead } from '../models/Lead';
import { Deal } from '../models/Deal';
import { Task } from '../models/Task';
import { Activity } from '../models/Activity';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../types';
import { buildRecordScopeFilter } from '../middlewares/rbac';

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const { range = '30d' } = req.query;

  // Date range parsing
  const now = new Date();
  let rangeStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (range === '7d') rangeStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (range === '90d') rangeStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  if (range === 'all') rangeStart = new Date(0);

  const scopeFilter = buildRecordScopeFilter(user);

  // 1. Leads counts
  const totalAccessibleLeads = await Lead.countDocuments({ ...scopeFilter, isArchived: false });
  const newLeadsInRange = await Lead.countDocuments({
    ...scopeFilter,
    isArchived: false,
    createdAt: { $gte: rangeStart },
  });
  const convertedLeads = await Lead.countDocuments({
    ...scopeFilter,
    isArchived: false,
    status: 'Converted',
  });

  // Conversion rate definition: (Converted Leads / Total Non-Archived Leads) * 100%
  const conversionRate =
    totalAccessibleLeads > 0
      ? Number(((convertedLeads / totalAccessibleLeads) * 100).toFixed(1))
      : 0;

  // Lead status breakdown
  const leadStatuses = ['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted'];
  const leadStatusCounts = await Promise.all(
    leadStatuses.map(async (st) => {
      const count = await Lead.countDocuments({ ...scopeFilter, isArchived: false, status: st });
      return { status: st, count };
    })
  );

  // 2. Deals and Pipeline
  const deals = await Deal.find({ ...scopeFilter, isArchived: false });
  const openDeals = deals.filter((d) => ['Discovery', 'Proposal', 'Negotiation'].includes(d.stage));
  const wonDeals = deals.filter((d) => d.stage === 'Won');

  const openPipelineValue = openDeals.reduce((sum, d) => sum + (d.value?.amount || 0), 0);
  const wonDealValue = wonDeals.reduce((sum, d) => sum + (d.value?.amount || 0), 0);

  const dealStages = ['Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost'];
  const dealsByStage = dealStages.map((st) => {
    const stageDeals = deals.filter((d) => d.stage === st);
    return {
      stage: st,
      count: stageDeals.length,
      value: stageDeals.reduce((sum, d) => sum + (d.value?.amount || 0), 0),
    };
  });

  // 3. Tasks
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const taskScope = user.role === 'admin' ? {} : user.role === 'manager' && user.teamId ? { teamId: user.teamId } : { assignedTo: user._id };

  const [tasksDueToday, overdueTasks, upcomingWork] = await Promise.all([
    Task.countDocuments({
      ...taskScope,
      status: { $ne: 'Done' },
      dueDate: { $gte: startOfToday, $lte: endOfToday },
    }),
    Task.countDocuments({
      ...taskScope,
      status: { $ne: 'Done' },
      dueDate: { $lt: startOfToday },
    }),
    Task.find({
      ...taskScope,
      status: { $ne: 'Done' },
      dueDate: { $gte: startOfToday },
    })
      .populate('assignedTo', 'name email')
      .sort({ dueDate: 1 })
      .limit(5),
  ]);

  // Upcoming follow-ups
  const upcomingFollowUps = await Lead.find({
    ...scopeFilter,
    isArchived: false,
    nextFollowUpDate: { $gte: startOfToday },
  })
    .populate('assignedTo', 'name email')
    .sort({ nextFollowUpDate: 1 })
    .limit(5);

  // Recent activity stream
  const recentActivities = await Activity.find()
    .populate('authorId', 'name email role')
    .sort({ createdAt: -1 })
    .limit(10);

  // Team performance (only for managers and admins)
  let teamPerformance: any[] = [];
  if (user.role === 'admin' || user.role === 'manager') {
    const memberQuery: any = { status: 'active' };
    if (user.role === 'manager' && user.teamId) {
      memberQuery.teamId = user.teamId;
    }

    const members = await User.find(memberQuery).select('name email role teamId');
    teamPerformance = await Promise.all(
      members.map(async (m) => {
        const [memberLeads, memberWonDeals, memberOverdue] = await Promise.all([
          Lead.countDocuments({ assignedTo: m._id, isArchived: false }),
          Deal.find({ assignedTo: m._id, stage: 'Won', isArchived: false }),
          Task.countDocuments({ assignedTo: m._id, status: { $ne: 'Done' }, dueDate: { $lt: startOfToday } }),
        ]);

        const wonSum = memberWonDeals.reduce((sum, d) => sum + (d.value?.amount || 0), 0);
        return {
          userId: m._id,
          name: m.name,
          role: m.role,
          leadsCount: memberLeads,
          wonDealsCount: memberWonDeals.length,
          wonValue: wonSum,
          overdueTasks: memberOverdue,
        };
      })
    );
  }

  res.json({
    success: true,
    data: {
      metrics: {
        totalAccessibleLeads,
        newLeadsInRange,
        conversionRate,
        openPipelineValue,
        wonDealValue, // Contracted won deal value (distinguished from cash collected)
        tasksDueToday,
        overdueTasks,
        upcomingFollowUpsCount: upcomingFollowUps.length,
        currency: 'INR',
      },
      leadStatusBreakdown: leadStatusCounts,
      dealsByStage,
      upcomingWork,
      upcomingFollowUps,
      recentActivities,
      teamPerformance,
    },
  });
};
