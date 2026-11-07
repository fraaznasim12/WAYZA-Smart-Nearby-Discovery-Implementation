import React, { useEffect, useState } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { UserProfile } from '../types/auth';
import {
  ShieldCheck,
  Mail,
  Calendar,
  Compass,
  LogOut,
  ShieldAlert,
  Building2,
  FileText,
  Scale,
  Bell,
  ArrowRight,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ProfilePhotoUploader } from '../components/profile/ProfilePhotoUploader';

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

  const isAdmin = profile?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_ADMIN';
  const isBusiness =
    profile?.role === 'ROLE_BUSINESS' ||
    profile?.role === 'ROLE_BUSINESS_OWNER' ||
    user?.role === 'ROLE_BUSINESS' ||
    user?.role === 'ROLE_BUSINESS_OWNER';

  return (
    <PageLayout className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-[#F7F9FC]">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-[#102A43] via-[#102A43] to-[#0F766E] rounded-3xl p-6 sm:p-10 text-white shadow-xl mb-8 border border-slate-700/50 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <ProfilePhotoUploader
              currentAvatarUrl={profile?.avatarUrl}
              onAvatarUpdated={(newUrl) =>
                setProfile((prev) => (prev ? { ...prev, avatarUrl: newUrl } : null))
              }
            />
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold tracking-tight text-white font-display">
                  {profile?.fullName || user?.fullName || 'Contributor'}
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#10B981]/20 text-emerald-300 border border-emerald-400/30 font-mono">
                  <ShieldCheck className="w-3 h-3" />
                  {profile?.role || user?.role || 'ROLE_USER'}
                </span>
                {loadingProfile && (
                  <span className="text-[11px] text-emerald-300/80 animate-pulse">Syncing...</span>
                )}
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-1.5 font-normal">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                {profile?.email || user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-100 text-xs font-semibold border border-white/20 transition-all cursor-pointer backdrop-blur-md self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4 text-rose-300" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Account Details & Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#486581] mb-1.5">
            User Identifier
          </div>
          <div className="font-mono text-xs text-[#172B3A] break-all bg-[#F7F9FC] p-2.5 rounded-xl border border-slate-200">
            {profile?.id || user?.id || '—'}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#486581] mb-1.5">
            Access Role (RBAC)
          </div>
          <div className="text-base font-bold text-[#172B3A] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0F766E]" />
            {profile?.role || user?.role || 'ROLE_USER'}
          </div>
          <p className="text-[11px] text-[#486581] mt-1">
            {isAdmin
              ? 'Full platform administration & moderation privileges'
              : isBusiness
              ? 'Venue ownership & official facility management'
              : 'Community accessibility auditor & observer'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#486581] mb-1.5">
            Member Since
          </div>
          <div className="text-sm font-semibold text-[#172B3A] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#0F766E]" />
            {profile?.memberSince
              ? new Date(profile.memberSince).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'Current Session'}
          </div>
          <p className="text-[11px] text-[#486581] mt-1">Verified account active</p>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
        <h2 className="text-lg font-bold text-[#172B3A] mb-4 font-display">
          Workspace Navigation
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Admin Banner (Conditional) */}
          {isAdmin && (
            <Link
              to="/admin"
              className="p-5 rounded-2xl border border-amber-300 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-400 transition-all flex items-start gap-3.5 group sm:col-span-2 lg:col-span-3"
            >
              <div className="p-2.5 rounded-xl bg-amber-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm text-[#172B3A] group-hover:text-amber-900 flex items-center gap-2">
                  <span>Admin Moderation Console</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold">
                    Admin Only
                  </span>
                </div>
                <div className="text-xs text-[#486581] mt-0.5">
                  Review community observations, approve verified facility audits, and manage disputes
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-700 mt-1 shrink-0 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}

          {/* Business Banner (Conditional) */}
          {isBusiness && (
            <Link
              to="/business"
              className="p-5 rounded-2xl border border-[#0F766E]/30 bg-[#E8F5F1] hover:bg-[#d8efe8] transition-all flex items-start gap-3.5 group sm:col-span-2 lg:col-span-3"
            >
              <div className="p-2.5 rounded-xl bg-[#0F766E] text-white shadow-xs group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm text-[#172B3A] group-hover:text-[#0F766E] flex items-center gap-2">
                  <span>Business Facility Portal</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold">
                    Owner Access
                  </span>
                </div>
                <div className="text-xs text-[#486581] mt-0.5">
                  Claim venue ownership, update accessibility profiles, and respond to community feedback
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#0F766E] mt-1 shrink-0 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}

          {/* Explore Places */}
          <Link
            to="/explore"
            className="p-5 rounded-2xl border border-slate-200 hover:border-[#0F766E]/40 hover:bg-[#E8F5F1]/30 transition-all flex items-start gap-3.5 group"
          >
            <div className="p-2.5 rounded-xl bg-[#E8F5F1] text-[#0F766E] group-hover:bg-[#0F766E] group-hover:text-white transition-colors">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-[#172B3A] group-hover:text-[#0F766E]">
                Explore Locations
              </div>
              <div className="text-xs text-[#486581] mt-0.5">
                Browse indexed physical spaces audited for wheelchair access & ramps
              </div>
            </div>
          </Link>

          {/* My Reports */}
          <Link
            to="/my-reports"
            className="p-5 rounded-2xl border border-slate-200 hover:border-[#0F766E]/40 hover:bg-[#E8F5F1]/30 transition-all flex items-start gap-3.5 group"
          >
            <div className="p-2.5 rounded-xl bg-[#E8F5F1] text-[#0F766E] group-hover:bg-[#0F766E] group-hover:text-white transition-colors">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-[#172B3A] group-hover:text-[#0F766E]">
                My Reports & Audits
              </div>
              <div className="text-xs text-[#486581] mt-0.5">
                Track status of your submitted barrier reports & photo audits
              </div>
            </div>
          </Link>

          {/* My Disputes */}
          <Link
            to="/my-disputes"
            className="p-5 rounded-2xl border border-slate-200 hover:border-[#0F766E]/40 hover:bg-[#E8F5F1]/30 transition-all flex items-start gap-3.5 group"
          >
            <div className="p-2.5 rounded-xl bg-[#E8F5F1] text-[#0F766E] group-hover:bg-[#0F766E] group-hover:text-white transition-colors">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-[#172B3A] group-hover:text-[#0F766E]">
                My Disputes
              </div>
              <div className="text-xs text-[#486581] mt-0.5">
                Monitor status of disputed facility records and resolutions
              </div>
            </div>
          </Link>

          {/* Notifications */}
          <Link
            to="/notifications"
            className="p-5 rounded-2xl border border-slate-200 hover:border-[#0F766E]/40 hover:bg-[#E8F5F1]/30 transition-all flex items-start gap-3.5 group"
          >
            <div className="p-2.5 rounded-xl bg-[#E8F5F1] text-[#0F766E] group-hover:bg-[#0F766E] group-hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-[#172B3A] group-hover:text-[#0F766E]">
                Notifications
              </div>
              <div className="text-xs text-[#486581] mt-0.5">
                View platform activity alerts, report approvals, and updates
              </div>
            </div>
          </Link>

          {/* How It Works */}
          <Link
            to="/how-it-works"
            className="p-5 rounded-2xl border border-slate-200 hover:border-[#0F766E]/40 hover:bg-[#E8F5F1]/30 transition-all flex items-start gap-3.5 group"
          >
            <div className="p-2.5 rounded-xl bg-[#E8F5F1] text-[#0F766E] group-hover:bg-[#0F766E] group-hover:text-white transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-[#172B3A] group-hover:text-[#0F766E]">
                Audit Guidelines
              </div>
              <div className="text-xs text-[#486581] mt-0.5">
                Review the 4-state physical accessibility criteria & standards
              </div>
            </div>
          </Link>
        </div>
      </div>
    </PageLayout>
  );
};

export default DashboardPage;
