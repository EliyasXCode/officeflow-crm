import React, { useState, useEffect } from 'react';
import { Settings, Shield, Clock, Database, Save, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { formatDateTime } from '../utils/formatters';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';

export const SettingsPage: React.FC = () => {
  const { isAdmin } = useAuth();

  const [settings, setSettings] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchSettingsAndAudit = async () => {
    setLoading(true);
    try {
      const [sRes, aRes] = await Promise.all([
        api.get('/settings'),
        api.get('/settings/audit'),
      ]);
      if (sRes.success) setSettings(sRes.data);
      if (aRes.success) setAuditLogs(aRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndAudit();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/settings', settings);
      if (res.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } catch (err: any) {
      alert(err.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-12 text-center text-rose-600 bg-white rounded-xl border border-rose-200">
        Access Denied. Only Office Administrators can configure settings or view audit logs.
      </div>
    );
  }

  if (loading || !settings) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div>
        <div className="flex items-center space-x-2">
          <Settings className="w-6 h-6 text-indigo-600" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Office Settings & Audit</h1>
        </div>
        <p className="text-sm text-slate-500 mt-0.5">
          Configure office standards, currency formatting, and inspect the immutable security audit trail.
        </p>
      </div>

      {/* Settings Form */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-semibold text-slate-900">General Office Configuration</h2>
          {savedSuccess && (
            <span className="flex items-center text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-semibold">
              <Check className="w-3.5 h-3.5 mr-1" /> Settings saved successfully
            </span>
          )}
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Office / Branch Name
              </label>
              <input
                type="text"
                required
                value={settings.officeName || ''}
                onChange={(e) => setSettings({ ...settings, officeName: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Base Operating Currency
              </label>
              <input
                type="text"
                required
                value={settings.currency || 'INR'}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Default Timezone
              </label>
              <input
                type="text"
                required
                value={settings.timezone || 'Asia/Kolkata'}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-sm space-x-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Security Audit Trail */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-semibold text-slate-900">Security Audit Events</h2>
              <p className="text-xs text-slate-400">
                Tamper-resistant log of logins, invitations, assignments, archives, and stage changes.
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-semibold">{auditLogs.length} Events Logged</span>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-100 sticky top-0">
              <tr>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Author / User</th>
                <th className="px-6 py-3">Entity Type</th>
                <th className="px-6 py-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {auditLogs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50/70 transition">
                  <td className="px-6 py-3 font-mono text-slate-500">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="px-6 py-3">
                    <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-medium text-slate-800">
                    {log.userName || 'System'} ({log.userRole || 'internal'})
                  </td>
                  <td className="px-6 py-3 text-slate-600">{log.entityType}</td>
                  <td className="px-6 py-3 text-slate-400 font-mono">{log.ipAddress || '127.0.0.1'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
