import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Users,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Briefcase,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { User, Team } from '../types';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';

export const TeamPage: React.FC = () => {
  const { user, isAdmin, isManager } = useAuth();

  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'employee' as 'admin' | 'manager' | 'employee',
    teamId: '',
    jobTitle: '',
    phone: '',
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [generatedInvite, setGeneratedInvite] = useState<{ token: string; link: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Deactivate Modal
  const [deactivateUser, setDeactivateUser] = useState<User | null>(null);
  const [reassignUserId, setReassignUserId] = useState('');
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      const [tRes, uRes] = await Promise.all([
        api.get('/teams'),
        api.get('/users'),
      ]);
      if (tRes.success) setTeams(tRes.data);
      if (uRes.success) setMembers(uRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);

    try {
      const res = await api.post('/users/invite', {
        ...inviteForm,
        teamId: inviteForm.teamId || undefined,
      });

      if (res.success && res.invitation) {
        setGeneratedInvite({
          token: res.invitation.token,
          link: `${window.location.origin}${res.invitation.inviteLink}`,
        });
        fetchTeamData();
      }
    } catch (err: any) {
      alert(err.message || 'Error inviting employee');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateUser) return;
    setDeactivateLoading(true);

    try {
      const res = await api.post(`/users/${deactivateUser._id}/deactivate`, {
        reassignToUserId: reassignUserId || undefined,
      });

      if (res.success) {
        setDeactivateUser(null);
        setReassignUserId('');
        fetchTeamData();
      }
    } catch (err: any) {
      alert(err.message || 'Error deactivating user');
    } finally {
      setDeactivateLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Team & Staff Management
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Organize sales teams, assign managers, monitor workloads, and provision employee access.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setGeneratedInvite(null);
              setInviteModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-sm space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Invite Employee</span>
          </button>
        )}
      </div>

      {/* Teams Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
          Configured Sales Teams
        </h2>

        {loading ? (
          <LoadingSkeleton rows={3} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map((team) => (
              <div
                key={team._id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">{team.name}</h3>
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                    {team.memberCount || 0} Members
                  </span>
                </div>
                {team.description && (
                  <p className="text-xs text-slate-500 leading-relaxed">{team.description}</p>
                )}
                <div className="text-xs text-slate-600 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span>
                    Manager:{' '}
                    <span className="font-semibold text-slate-800">
                      {team.managerId?.name || 'Unassigned'}
                    </span>
                  </span>
                  {team.managerId?.email && (
                    <span className="text-slate-400">{team.managerId.email}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Employees Table */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
          Office Staff Directory
        </h2>

        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          {loading ? (
            <div className="p-6">
              <LoadingSkeleton rows={5} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Employee Name</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Team</th>
                    <th className="px-6 py-3.5">Job Title</th>
                    <th className="px-6 py-3.5">Status</th>
                    {isAdmin && <th className="px-6 py-3.5 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((m) => (
                    <tr key={m._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{m.name}</div>
                        <div className="text-xs text-slate-400">{m.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${
                            m.role === 'admin'
                              ? 'bg-purple-50 text-purple-700'
                              : m.role === 'manager'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {m.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                        {typeof m.teamId === 'object' && m.teamId ? m.teamId.name : 'No Team'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">{m.jobTitle || '-'}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
                            m.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : m.status === 'invited'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          {m._id !== user?._id && m.status !== 'deactivated' && (
                            <button
                              onClick={() => setDeactivateUser(m)}
                              className="text-xs text-rose-600 hover:text-rose-800 font-medium"
                            >
                              Deactivate
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Invite Employee Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite Employee to OfficeFlow"
      >
        {generatedInvite ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs space-y-1">
              <span className="font-bold text-sm block">Invitation Generated!</span>
              <p>
                Controlled onboarding link ready. Provide this single-use link to the employee to set
                their initial password.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Invitation URL
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={generatedInvite.link}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-700 select-all"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(generatedInvite.link)}
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  title="Copy Link"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suman Sen"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="suman@officeflow.internal"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Assigned Role
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e: any) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Assigned Team
                </label>
                <select
                  value={inviteForm.teamId}
                  onChange={(e) => setInviteForm({ ...inviteForm, teamId: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
                >
                  <option value="">No Team Assigned</option>
                  {teams.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Territory Sales Manager"
                  value={inviteForm.jobTitle}
                  onChange={(e) => setInviteForm({ ...inviteForm, jobTitle: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={inviteLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {inviteLoading ? 'Generating...' : 'Generate Invitation'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Deactivate User Modal with Reassignment */}
      <Modal
        isOpen={Boolean(deactivateUser)}
        onClose={() => setDeactivateUser(null)}
        title="Deactivate Staff Account"
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs space-y-1">
            <span className="font-semibold block">Revoke Account Access</span>
            <p>
              Deactivating <span className="font-bold">{deactivateUser?.name}</span> will immediately
              invalidate all their active sessions.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Reassign Open Leads & Deals To:
            </label>
            <select
              value={reassignUserId}
              onChange={(e) => setReassignUserId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
            >
              <option value="">Leave Unassigned</option>
              {members
                .filter((m) => m._id !== deactivateUser?._id && m.status === 'active')
                .map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.role})
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setDeactivateUser(null)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeactivate}
              disabled={deactivateLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-50"
            >
              {deactivateLoading ? 'Deactivating...' : 'Confirm Deactivation'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
