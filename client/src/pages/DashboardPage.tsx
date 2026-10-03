import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Flame,
  Briefcase,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  Calendar,
  Plus,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';

export const DashboardPage: React.FC = () => {
  const { user, isAdmin, isManager } = useAuth();
  const navigate = useNavigate();

  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/stats', { range: dateRange });
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  const { metrics, leadStatusBreakdown, dealsByStage, upcomingWork, upcomingFollowUps, teamPerformance } = data;

  const STATUS_COLORS: Record<string, string> = {
    New: '#0284c7',
    Contacted: '#6366f1',
    Qualified: '#10b981',
    Unqualified: '#94a3b8',
    Converted: '#0d9488',
  };

  const STAGE_COLORS: Record<string, string> = {
    Discovery: '#3b82f6',
    Proposal: '#f59e0b',
    Negotiation: '#8b5cf6',
    Won: '#10b981',
    Lost: '#ef4444',
  };

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome & Date Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isAdmin
              ? 'Office-wide executive overview and sales operations.'
              : isManager
              ? `Team manager overview for ${typeof user?.team === 'object' ? user?.team?.name : 'your team'}.`
              : 'Your personal sales pipeline, upcoming tasks, and scheduled follow-ups.'}
          </p>
        </div>

        {/* Controls: Date range & Quick actions */}
        <div className="flex items-center space-x-3">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-xs">
            {(['7d', '30d', '90d', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  dateRange === r
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r === 'all' ? 'All Time' : `Last ${r}`}
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate('/leads')}
            className="inline-flex items-center px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-sm space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Lead</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Accessible Leads */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Leads</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.totalAccessibleLeads}</div>
          <div className="text-xs text-slate-500 mt-1">
            <span className="text-indigo-600 font-medium">+{metrics.newLeadsInRange} new</span> in selected range
          </div>
        </div>

        {/* Metric 2: Open Pipeline Value */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Open Pipeline</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(metrics.openPipelineValue)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Discovery, Proposal & Negotiation</div>
        </div>

        {/* Metric 3: Won Deal Value */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Contracted Won</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            {formatCurrency(metrics.wonDealValue)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1" title="Contracted deal value is accounted separately from invoice collections.">
            *Contracted value (distinct from collected cash)
          </div>
        </div>

        {/* Metric 4: Conversion Rate & Tasks */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Conversion Rate</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.conversionRate}%</div>
          <div className="text-xs text-slate-500 mt-1">
            <span className="text-rose-600 font-medium">{metrics.overdueTasks} overdue</span> • {metrics.tasksDueToday} due today
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Deals by Stage */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Deals Pipeline by Stage</h2>
              <p className="text-xs text-slate-400">Total deal value in INR across current stages</p>
            </div>
            <button
              onClick={() => navigate('/deals')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
            >
              Pipeline Board <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dealsByStage} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                <YAxis
                  width={45}
                  tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), 'Deal Value']}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {dealsByStage.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={STAGE_COLORS[entry.stage] || '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Lead Status Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Leads by Status</h2>
              <p className="text-xs text-slate-400">Lead qualification progression</p>
            </div>
            <button
              onClick={() => navigate('/leads')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
            >
              All Leads <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadStatusBreakdown}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {leadStatusBreakdown.map((entry: any, index: number) => (
                      <Cell
                        key={`pie-cell-${index}`}
                        fill={STATUS_COLORS[entry.status] || '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [val, 'Leads']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              {leadStatusBreakdown.map((item: any) => (
                <div key={item.status} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[item.status] || '#94a3b8' }}
                    />
                    <span className="font-medium text-slate-700">{item.status}</span>
                  </div>
                  <span className="font-semibold text-slate-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Work Lists Grid: Upcoming Tasks & Upcoming Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-semibold text-slate-800">Tasks Due Soon</h2>
            </div>
            <button
              onClick={() => navigate('/tasks')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              View all
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {upcomingWork.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                🎉 No upcoming tasks due right now!
              </div>
            ) : (
              upcomingWork.map((t: any) => (
                <div key={t._id} className="py-3 flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-slate-800">{t.title}</h3>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Due: {formatDate(t.dueDate)} • Assigned to {t.assignedTo?.name || 'You'}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium ${
                      t.priority === 'High'
                        ? 'bg-red-50 text-red-700'
                        : t.priority === 'Medium'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {t.priority}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Follow-ups */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-semibold text-slate-800">Scheduled Lead Follow-ups</h2>
            </div>
            <button
              onClick={() => navigate('/calendar')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Calendar
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {upcomingFollowUps.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                No scheduled follow-ups pending.
              </div>
            ) : (
              upcomingFollowUps.map((l: any) => (
                <div
                  key={l._id}
                  onClick={() => navigate(`/leads/${l._id}`)}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition"
                >
                  <div>
                    <h3 className="text-sm font-medium text-slate-800">{l.fullName}</h3>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {l.company ? `${l.company} • ` : ''}Follow-up on{' '}
                      <span className="text-indigo-600 font-medium">
                        {formatDateTime(l.nextFollowUpDate)}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {l.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Team Performance Table (Admins & Managers) */}
      {(isAdmin || isManager) && teamPerformance?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className="text-base font-semibold text-slate-800">Team Workload & Output</h2>
                <p className="text-xs text-slate-400">
                  Real-time pipeline assignments and overdue status by team member
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/team')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Manage Team
            </button>
          </div>

          {/* Mobile Cards for Team Workload (sm:hidden) */}
          <div className="divide-y divide-slate-100 sm:hidden">
            {teamPerformance.map((member: any) => (
              <div key={member.userId} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-800 text-sm">{member.name}</div>
                  <span className="text-[11px] font-medium uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {member.role}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs py-1 bg-slate-50 rounded-lg">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Leads</span>
                    <strong className="text-slate-700">{member.leadsCount}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Won</span>
                    <strong className="text-emerald-700">{member.wonDealsCount}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Overdue</span>
                    <strong className={member.overdueTasks > 0 ? 'text-rose-600' : 'text-slate-400'}>
                      {member.overdueTasks}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400 text-[11px]">Won Value:</span>
                  <strong className="text-emerald-700 font-semibold">{formatCurrency(member.wonValue)}</strong>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (hidden sm:block) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Member</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3 text-center">Open Leads</th>
                  <th className="px-6 py-3 text-center">Won Deals</th>
                  <th className="px-6 py-3 text-right">Contracted Won Value</th>
                  <th className="px-6 py-3 text-center">Overdue Work</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamPerformance.map((member: any) => (
                  <tr key={member.userId} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-3.5 font-medium text-slate-800">{member.name}</td>
                    <td className="px-6 py-3.5">
                      <span className="text-xs font-medium uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center text-slate-700 font-medium">
                      {member.leadsCount}
                    </td>
                    <td className="px-6 py-3.5 text-center text-slate-700 font-medium">
                      {member.wonDealsCount}
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold text-emerald-700">
                      {formatCurrency(member.wonValue)}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      {member.overdueTasks > 0 ? (
                        <span className="inline-flex items-center text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          {member.overdueTasks} overdue
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
