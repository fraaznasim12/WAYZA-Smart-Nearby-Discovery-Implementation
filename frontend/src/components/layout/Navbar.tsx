import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Compass, Menu, X, ArrowRight, Sparkles, User, LogOut, ShieldCheck, ShieldAlert, Building2, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from '../notifications/NotificationBell';

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMobileMenu();
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/explore', label: 'Explore Places' },
    { to: '/assistant', label: 'AI Assistant', isAi: true },
    { to: '/how-it-works', label: 'How It Works' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
    ...(isAuthenticated ? [{ to: '/reports', label: 'My Reports' }] : []),
    ...(isAuthenticated ? [{ to: '/my-disputes', label: 'My Disputes' }] : []),
    ...(isAuthenticated && user?.role === 'ROLE_ADMIN' ? [{ to: '/admin', label: 'Admin Console' }] : []),
    ...(isAuthenticated && (user?.role === 'ROLE_BUSINESS' || user?.role === 'ROLE_BUSINESS_OWNER') ? [{ to: '/business', label: 'Business Portal' }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#D9E2EC] shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Logo & Brand Identity */}
          <Link 
            to="/" 
            className="flex items-center gap-3 group focus:rounded-xl focus:outline-hidden"
            aria-label="AccessMap Home"
            onClick={closeMobileMenu}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#102A43] to-[#0F766E] flex items-center justify-center text-white shadow-md shadow-slate-900/10 group-hover:shadow-teal-900/20 transition-all">
              <Compass className="w-5 h-5 transition-transform duration-300 group-hover:rotate-45" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-[#102A43] group-hover:text-[#0F766E] transition-colors">
                  AccessMap
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F5F1] text-[#0F766E] border border-[#0F766E]/20">
                  <Sparkles className="w-2.5 h-2.5" />
                  Live Platform
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F766E]">
                Verified Physical Accessibility
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'text-[#0F766E] bg-[#E8F5F1] font-bold border border-[#0F766E]/30 shadow-2xs'
                      : 'text-[#486581] hover:text-[#102A43] hover:bg-slate-100/70'
                  }`
                }
              >
                <span>{link.label}</span>
                {'isAi' in link && (
                  <span className="px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-700 font-extrabold text-[9px] uppercase tracking-wider">
                    AI
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Action CTAs / User Auth Menu */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <NotificationBell />
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-[#D9E2EC] transition-colors"
                  aria-label="User Dashboard"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#0F766E] text-white flex items-center justify-center font-bold text-xs">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-[#172B3A] leading-tight max-w-[120px] truncate">
                      {user.fullName}
                    </span>
                    <span className="text-[10px] font-semibold text-[#0F766E] leading-tight flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      {user.role.replace('ROLE_', '')}
                    </span>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 text-[#486581] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>
            ) : (
              <>
                <Link 
                  to="/login"
                  className="px-3.5 py-2 text-xs font-bold text-[#172B3A] hover:text-[#0F766E] hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Sign In
                </Link>
                <button 
                  type="button"
                  onClick={() => navigate('/register')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F766E] text-white text-xs font-bold shadow-xs hover:bg-[#115E59] hover:shadow-md transition-all cursor-pointer"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden">
            <button
              type="button"
              onClick={toggleMobileMenu}
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col space-y-1.5" aria-label="Mobile Navigation">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `px-3.5 py-2.5 rounded-xl text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200'
                      : 'text-slate-800 hover:bg-slate-100'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="pt-4 border-t border-slate-200 flex flex-col gap-2.5">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                      {user.fullName ? user.fullName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{user.fullName}</div>
                      <div className="text-xs text-teal-700 font-mono">{user.role}</div>
                    </div>
                  </div>
                </div>
                <Link
                  to="/notifications"
                  onClick={closeMobileMenu}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50"
                >
                  <Bell className="w-4 h-4 text-teal-600" />
                  <span>Notifications</span>
                </Link>
                <Link
                  to="/dashboard"
                  onClick={closeMobileMenu}
                  className="w-full block text-center px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50"
                >
                  My Dashboard
                </Link>
                {user.role === 'ROLE_ADMIN' && (
                  <Link
                    to="/admin"
                    onClick={closeMobileMenu}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100"
                  >
                    <ShieldAlert className="w-4 h-4 text-teal-700" />
                    <span>Admin Moderation Console</span>
                  </Link>
                )}
                {(user.role === 'ROLE_BUSINESS' || user.role === 'ROLE_BUSINESS_OWNER') && (
                  <Link
                    to="/business"
                    onClick={closeMobileMenu}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100"
                  >
                    <Building2 className="w-4 h-4 text-teal-700" />
                    <span>Business Facility Portal</span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-rose-700 border border-rose-200 rounded-xl hover:bg-rose-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <>
                <Link 
                  to="/login"
                  onClick={closeMobileMenu}
                  className="w-full text-center px-4 py-2.5 text-sm font-semibold text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50"
                >
                  Sign In
                </Link>
                <Link 
                  to="/register"
                  onClick={closeMobileMenu}
                  className="w-full text-center px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold shadow-sm hover:bg-teal-700"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
