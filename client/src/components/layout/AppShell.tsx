import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Flame,
  KanbanSquare,
  CheckSquare,
  Menu,
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppShell: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const bottomNavItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Leads', href: '/leads', icon: Flame },
    { name: 'Deals', href: '/deals', icon: KanbanSquare },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-y-auto pb-16 lg:pb-0">
        <Header
          onToggleSidebar={() => setIsCollapsed(!isCollapsed)}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Fixed for quick thumb access) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 px-2 backdrop-blur lg:hidden">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition ${
                isActive
                  ? 'text-indigo-600 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <item.icon className="w-5 h-5 mb-0.5" />
            <span>{item.name}</span>
          </NavLink>
        ))}

        {/* More Menu Trigger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-800"
          aria-label="Open full menu"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
};
