import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Flame,
  Users,
  Building2,
  KanbanSquare,
  CheckSquare,
  Calendar,
  BarChart3,
  ShieldCheck,
  Settings,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  mobileOpen,
  onCloseMobile,
}) => {
  const { user, isAdmin, isManager } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Leads', href: '/leads', icon: Flame },
    { name: 'Contacts', href: '/contacts', icon: Users },
    { name: 'Companies', href: '/companies', icon: Building2 },
    { name: 'Deals Pipeline', href: '/deals', icon: KanbanSquare },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    ...(isAdmin || isManager ? [{ name: 'Team', href: '/team', icon: ShieldCheck }] : []),
    ...(isAdmin ? [{ name: 'Settings & Audit', href: '/settings', icon: Settings }] : []),
  ];

  const content = (
    <div className="flex h-full flex-col justify-between py-4">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white shadow-md shadow-indigo-200">
              <Sparkles className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div>
                <span className="text-base font-bold tracking-tight text-slate-900 block leading-tight">
                  OfficeFlow
                </span>
                <span className="text-[11px] font-medium text-indigo-600 block uppercase tracking-wider">
                  CRM System
                </span>
              </div>
            )}
          </div>
          {mobileOpen && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1 px-3">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon
                className={`h-5 w-5 flex-shrink-0 ${
                  isCollapsed ? 'mx-auto' : 'mr-3'
                } text-slate-500`}
              />
              {!isCollapsed && <span>{item.name}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Office Environment Badge Footer */}
      {!isCollapsed && (
        <div className="mx-3 rounded-xl bg-slate-50 p-3.5 border border-slate-200/80">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Office Timezone</span>
            <span className="bg-white px-2 py-0.5 rounded shadow-2xs font-mono text-[11px] border border-slate-200">
              IST (UTC+5:30)
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600 mt-2">
            <span className="font-semibold text-slate-700">Base Currency</span>
            <span className="bg-white px-2 py-0.5 rounded shadow-2xs font-mono text-[11px] border border-slate-200">
              INR (₹)
            </span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r border-slate-200 bg-white transition-all duration-200 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex w-72 max-w-xs flex-1 flex-col bg-white shadow-2xl z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
