import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Plus, Mail, Phone, Building, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Contact, Company } from '../types';
import { formatDate } from '../utils/formatters';
import { Modal } from '../components/ui/Modal';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';

export const ContactsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalContacts, setTotalContacts] = useState(0);
  const [search, setSearch] = useState('');

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    jobTitle: '',
    email: '',
    phone: '',
    companyId: '',
    tags: '',
    notes: '',
  });

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/contacts', { page, limit: 12, search });
      if (res.success) {
        setContacts(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages);
          setTotalContacts(res.pagination.total);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await api.get('/companies', { limit: 100 });
      if (res.success) setCompanies(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [page]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchContacts();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const selectedCompany = companies.find((c) => c._id === formData.companyId);
      const res = await api.post('/contacts', {
        ...formData,
        companyName: selectedCompany ? selectedCompany.name : undefined,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()) : [],
      });

      if (res.success) {
        setIsModalOpen(false);
        setFormData({
          name: '',
          jobTitle: '',
          email: '',
          phone: '',
          companyId: '',
          tags: '',
          notes: '',
        });
        fetchContacts();
      }
    } catch (err: any) {
      alert(err.message || 'Error creating contact');
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
            <Users className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Contacts</h1>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Key customer decision makers, stakeholders, and champions.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-sm space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Contact</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search contacts by name, email, phone, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
          />
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={6} />
          </div>
        ) : contacts.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No contacts found"
            description="You haven't added any contacts yet or none match your search."
            actionLabel="Add Contact"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <>
            {/* Mobile Card List (sm:hidden) */}
            <div className="divide-y divide-slate-100 sm:hidden">
              {contacts.map((c) => (
                <div key={c._id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{c.name}</div>
                      <div className="text-xs text-slate-500">{c.jobTitle || 'Executive'}</div>
                    </div>
                    {c.companyName || (c.companyId ? (
                      <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {c.companyName || (c.companyId ? c.companyId.name : '')}
                      </span>
                    ) : null)}
                  </div>

                  <div className="flex flex-col space-y-1 text-xs text-slate-600 pt-1">
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="text-indigo-600 hover:underline flex items-center">
                        <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {c.email}
                      </a>
                    )}
                    {c.phone && (
                      <div className="flex items-center text-slate-600">
                        <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {c.phone}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-50">
                    <span>Owner: {c.assignedTo?.name || 'Unassigned'}</span>
                    <span>Added {formatDate(c.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (hidden sm:block) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Name & Job Title</th>
                    <th className="px-6 py-3.5">Company</th>
                    <th className="px-6 py-3.5">Email</th>
                    <th className="px-6 py-3.5">Phone</th>
                    <th className="px-6 py-3.5">Owner</th>
                    <th className="px-6 py-3.5 text-right">Added On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contacts.map((c) => (
                    <tr
                      key={c._id}
                      className="hover:bg-slate-50/70 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{c.name}</div>
                        <div className="text-xs text-slate-500">{c.jobTitle || 'Executive'}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium">
                        {c.companyName || (c.companyId ? c.companyId.name : '-')}
                      </td>
                      <td className="px-6 py-4 text-indigo-600 text-xs">
                        <a href={`mailto:${c.email}`} className="hover:underline">
                          {c.email}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs">{c.phone || '-'}</td>
                      <td className="px-6 py-4 text-xs text-slate-700">
                        {c.assignedTo?.name || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 text-right">
                        {formatDate(c.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!loading && contacts.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-800">{contacts.length}</span> of{' '}
              <span className="font-semibold text-slate-800">{totalContacts}</span> contacts
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

      {/* New Contact Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Contact">
        <form onSubmit={handleCreateContact} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Meera Krishnan"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Job Title
              </label>
              <input
                type="text"
                placeholder="e.g. VP of Operations"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
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
                placeholder="meera@example.com"
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
                placeholder="+91 98450 12345"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Company
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="Decision Maker, Procurement, Sponsor"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              placeholder="Background, key preferences, communication history..."
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
              {formLoading ? 'Saving...' : 'Save Contact'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
