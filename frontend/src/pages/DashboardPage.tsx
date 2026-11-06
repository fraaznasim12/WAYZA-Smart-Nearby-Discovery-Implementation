import React, { useEffect, useState } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { UserProfile } from '../types/auth';
import { User, ShieldCheck, Mail, Calendar, Compass, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(user);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const fetchLatestProfile = async () => {
      setLoadingProfile(true);
      try {
        const data = await authService.getCurrentUser();
        if (isMounted) setProfile(data);
      } catch (err) {
        console.error('Failed to refresh profile from /api/v1/auth/me', err);
      } finally {
        if (isMounted) setLoadingProfile(false);
      }
    };

    fetchLatestProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <PageLayout className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-10 text-white shadow-xl mb-8 border border-slate-700/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shadow-inner">
              <User className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  {profile?.fullName || user?.fullName}
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 font-mono">
                  <ShieldCheck className="w-3 h-3" />
                  {profile?.role || user?.role}
                </span>
                {loadingProfile && (
                  <span className="text-[11px] text-teal-300/70 animate-pulse">Syncing...</span>
                )}
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-teal-400" />
                {profile?.email || user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Account Details & Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">User Identifier</div>
          <div className="font-mono text-xs text-slate-800 break-all bg-slate-50 p-2 rounded-xl border border-slate-100">
            {profile?.id || user?.id}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Access Role (RBAC)</div>
          <div className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
            {profile?.role || user?.role}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Member Since</div>
          <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            {profile?.memberSince
              ? new Date(profile.memberSince).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'Current Session'}
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Navigation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/explore"
            className="p-5 rounded-2xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/30 transition-all flex items-start gap-3.5 group"
          >
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 group-hover:text-teal-700">Explore Locations</div>
              <div className="text-xs text-slate-500 mt-0.5">Discover physical spaces audited for accessibility</div>
            </div>
          </Link>

          <Link
            to="/how-it-works"
            className="p-5 rounded-2xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/30 transition-all flex items-start gap-3.5 group"
          >
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 group-hover:text-teal-700">Audit Guidelines</div>
              <div className="text-xs text-slate-500 mt-0.5">Learn about the 4-state verification model</div>
            </div>
          </Link>
        </div>
      </div>
    </PageLayout>
  );
};

export default DashboardPage;
