import { Response } from 'express';
import { Lead } from '../models/Lead';
import { Deal } from '../models/Deal';
import { Task } from '../models/Task';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../types';
import { buildRecordScopeFilter } from '../middlewares/rbac';

export const getReportsData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const { startDate, endDate, teamId } = req.query;

  const scopeFilter = buildRecordScopeFilter(user);
  const filter: any = { ...scopeFilter, isArchived: false };

  if (teamId && user.role === 'admin') {
    filter.teamId = teamId;
  }

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate as string);
    if (endDate) filter.createdAt.$lte = new Date(endDate as string);
  }

  // 1. Leads by source
  const sources = ['Website', 'Referral', 'LinkedIn', 'Call', 'Walk-in', 'Other'];
  const leadsBySource = await Promise.all(
    sources.map(async (src) => {
      const count = await Lead.countDocuments({ ...filter, source: src });
      return { name: src, count };
    })
  );

  // 2. Leads by status
  const statuses = ['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted'];
  const leadsByStatus = await Promise.all(
    statuses.map(async (st) => {
      const count = await Lead.countDocuments({ ...filter, status: st });
      return { name: st, count };
    })
  );

  // 3. Conversion Funnel
  const totalLeads = await Lead.countDocuments(filter);
  const contactedLeads = await Lead.countDocuments({ ...filter, status: { $in: ['Contacted', 'Qualified', 'Converted'] } });
  const qualifiedLeads = await Lead.countDocuments({ ...filter, status: { $in: ['Qualified', 'Converted'] } });
  const convertedLeads = await Lead.countDocuments({ ...filter, status: 'Converted' });

  const funnel = [
    { stage: 'Total Leads', count: totalLeads },
    { stage: 'Contacted', count: contactedLeads },
    { stage: 'Qualified', count: qualifiedLeads },
    { stage: 'Converted', count: convertedLeads },
  ];

  // 4. Deals Won vs Lost
  const dealsFilter: any = { ...scopeFilter, isArchived: false };
  if (teamId && user.role === 'admin') dealsFilter.teamId = teamId;
  if (startDate || endDate) {
    dealsFilter.createdAt = {};
    if (startDate) dealsFilter.createdAt.$gte = new Date(startDate as string);
    if (endDate) dealsFilter.createdAt.$lte = new Date(endDate as string);
  }

  const allDeals = await Deal.find(dealsFilter);
  const wonDeals = allDeals.filter((d) => d.stage === 'Won');
  const lostDeals = allDeals.filter((d) => d.stage === 'Lost');
  const openDeals = allDeals.filter((d) => ['Discovery', 'Proposal', 'Negotiation'].includes(d.stage));

  const dealsSummary = {
    wonCount: wonDeals.length,
    wonValue: wonDeals.reduce((sum, d) => sum + (d.value?.amount || 0), 0),
    lostCount: lostDeals.length,
    lostValue: lostDeals.reduce((sum, d) => sum + (d.value?.amount || 0), 0),
    openCount: openDeals.length,
    openValue: openDeals.reduce((sum, d) => sum + (d.value?.amount || 0), 0),
    currency: 'INR',
  };

  // 5. Task completion metrics
  const taskScope = user.role === 'admin' ? {} : user.role === 'manager' && user.teamId ? { teamId: user.teamId } : { assignedTo: user._id };
  const [completedTasks, pendingTasks, overdueTasks] = await Promise.all([
    Task.countDocuments({ ...taskScope, status: 'Done' }),
    Task.countDocuments({ ...taskScope, status: { $in: ['To Do', 'In Progress'] } }),
    Task.countDocuments({ ...taskScope, status: { $ne: 'Done' }, dueDate: { $lt: new Date() } }),
  ]);

  // 6. Overdue follow-ups
  const overdueFollowUps = await Lead.countDocuments({
    ...scopeFilter,
    isArchived: false,
    nextFollowUpDate: { $lt: new Date() },
    status: { $nin: ['Converted', 'Unqualified'] },
  });

  res.json({
    success: true,
    data: {
      leadsBySource,
      leadsByStatus,
      funnel,
      dealsSummary,
      tasks: {
        completed: completedTasks,
        pending: pendingTasks,
        overdue: overdueTasks,
      },
      overdueFollowUps,
    },
  });
};

export const exportReportsCsv = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const scopeFilter = buildRecordScopeFilter(user);

  const leads = await Lead.find({ ...scopeFilter, isArchived: false })
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 });

  const sanitizeCsvValue = (val: any) => {
    if (val === null || val === undefined) return '""';
    let str = String(val).replace(/"/g, '""');
    if (/^[=+\-@]/.test(str)) {
      str = `'${str}`;
    }
    return `"${str}"`;
  };

  const headers = ['Lead Name', 'Company', 'Source', 'Status', 'Priority', 'Assigned To', 'Created Date'];
  const rows = leads.map((l: any) => [
    sanitizeCsvValue(l.fullName),
    sanitizeCsvValue(l.company || ''),
    sanitizeCsvValue(l.source),
    sanitizeCsvValue(l.status),
    sanitizeCsvValue(l.priority),
    sanitizeCsvValue(l.assignedTo?.name || 'Unassigned'),
    sanitizeCsvValue(l.createdAt ? l.createdAt.toISOString().split('T')[0] : ''),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="crm_performance_report_${Date.now()}.csv"`);
  res.send(csv);
};
