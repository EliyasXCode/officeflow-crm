import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  LogOut,
  User as UserIcon,
  Menu,
  Check,
  Building,
  Briefcase,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { AppNotification } from '../../types';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onOpenMobileMenu }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notification state
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.success) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000); // 45s periodic check
    return () => clearInterval(interval);
  }, []);

  // Global search debounced
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get('/search', { q: searchQuery.trim() });
        if (res.success) {
          setSearchResults(res.results);
          setShowSearchResults(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, link?: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      if (link) {
        setShowNotifications(false);
        navigate(link);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-3 sm:px-6 backdrop-blur transition-all">
      {/* Left: Mobile hamburger & desktop toggle */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <button
          onClick={onToggleSidebar}
          className="hidden lg:flex p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
          title="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Search Button */}
        <button
          onClick={() => setMobileSearchOpen(true)}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition"
          aria-label="Open search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Global Search Bar (Desktop / Tablet) */}
        <div ref={searchRef} className="hidden md:block relative w-64 lg:w-96">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads, contacts, deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults) setShowSearchResults(true);
              }}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults && (
            <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 max-h-96 overflow-y-auto">
              {searchResults.leads?.length === 0 &&
              searchResults.contacts?.length === 0 &&
              searchResults.companies?.length === 0 &&
              searchResults.deals?.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  No matching records found.
                </div>
              ) : (
                <div className="py-2 divide-y divide-slate-100">
                  {searchResults.leads?.length > 0 && (
                    <div className="py-1">
                      <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Leads
                      </div>
                      {searchResults.leads.map((l: any) => (
                        <div
                          key={l._id}
                          onClick={() => {
                            setShowSearchResults(false);
                            setSearchQuery('');
                            navigate(`/leads/${l._id}`);
                          }}
                          className="px-3 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-sm"
                        >
                          <div>
                            <span className="font-medium text-slate-800">{l.fullName}</span>
                            {l.company && (
                              <span className="text-xs text-slate-500 ml-2">({l.company})</span>
                            )}
                          </div>
                          <span className="text-xs text-indigo-600 font-medium">{l.status}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.contacts?.length > 0 && (
                    <div className="py-1">
                      <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                        <Users className="w-3 h-3 mr-1" /> Contacts
                      </div>
                      {searchResults.contacts.map((c: any) => (
                        <div
                          key={c._id}
                          onClick={() => {
                            setShowSearchResults(false);
                            setSearchQuery('');
                            navigate(`/contacts/${c._id}`);
                          }}
                          className="px-3 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-sm"
                        >
                          <div>
                            <span className="font-medium text-slate-800">{c.name}</span>
                            {c.companyName && (
                              <span className="text-xs text-slate-500 ml-2">({c.companyName})</span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">{c.email}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.deals?.length > 0 && (
                    <div className="py-1">
                      <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                        <Briefcase className="w-3 h-3 mr-1" /> Deals
                      </div>
                      {searchResults.deals.map((d: any) => (
                        <div
                          key={d._id}
                          onClick={() => {
                            setShowSearchResults(false);
                            setSearchQuery('');
                            navigate('/deals');
                          }}
                          className="px-3 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-sm"
                        >
                          <span className="font-medium text-slate-800">{d.title}</span>
                          <span className="text-xs text-indigo-600 font-medium">{d.stage}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.companies?.length > 0 && (
                    <div className="py-1">
                      <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                        <Building className="w-3 h-3 mr-1" /> Companies
                      </div>
                      {searchResults.companies.map((comp: any) => (
                        <div
                          key={comp._id}
                          onClick={() => {
                            setShowSearchResults(false);
                            setSearchQuery('');
                            navigate(`/companies/${comp._id}`);
                          }}
                          className="px-3 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-sm"
                        >
                          <span className="font-medium text-slate-800">{comp.name}</span>
                          <span className="text-xs text-slate-400">{comp.industry || 'Company'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Notifications & User profile */}
      <div className="flex items-center space-x-3">
        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 md:w-96 rounded-xl bg-white shadow-2xl border border-slate-200 py-2 z-50 overflow-hidden max-w-[calc(100vw-1.5rem)]">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                <span className="font-semibold text-sm text-slate-800">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-400">
                    No notifications right now
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => handleMarkAsRead(n._id, n.link)}
                      className={`p-3.5 hover:bg-slate-50 cursor-pointer transition text-left ${
                        !n.isRead ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-semibold text-slate-800">{n.title}</span>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 mt-1" />
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-600">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="flex items-center pl-2 border-l border-slate-200 space-x-2 sm:space-x-3">
          <div className="hidden sm:block text-right">
            <div className="text-sm font-semibold text-slate-800">{user?.name}</div>
            <div className="flex items-center justify-end space-x-1">
              <span className="inline-block text-[11px] font-medium text-indigo-600 uppercase tracking-wide bg-indigo-50 px-1.5 py-0.2 rounded">
                {user?.role}
              </span>
              {user?.team && (
                <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
                  • {typeof user.team === 'object' ? user.team.name : ''}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
            title="Sign Out"
            aria-label="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col p-4 md:hidden">
          <div className="bg-white rounded-xl shadow-2xl p-3 flex items-center space-x-2">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Search leads, contacts, deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 py-1.5 text-sm outline-none text-slate-800"
            />
            <button
              onClick={() => {
                setMobileSearchOpen(false);
                setSearchQuery('');
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          {searchResults && (
            <div className="mt-2 bg-white rounded-xl shadow-xl overflow-hidden max-h-[70vh] overflow-y-auto divide-y divide-slate-100">
              {searchResults.leads?.length === 0 &&
              searchResults.contacts?.length === 0 &&
              searchResults.companies?.length === 0 &&
              searchResults.deals?.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  No matching records found.
                </div>
              ) : (
                <div className="py-2">
                  {searchResults.leads?.map((l: any) => (
                    <div
                      key={l._id}
                      onClick={() => {
                        setMobileSearchOpen(false);
                        setSearchQuery('');
                        navigate(`/leads/${l._id}`);
                      }}
                      className="px-4 py-2.5 hover:bg-slate-50 text-sm flex justify-between"
                    >
                      <span className="font-medium text-slate-800">{l.fullName}</span>
                      <span className="text-xs text-indigo-600">{l.status}</span>
                    </div>
                  ))}
                  {searchResults.deals?.map((d: any) => (
                    <div
                      key={d._id}
                      onClick={() => {
                        setMobileSearchOpen(false);
                        setSearchQuery('');
                        navigate('/deals');
                      }}
                      className="px-4 py-2.5 hover:bg-slate-50 text-sm flex justify-between"
                    >
                      <span className="font-medium text-slate-800">{d.title}</span>
                      <span className="text-xs text-indigo-600">{d.stage}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
};
