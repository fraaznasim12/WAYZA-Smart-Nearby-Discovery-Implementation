import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Scale,
  Building2,
  Database,
  History,
  Settings,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  Shield,
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Overview', path: '/admin', icon: LayoutDashboard },
  { name: 'Users', path: '/admin/users', icon: Users },
  { name: 'Places', path: '/admin/places', icon: MapPin },
  { name: 'Community Reports', path: '/admin/reports', icon: AlertTriangle },
  { name: 'Verifications', path: '/admin/verifications', icon: CheckCircle2 },
  { name: 'Disputes', path: '/admin/disputes', icon: Scale },
  { name: 'Business Claims', path: '/admin/business-claims', icon: Building2 },
  { name: 'Data Management', path: '/admin/data-management', icon: Database },
  { name: 'Audit Logs', path: '/admin/audit-logs', icon: History },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
];

export const AdminLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active page title based on current pathname
  const currentNav = NAV_ITEMS.find((item) =>
    item.path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(item.path)
  ) || NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-emerald-400" />
          <span className="font-bold text-lg text-white">AccessMap Admin</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-800/95 md:bg-slate-800 border-r border-slate-700/80 flex flex-col transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand / Logo */}
        <div className="p-4 border-b border-slate-700/80 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight text-lg">AccessMap</span>
              <span className="block text-[10px] font-semibold tracking-wider text-emerald-400 uppercase">
                Admin Console
              </span>
            </div>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Badge */}
        <div className="px-4 py-3 bg-slate-900/40 border-b border-slate-700/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center font-bold text-xs text-emerald-300">
            {user?.fullName?.charAt(0) || 'A'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.fullName || 'Administrator'}</p>
            <p className="text-[10px] text-emerald-400 font-mono truncate">{user?.email}</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/40'
                    : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-300 font-bold">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-700/80 bg-slate-850 space-y-1">
          <Link
            to="/explore"
            className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" /> Return to Map
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          </Link>
          <div className="px-3 py-1.5 text-[10px] text-slate-500 font-mono">
            AccessMap v0.1.0 • Platform Phase 12
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 bg-slate-900 flex flex-col">
        {/* Top Navbar */}
        <div className="hidden md:flex items-center justify-between px-8 py-4 bg-slate-800/60 border-b border-slate-700/80">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link to="/admin" className="hover:text-emerald-400 transition-colors">
              Admin
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-200 font-medium">{currentNav.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live DB Session
            </span>
          </div>
        </div>

        {/* Subpage View Container */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

