import React, { useState, useEffect } from 'react';
import { Building2, Search, Plus, Globe, Phone, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Company } from '../types';
import { formatDate } from '../utils/formatters';
import { Modal } from '../components/ui/Modal';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';

export const CompaniesPage: React.FC = () => {
  const { user } = useAuth();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [search, setSearch] = useState('');

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    website: '',
    phone: '',
    city: '',
    state: '',
    notes: '',
  });

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await api.get('/companies', { page, limit: 12, search });
      if (res.success) {
        setCompanies(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages);
          setTotalCompanies(res.pagination.total);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchCompanies();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const res = await api.post('/companies', {
        name: formData.name,
        industry: formData.industry,
        website: formData.website,
        phone: formData.phone,
        address: {
          city: formData.city,
          state: formData.state,
          country: 'India',
        },
        notes: formData.notes,
      });

      if (res.success) {
        setIsModalOpen(false);
        setFormData({
          name: '',
          industry: '',
          website: '',
          phone: '',
          city: '',
          state: '',
          notes: '',
        });
        fetchCompanies();
      }
    } catch (err: any) {
      alert(err.message || 'Error creating company');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Companies</h1>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Accounts, client organizations, and corporate entities.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-sm space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Company</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search companies by name, industry, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
          />
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton rows={6} />
          </div>
        ) : companies.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No companies found"
            description="You haven't added any companies yet."
            actionLabel="Add Company"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <>
            {/* Mobile Cards (sm:hidden) */}
            <div className="divide-y divide-slate-100 sm:hidden">
              {companies.map((c) => (
                <div key={c._id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="font-semibold text-slate-900 text-sm">{c.name}</div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {c.industry || 'General Industry'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1">
                    {c.website && (
                      <a
                        href={c.website}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center text-indigo-600 hover:underline"
                      >
                        <Globe className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {c.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                    {c.phone && <div className="text-slate-600">Phone: {c.phone}</div>}
                    {c.address?.city && (
                      <div className="text-slate-500">
                        {c.address.city}, {c.address.state || ''}
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-50">
                    Created {formatDate(c.createdAt)}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (hidden sm:block) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Company Name</th>
                    <th className="px-6 py-3.5">Industry</th>
                    <th className="px-6 py-3.5">Website</th>
                    <th className="px-6 py-3.5">Phone</th>
                    <th className="px-6 py-3.5">Location</th>
                    <th className="px-6 py-3.5 text-right">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {companies.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4 font-semibold text-slate-900">{c.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {c.industry || 'General Industry'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-indigo-600">
                        {c.website ? (
                          <a
                            href={c.website}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center hover:underline"
                          >
                            <Globe className="w-3.5 h-3.5 mr-1 text-slate-400" />
                            {c.website.replace(/^https?:\/\//, '')}
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">{c.phone || '-'}</td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {c.address?.city ? `${c.address.city}, ${c.address.state || ''}` : '-'}
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

        {!loading && companies.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-800">{companies.length}</span> of{' '}
              <span className="font-semibold text-slate-800">{totalCompanies}</span> companies
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

      {/* New Company Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Company">
        <form onSubmit={handleCreateCompany} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Reliance Retail Enterprises"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Industry
              </label>
              <input
                type="text"
                placeholder="e.g. Retail, Supply Chain, SaaS"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Website
              </label>
              <input
                type="text"
                placeholder="https://company.example.com"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone
              </label>
              <input
                type="text"
                placeholder="+91 22 2490 0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                City
              </label>
              <input
                type="text"
                placeholder="e.g. Mumbai"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Company Notes
            </label>
            <textarea
              rows={3}
              placeholder="Corporate headquarters, procurement process, strategic focus..."
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
              {formLoading ? 'Saving...' : 'Save Company'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
