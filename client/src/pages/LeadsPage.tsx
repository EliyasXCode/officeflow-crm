import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  Search,
  Filter,
  Download,
  Plus,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Building,
  Mail,
  Phone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Lead, User } from '../types';
import { formatDate } from '../utils/formatters';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { Modal } from '../components/ui/Modal';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';

export const LeadsPage: React.FC = () => {
  const { user, isAdmin, isManager } = useAuth();
  const navigate = useNavigate();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filtering state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [source, setSource] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  // Create Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    company: '',
    email: '',
    phone: '',
    source: 'Website',
    priority: 'Medium',
    assignedTo: '',
    tags: '',
    notes: '',
    nextFollowUpDate: '',
  });

  // Duplicate warning state
  const [duplicates, setDuplicates] = useState<any[]>([]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leads', {
        page,
        limit: 12,
        search,
        status,
        priority,
        source,
        assignedTo,
      });
      if (res.success) {
        setLeads(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages);
          setTotalLeads(res.pagination.total);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      if (res.success) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [page, status, priority, source, assignedTo]);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchLeads();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Live duplicate checker for email/phone inside modal
  useEffect(() => {
    if (!formData.email && !formData.phone) {
      setDuplicates([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/leads/duplicates', {
          email: formData.email,
          phone: formData.phone,
        });
        if (res.success && res.duplicates) {
          setDuplicates(res.duplicates);
        }
      } catch (err) {
        console.error(err);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.email, formData.phone]);

  const handleExportCsv = async () => {
    try {
      await api.downloadCsv('/leads/export', `leads_export_${Date.now()}.csv`);
    } catch (err) {
      alert('Failed to export leads CSV');
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const payload: any = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()) : [],
        assignedTo: formData.assignedTo || (isAdmin || isManager ? undefined : user?._id),
      };

      const res = await api.post('/leads', payload);
      if (res.success) {
        setIsModalOpen(false);
        setFormData({
          fullName: '',
          company: '',
          email: '',
          phone: '',
          source: 'Website',
          priority: 'Medium',
          assignedTo: '',
          tags: '',
          notes: '',
          nextFollowUpDate: '',
        });
        setDuplicates([]);
        fetchLeads();
      }
    } catch (err: any) {
      alert(err.message || 'Error creating lead');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Flame className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Leads</h1>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage incoming prospects, qualify opportunities, and schedule follow-ups.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-2xs space-x-1.5"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-sm space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Lead</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        {/* Search Input */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, company, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
          />
        </div>

        {/* Dropdowns Grid (2x2 on mobile, flex on desktop) */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3">
          {/* Status Dropdown */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-auto text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Unqualified">Unqualified</option>
            <option value="Converted">Converted</option>
          </select>

          {/* Priority Dropdown */}
          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-auto text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Source Dropdown */}
          <select
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-auto text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Sources</option>
            <option value="Website">Website</option>
            <option value="Referral">Referral</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Call">Call</option>
            <option value="Walk-in">Walk-in</option>
            <option value="Other">Other</option>
          </select>

          {/* Owner Dropdown (Admin & Manager) */}
          {(isAdmin || isManager) && (
            <select
              value={assignedTo}
              onChange={(e) => {
                setAssignedTo(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-auto text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:max-w-[150px]"
            >
              <option value="">All Owners</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Leads List / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={6} />
          </div>
        ) : leads.length === 0 ? (
          <EmptyState
            icon={Flame}
            title="No leads found"
            description="No leads match your current search and filter criteria. You can create a new lead to get started."
            actionLabel="Create Lead"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <>
            {/* Mobile Card View (sm:hidden) */}
            <div className="divide-y divide-slate-100 sm:hidden">
              {leads.map((l) => (
                <div
                  key={l._id}
                  onClick={() => navigate(`/leads/${l._id}`)}
                  className="p-4 hover:bg-slate-50 active:bg-slate-100 cursor-pointer transition space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{l.fullName}</div>
                      {l.company && (
                        <div className="text-xs text-slate-500 flex items-center mt-0.5">
                          <Building className="w-3 h-3 mr-1 text-slate-400" />
                          <span>{l.company}</span>
                        </div>
                      )}
                    </div>
                    <StatusBadge status={l.status} type="lead" />
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-slate-500">
                    <PriorityBadge priority={l.priority} />
                    <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                      {l.source}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-50">
                    <span>Owner: <strong className="text-slate-600 font-medium">{l.assignedTo?.name || 'Unassigned'}</strong></span>
                    {l.nextFollowUpDate && (
                      <span className="text-indigo-600 font-medium">
                        Next: {formatDate(l.nextFollowUpDate)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (hidden sm:block) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Lead Name</th>
                    <th className="px-6 py-3.5">Company</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Priority</th>
                    <th className="px-6 py-3.5">Source</th>
                    <th className="px-6 py-3.5">Owner</th>
                    <th className="px-6 py-3.5">Next Follow-Up</th>
                    <th className="px-6 py-3.5 text-right">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.map((l) => (
                    <tr
                      key={l._id}
                      onClick={() => navigate(`/leads/${l._id}`)}
                      className="hover:bg-slate-50/70 cursor-pointer transition"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        <div>{l.fullName}</div>
                        <div className="text-xs text-slate-400 font-normal">{l.email}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {l.company || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={l.status} type="lead" />
                      </td>
                      <td className="px-6 py-4">
                        <PriorityBadge priority={l.priority} />
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                        {l.source}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-700">
                        {l.assignedTo?.name || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {formatDate(l.nextFollowUpDate)}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 text-right">
                        {formatDate(l.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination controls */}
        {!loading && leads.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-800">{leads.length}</span> of{' '}
              <span className="font-semibold text-slate-800">{totalLeads}</span> leads
            </div>
            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-medium text-slate-700">
                Page {page} of {totalPages || 1}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Lead Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Lead"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateLead} className="space-y-4">
          {/* Duplicate Warnings Banner */}
          {duplicates.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs space-y-1">
              <div className="flex items-center space-x-1.5 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Possible Duplicate Found</span>
              </div>
              <p>
                A lead with matching email or phone already exists:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-amber-900">
                {duplicates.map((d) => (
                  <li key={d._id}>
                    {d.fullName} ({d.email || d.phone}) - Owner: {d.assignedTo?.name || 'Unassigned'}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Kumar"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Company Name
              </label>
              <input
                type="text"
                placeholder="e.g. Apex Global Solutions"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Work Email *
              </label>
              <input
                type="email"
                required
                placeholder="ramesh@apex.example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Lead Source
              </label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
              >
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Call">Call</option>
                <option value="Walk-in">Walk-in</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            {(isAdmin || isManager) && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Assignee
                </label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
                >
                  <option value="">Assign to Me ({user?.name})</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Next Follow-Up Date
              </label>
              <input
                type="datetime-local"
                value={formData.nextFollowUpDate}
                onChange={(e) => setFormData({ ...formData, nextFollowUpDate: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="Enterprise, Logistics, Q4 Prospect"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Initial Notes
            </label>
            <textarea
              rows={3}
              placeholder="Key details from inquiry or first conversation..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {formLoading ? 'Saving...' : 'Save Lead'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
