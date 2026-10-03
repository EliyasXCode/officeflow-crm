import React, { useState, useEffect } from 'react';
import {
  KanbanSquare,
  Plus,
  LayoutGrid,
  Table as TableIcon,
  Building,
  Calendar,
  User as UserIcon,
  AlertCircle,
  MoreVertical,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Deal, Contact, Company, User, DealStage } from '../types';
import { formatCurrency, formatDate, getStageColor } from '../utils/formatters';
import { Modal } from '../components/ui/Modal';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';

const STAGES: DealStage[] = ['Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost'];

export const DealsPage: React.FC = () => {
  const { user, isAdmin, isManager } = useAuth();

  const [deals, setDeals] = useState<Deal[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [mobileStage, setMobileStage] = useState<DealStage>('Discovery');

  // Supporting entities for New Deal modal
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    contactId: '',
    companyId: '',
    amount: 1000000, // ₹10,00,000
    stage: 'Discovery' as DealStage,
    expectedCloseDate: '',
    assignedTo: '',
    notes: '',
  });

  // Drag and drop state
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/deals');
      if (res.success) {
        setDeals(res.data);
        setSummary(res.summary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      const [cRes, compRes, uRes] = await Promise.all([
        api.get('/contacts', { limit: 50 }),
        api.get('/companies', { limit: 50 }),
        api.get('/users'),
      ]);
      if (cRes.success) setContacts(cRes.data);
      if (compRes.success) setCompanies(compRes.data);
      if (uRes.success) setUsers(uRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDeals();
    fetchLookups();
  }, []);

  const handleStageChange = async (dealId: string, newStage: DealStage) => {
    const originalDeals = [...deals];
    // Optimistic update
    setDeals((prev) =>
      prev.map((d) => (d._id === dealId ? { ...d, stage: newStage } : d))
    );

    try {
      const res = await api.put(`/deals/${dealId}/stage`, { stage: newStage });
      if (!res.success) {
        throw new Error(res.message || 'Stage update failed');
      }
      fetchDeals(); // Re-sync totals and summaries
    } catch (err: any) {
      // Rollback UI on failure
      setDeals(originalDeals);
      alert(`Could not move deal to ${newStage}: ${err.message}`);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedDealId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStage: DealStage) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('text/plain') || draggedDealId;
    if (dealId) {
      handleStageChange(dealId, targetStage);
    }
    setDraggedDealId(null);
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const res = await api.post('/deals', {
        ...formData,
        amount: Number(formData.amount),
        contactId: formData.contactId || undefined,
        companyId: formData.companyId || undefined,
        assignedTo: formData.assignedTo || (isAdmin || isManager ? undefined : user?._id),
      });

      if (res.success) {
        setIsModalOpen(false);
        setFormData({
          title: '',
          contactId: '',
          companyId: '',
          amount: 1000000,
          stage: 'Discovery',
          expectedCloseDate: '',
          assignedTo: '',
          notes: '',
        });
        fetchDeals();
      }
    } catch (err: any) {
      alert(err.message || 'Error creating deal');
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
            <KanbanSquare className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Deals Pipeline</h1>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage stage progressions, contract values, and conversion velocity in INR (₹).
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-2xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md transition ${
                viewMode === 'kanban'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-sm space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Deal</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Open Pipeline Value
            </span>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {formatCurrency(summary.openPipelineValue)}
            </div>
            <span className="text-xs text-slate-500">Discovery, Proposal & Negotiation</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Contracted Won Value
            </span>
            <div className="text-xl font-bold text-emerald-700 mt-1">
              {formatCurrency(summary.wonDealValue)}
            </div>
            <span className="text-xs text-slate-400">
              *Contracted value (distinguished from cash collected)
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Active Opportunities
            </span>
            <div className="text-xl font-bold text-indigo-700 mt-1">{deals.length} Total Deals</div>
            <span className="text-xs text-slate-500">Across all stages</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="p-6">
          <LoadingSkeleton rows={6} />
        </div>
      ) : viewMode === 'kanban' ? (
        /* Kanban Board View */
        <div>
          {/* Mobile Stage Selector & Cards (md:hidden) */}
          <div className="md:hidden space-y-4">
            {/* Horizontal stage pills */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 -mx-1 px-1">
              {STAGES.map((stage) => {
                const count = deals.filter((d) => d.stage === stage).length;
                const isActive = mobileStage === stage;
                const { bg, text, border } = getStageColor(stage);

                return (
                  <button
                    key={stage}
                    onClick={() => setMobileStage(stage)}
                    className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex items-center space-x-1.5 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : `bg-white ${text} border border-slate-200 hover:bg-slate-50`
                    }`}
                  >
                    <span>{stage}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Cards for active stage */}
            <div className="space-y-3">
              {deals.filter((d) => d.stage === mobileStage).length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                  No deals currently in {mobileStage} stage.
                </div>
              ) : (
                deals
                  .filter((d) => d.stage === mobileStage)
                  .map((deal) => (
                    <div
                      key={deal._id}
                      className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <h2 className="text-sm font-semibold text-slate-900 leading-snug">
                          {deal.title}
                        </h2>
                        <span className="text-sm font-bold text-indigo-700">
                          {formatCurrency(deal.value.amount)}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-slate-500">
                        {deal.companyId && (
                          <div className="flex items-center space-x-1.5">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            <span>{deal.companyId.name}</span>
                          </div>
                        )}
                        {deal.expectedCloseDate && (
                          <div className="flex items-center space-x-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Close: {formatDate(deal.expectedCloseDate)}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>Owner: {deal.assignedTo?.name || 'Unassigned'}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium">Stage:</span>
                        <select
                          value={deal.stage}
                          onChange={(e) => handleStageChange(deal._id, e.target.value as DealStage)}
                          className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          {STAGES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Desktop Kanban Board (hidden md:grid) */}
          <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-5 gap-4 items-start pb-8 overflow-x-auto">
            {STAGES.map((stage) => {
              const stageDeals = deals.filter((d) => d.stage === stage);
              const totalStageValue = stageDeals.reduce((sum, d) => sum + (d.value?.amount || 0), 0);
              const { bg, text, border } = getStageColor(stage);

              return (
                <div
                  key={stage}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage)}
                  className="bg-slate-100/70 rounded-xl p-3 border border-slate-200 flex flex-col min-h-[500px]"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${bg} ${text} ${border}`}>
                        {stage}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {stageDeals.length}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      {formatCurrency(totalStageValue)}
                    </span>
                  </div>

                  {/* Cards Container */}
                  <div className="space-y-3 flex-1">
                    {stageDeals.map((deal) => (
                      <div
                        key={deal._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, deal._id)}
                        className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs hover:shadow-md hover:border-indigo-300 transition cursor-grab active:cursor-grabbing space-y-2.5"
                      >
                        <div className="flex items-start justify-between">
                          <h2 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">
                            {deal.title}
                          </h2>
                        </div>

                        <div className="text-base font-bold text-indigo-700">
                          {formatCurrency(deal.value.amount)}
                        </div>

                        <div className="space-y-1 text-xs text-slate-500">
                          {deal.companyId && (
                            <div className="flex items-center space-x-1.5 truncate">
                              <Building className="w-3.5 h-3.5 text-slate-400" />
                              <span>{deal.companyId.name}</span>
                            </div>
                          )}
                          {deal.expectedCloseDate && (
                            <div className="flex items-center space-x-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>Close: {formatDate(deal.expectedCloseDate)}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1.5">
                            <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span>Owner: {deal.assignedTo?.name || 'Unassigned'}</span>
                          </div>
                        </div>

                        {/* Accessible Stage Change Dropdown */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400 font-medium">Stage:</span>
                          <select
                            value={deal.stage}
                            onChange={(e) => handleStageChange(deal._id, e.target.value as DealStage)}
                            className="text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            aria-label={`Change stage for ${deal.title}`}
                          >
                            {STAGES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}

                    {stageDeals.length === 0 && (
                      <div className="h-32 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-400">
                        Drop deals here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Mobile Cards for Table View (sm:hidden) */}
          <div className="divide-y divide-slate-100 sm:hidden">
            {deals.map((deal) => {
              const { bg, text, border } = getStageColor(deal.stage);
              return (
                <div key={deal._id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{deal.title}</div>
                      {deal.companyId && (
                        <div className="text-xs text-slate-500">{deal.companyId.name}</div>
                      )}
                    </div>
                    <span className="text-sm font-bold text-indigo-700">
                      {formatCurrency(deal.value.amount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-400">
                      {deal.assignedTo?.name || 'Unassigned'}
                    </span>
                    <select
                      value={deal.stage}
                      onChange={(e) => handleStageChange(deal._id, e.target.value as DealStage)}
                      className={`text-xs font-semibold rounded-lg px-2 py-0.5 border ${bg} ${text} ${border} focus:outline-none`}
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table (hidden sm:block) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Deal Title</th>
                  <th className="px-6 py-3.5">Value (INR)</th>
                  <th className="px-6 py-3.5">Stage</th>
                  <th className="px-6 py-3.5">Company</th>
                  <th className="px-6 py-3.5">Owner</th>
                  <th className="px-6 py-3.5">Expected Close</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deals.map((deal) => {
                  const { bg, text, border } = getStageColor(deal.stage);
                  return (
                    <tr key={deal._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4 font-semibold text-slate-900">{deal.title}</td>
                      <td className="px-6 py-4 font-bold text-indigo-700">
                        {formatCurrency(deal.value.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={deal.stage}
                          onChange={(e) => handleStageChange(deal._id, e.target.value as DealStage)}
                          className={`text-xs font-semibold rounded-lg px-2.5 py-1 border ${bg} ${text} ${border} focus:outline-none`}
                        >
                          {STAGES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{deal.companyId?.name || '-'}</td>
                      <td className="px-6 py-4 text-slate-700">{deal.assignedTo?.name || 'Unassigned'}</td>
                      <td className="px-6 py-4 text-slate-500">{formatDate(deal.expectedCloseDate)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Deal Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Deal">
        <form onSubmit={handleCreateDeal} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Deal Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Enterprise License Expansion - Tata"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Value in INR (₹) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Pipeline Stage
              </label>
              <select
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value as DealStage })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Linked Company
              </label>
              <select
                value={formData.companyId}
                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
              >
                <option value="">Select Company (Optional)</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Linked Contact
              </label>
              <select
                value={formData.contactId}
                onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
              >
                <option value="">Select Contact (Optional)</option>
                {contacts.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Expected Close Date
              </label>
              <input
                type="date"
                value={formData.expectedCloseDate}
                onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            {(isAdmin || isManager) && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Deal Owner
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Deal Notes
            </label>
            <textarea
              rows={3}
              placeholder="Commercial scope, SLA commitments, discount approvals..."
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
              {formLoading ? 'Creating...' : 'Create Deal'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
