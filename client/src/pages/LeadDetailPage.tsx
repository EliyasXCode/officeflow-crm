import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Flame,
  ArrowLeft,
  Mail,
  Phone,
  Building,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Send,
  MessageSquare,
  Sparkles,
  ArrowRight,
  User as UserIcon,
  Tag,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Lead, Activity } from '../types';
import { formatDate, formatDateTime, formatCurrency } from '../utils/formatters';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { Modal } from '../components/ui/Modal';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin, isManager } = useAuth();
  const navigate = useNavigate();

  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // Activity logging state
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<'Call' | 'Meeting' | 'Email' | 'Note' | 'Follow-up'>('Call');
  const [activityTitle, setActivityTitle] = useState('');
  const [activityNotes, setActivityNotes] = useState('');
  const [activityOutcome, setActivityOutcome] = useState('');
  const [activitySchedule, setActivitySchedule] = useState('');
  const [activityLoading, setActivityLoading] = useState(false);

  // Conversion Modal state
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [createDeal, setCreateDeal] = useState(true);
  const [dealTitle, setDealTitle] = useState('');
  const [dealValue, setDealValue] = useState(2500000); // 25 Lakhs default
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [createCompany, setCreateCompany] = useState(true);
  const [convertLoading, setConvertLoading] = useState(false);

  // AI Assistant state
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiEmailDraft, setAiEmailDraft] = useState<{ subject: string; draft: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  const fetchLeadDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/leads/${id}`);
      if (res.success) {
        setLead(res.data);
        setActivities(res.activities || []);
        setDealTitle(`${res.data.company || res.data.fullName} Enterprise Contract`);
      }
    } catch (err: any) {
      alert(err.message || 'Error loading lead');
      navigate('/leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadDetails();
  }, [id]);

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivityLoading(true);

    try {
      const res = await api.post('/activities', {
        type: activityType,
        relatedType: 'lead',
        relatedId: id,
        title: activityTitle,
        notes: activityNotes,
        outcome: activityOutcome,
        scheduledAt: activitySchedule || undefined,
      });

      if (res.success) {
        setActivityModalOpen(false);
        setActivityTitle('');
        setActivityNotes('');
        setActivityOutcome('');
        setActivitySchedule('');
        fetchLeadDetails();
      }
    } catch (err: any) {
      alert(err.message || 'Error logging activity');
    } finally {
      setActivityLoading(false);
    }
  };

  const handleConvertLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setConvertLoading(true);

    try {
      const res = await api.post(`/leads/${id}/convert`, {
        createDeal,
        dealTitle,
        dealValue,
        expectedCloseDate: expectedCloseDate || undefined,
        createCompany,
      });

      if (res.success) {
        setConvertModalOpen(false);
        alert('Lead successfully converted!');
        fetchLeadDetails();
      }
    } catch (err: any) {
      alert(err.message || 'Conversion failed');
    } finally {
      setConvertLoading(false);
    }
  };

  const handleAiSummarize = async () => {
    setAiLoading(true);
    try {
      const res = await api.post('/ai/summarize', { entityType: 'lead', entityId: id });
      if (res.success) {
        setAiSummary(res.draft);
        if (res.notice) setAiNotice(res.notice);
      }
    } catch (err: any) {
      alert(err.message || 'AI request failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiDraftEmail = async () => {
    setAiLoading(true);
    try {
      const res = await api.post('/ai/draft-email', {
        entityType: 'lead',
        entityId: id,
        topic: 'commercial trial and pipeline next steps',
      });
      if (res.success) {
        setAiEmailDraft({ subject: res.subject, draft: res.draft });
        if (res.notice) setAiNotice(res.notice);
      }
    } catch (err: any) {
      alert(err.message || 'AI email drafting failed');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading || !lead) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton rows={8} />
      </div>
    );
  }

  const isConverted = lead.status === 'Converted' || Boolean(lead.convertedContactId);

  return (
    <div className="space-y-6">
      {/* Back button & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3">
          <button
            onClick={() => navigate('/leads')}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition shrink-0 mt-0.5 sm:mt-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{lead.fullName}</h1>
              <StatusBadge status={lead.status} type="lead" />
              <PriorityBadge priority={lead.priority} />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {lead.company ? `${lead.company} • ` : ''}Lead ID: <span className="font-mono text-xs">{lead._id}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => {
              setActivityType('Call');
              setActivityTitle('Outbound Phone Call');
              setActivityModalOpen(true);
            }}
            className="flex-1 sm:flex-initial justify-center inline-flex items-center px-3.5 py-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-2xs space-x-1.5"
          >
            <Phone className="w-4 h-4 text-slate-500" />
            <span>Log Activity</span>
          </button>

          {!isConverted ? (
            <button
              onClick={() => setConvertModalOpen(true)}
              className="flex-1 sm:flex-initial justify-center inline-flex items-center px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-sm space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Convert Lead</span>
            </button>
          ) : (
            <span className="flex-1 sm:flex-initial justify-center inline-flex items-center px-3 py-2 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-lg">
              ✓ Converted
            </span>
          )}
        </div>
      </div>

      {/* Main Grid: Details on Left, Activities & AI on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Lead Details Card */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-5">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
              Contact & Lead Details
            </h2>

            <div className="space-y-3.5 text-sm">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Email</span>
                <a
                  href={`mailto:${lead.email}`}
                  className="font-medium text-indigo-600 hover:underline flex items-center mt-0.5"
                >
                  <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {lead.email}
                </a>
              </div>

              <div>
                <span className="text-xs text-slate-400 block font-medium">Phone</span>
                <span className="font-medium text-slate-700 flex items-center mt-0.5">
                  <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {lead.phone || 'Not provided'}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block font-medium">Company</span>
                <span className="font-medium text-slate-700 flex items-center mt-0.5">
                  <Building className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {lead.company || 'Individual / None'}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block font-medium">Source</span>
                <span className="font-medium text-slate-700 block mt-0.5">{lead.source}</span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block font-medium">Assigned Owner</span>
                <span className="font-medium text-slate-800 flex items-center mt-0.5">
                  <UserIcon className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {lead.assignedTo?.name || 'Unassigned'}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block font-medium">Scheduled Follow-Up</span>
                <span className="font-medium text-indigo-700 flex items-center mt-0.5">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                  {lead.nextFollowUpDate ? formatDateTime(lead.nextFollowUpDate) : 'None scheduled'}
                </span>
              </div>

              {lead.tags && lead.tags.length > 0 && (
                <div>
                  <span className="text-xs text-slate-400 block font-medium mb-1.5">Tags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {lead.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center text-xs font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded"
                      >
                        <Tag className="w-3 h-3 mr-1 text-slate-400" />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {lead.notes && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-400 block font-medium mb-1">Notes</span>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
                    {lead.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* AI Assistant Card (Phase 5 ready) */}
          <div className="bg-gradient-to-br from-indigo-50/50 to-white rounded-xl border border-indigo-100 shadow-2xs p-5 space-y-4">
            <div className="flex items-center space-x-2 text-indigo-900">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-semibold">AI Sales Assistant (Gemini)</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Generate grounded executive summaries and draft personalized follow-ups.
            </p>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleAiSummarize}
                disabled={aiLoading}
                className="flex-1 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
              >
                Summarize
              </button>
              <button
                type="button"
                onClick={handleAiDraftEmail}
                disabled={aiLoading}
                className="flex-1 py-1.5 px-2 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-lg text-xs font-medium transition disabled:opacity-50"
              >
                Draft Email
              </button>
            </div>

            {aiNotice && (
              <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                {aiNotice}
              </div>
            )}

            {aiSummary && (
              <div className="bg-white p-3 rounded-lg border border-indigo-100 text-xs text-slate-700 space-y-1">
                <div className="font-semibold text-indigo-900 text-[11px] uppercase tracking-wider">
                  Summary Draft [Requires Review]
                </div>
                <p className="whitespace-pre-wrap leading-relaxed">{aiSummary}</p>
              </div>
            )}

            {aiEmailDraft && (
              <div className="bg-white p-3 rounded-lg border border-indigo-100 text-xs text-slate-700 space-y-2">
                <div className="font-semibold text-indigo-900 text-[11px] uppercase tracking-wider">
                  Email Draft [Requires Review]
                </div>
                <div className="font-semibold text-slate-800">
                  Subject: {aiEmailDraft.subject}
                </div>
                <p className="whitespace-pre-wrap leading-relaxed text-slate-600 font-mono text-[11px] bg-slate-50 p-2 rounded">
                  {aiEmailDraft.draft}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Columns: Activity History Timeline */}
        <div className="space-y-6 lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Activity History</h2>
                <p className="text-xs text-slate-500">
                  Complete audit trail of calls, meetings, notes, and scheduled follow-ups.
                </p>
              </div>
              <button
                onClick={() => {
                  setActivityType('Note');
                  setActivityTitle('Add Note');
                  setActivityModalOpen(true);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
              >
                <Plus className="w-3.5 h-3.5 mr-0.5" />
                Add Note
              </button>
            </div>

            {activities.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                No recorded activities yet. Click "Log Activity" to add the first touchpoint.
              </div>
            ) : (
              <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-100">
                {activities.map((act) => (
                  <div key={act._id} className="relative flex items-start space-x-3 text-sm">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white border-2 border-indigo-500 text-indigo-600 z-10">
                      {act.type === 'Call' ? (
                        <Phone className="w-3.5 h-3.5" />
                      ) : act.type === 'Meeting' ? (
                        <Calendar className="w-3.5 h-3.5" />
                      ) : act.type === 'Email' ? (
                        <Mail className="w-3.5 h-3.5" />
                      ) : act.type === 'Follow-up' ? (
                        <Clock className="w-3.5 h-3.5" />
                      ) : (
                        <MessageSquare className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="flex-1 bg-slate-50/60 hover:bg-slate-50 rounded-xl p-4 border border-slate-100 transition space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">{act.title}</span>
                        <span className="text-[11px] text-slate-400">
                          {formatDateTime(act.createdAt)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Logged by <span className="font-medium text-slate-700">{act.authorId?.name}</span>
                        {act.scheduledAt && (
                          <span className="ml-2 text-indigo-600 font-medium">
                            • Scheduled for {formatDateTime(act.scheduledAt)}
                          </span>
                        )}
                      </div>
                      {act.notes && (
                        <p className="text-xs text-slate-600 pt-1 leading-relaxed whitespace-pre-wrap">
                          {act.notes}
                        </p>
                      )}
                      {act.outcome && (
                        <div className="pt-1 text-xs text-emerald-700 font-medium">
                          Outcome: {act.outcome}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Log Activity Modal */}
      <Modal
        isOpen={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        title="Record Activity Touchpoint"
      >
        <form onSubmit={handleLogActivity} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Activity Type
            </label>
            <select
              value={activityType}
              onChange={(e: any) => setActivityType(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
            >
              <option value="Call">Call</option>
              <option value="Meeting">Meeting</option>
              <option value="Email">Email (Manual log)</option>
              <option value="Note">Internal Note</option>
              <option value="Follow-up">Scheduled Follow-up</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Subject / Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Discussed pricing model and pilot rollout"
              value={activityTitle}
              onChange={(e) => setActivityTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Discussion Notes
            </label>
            <textarea
              rows={3}
              placeholder="What was discussed? Customer requirements or questions..."
              value={activityNotes}
              onChange={(e) => setActivityNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Outcome
            </label>
            <input
              type="text"
              placeholder="e.g. Client requested contract draft by Monday"
              value={activityOutcome}
              onChange={(e) => setActivityOutcome(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
            />
          </div>

          {(activityType === 'Meeting' || activityType === 'Follow-up') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Scheduled Date & Time (IST)
              </label>
              <input
                type="datetime-local"
                value={activitySchedule}
                onChange={(e) => setActivitySchedule(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActivityModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={activityLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {activityLoading ? 'Saving...' : 'Record Activity'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Convert Lead Modal */}
      <Modal
        isOpen={convertModalOpen}
        onClose={() => setConvertModalOpen(false)}
        title="Convert Lead to Customer & Deal"
        maxWidth="lg"
      >
        <form onSubmit={handleConvertLead} className="space-y-4 text-sm">
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-900 text-xs">
            Converting <span className="font-semibold">{lead.fullName}</span> will atomically create
            a Customer Contact, link or create the Company record, preserve all activity notes, and
            open a Deal in the pipeline.
          </div>

          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={createCompany}
                onChange={(e) => setCreateCompany(e.target.checked)}
                className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span className="font-medium text-slate-800">
                Create or link Company ({lead.company || 'Unnamed Company'})
              </span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={createDeal}
                onChange={(e) => setCreateDeal(e.target.checked)}
                className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span className="font-medium text-slate-800">
                Create Deal in pipeline (Discovery stage)
              </span>
            </label>
          </div>

          {createDeal && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Deal Title *
                </label>
                <input
                  type="text"
                  required
                  value={dealTitle}
                  onChange={(e) => setDealTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Deal Value (INR ₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={dealValue}
                    onChange={(e) => setDealValue(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Expected Close Date
                  </label>
                  <input
                    type="date"
                    value={expectedCloseDate}
                    onChange={(e) => setExpectedCloseDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setConvertModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={convertLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {convertLoading ? 'Converting...' : 'Execute Conversion'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
