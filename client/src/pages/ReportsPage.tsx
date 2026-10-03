import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  Flame,
  Briefcase,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { api } from '../api/client';
import { formatCurrency } from '../utils/formatters';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';

export const ReportsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports');
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
    fetchReports();
  }, []);

  const handleExportCsv = async () => {
    try {
      await api.downloadCsv('/reports/export', `crm_report_${Date.now()}.csv`);
    } catch (err) {
      alert('Failed to export report CSV');
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton rows={8} />
      </div>
    );
  }

  const { leadsBySource, leadsByStatus, funnel, dealsSummary, tasks, overdueFollowUps } = data;

  const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Analytics & Performance Reports
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Conversion metrics, lead generation sources, pipeline outcomes, and SLA tracking.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-2xs space-x-1.5"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Summary CSV</span>
        </button>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Won Value
          </span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {formatCurrency(dealsSummary.wonValue)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {dealsSummary.wonCount} deals won successfully
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Active Pipeline Value
          </span>
          <div className="text-2xl font-bold text-indigo-700 mt-1">
            {formatCurrency(dealsSummary.openValue)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {dealsSummary.openCount} deals actively advancing
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Task SLA Fulfillment
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {tasks.completed + tasks.pending > 0
              ? `${Math.round((tasks.completed / (tasks.completed + tasks.pending)) * 100)}%`
              : '0%'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {tasks.completed} completed • {tasks.overdue} overdue
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Overdue Follow-ups
          </span>
          <div className="text-2xl font-bold text-rose-700 mt-1">{overdueFollowUps}</div>
          <div className="text-xs text-slate-500 mt-0.5">Leads awaiting contact</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Conversion Funnel */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
          <h2 className="text-base font-semibold text-slate-800 mb-1">Lead Conversion Funnel</h2>
          <p className="text-xs text-slate-400 mb-4">Progression from discovery to won customer</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Leads by Source */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
          <h2 className="text-base font-semibold text-slate-800 mb-1">Leads by Inbound Source</h2>
          <p className="text-xs text-slate-400 mb-4">Channel volume breakdown</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leadsBySource}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {leadsBySource.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
