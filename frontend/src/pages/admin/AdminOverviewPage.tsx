import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { AdminOverviewStats } from '../../types/admin';
import {
  Users,
  MapPin,
  AlertTriangle,
  Scale,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react';

export const AdminOverviewPage: React.FC = () => {
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getOverviewStats();
      setStats(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load administrative overview statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
        <p className="text-sm font-medium">Aggregating live platform metrics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-red-900/20 border border-red-700/50 rounded-xl text-red-200">
        <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          Error Loading Dashboard Data
        </h3>
        <p className="text-sm text-red-300 mb-4">{error}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-red-800/60 hover:bg-red-800 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Platform Command Center</h1>
          <p className="text-sm text-slate-400">
            Real-time aggregates across users, geospatial venues, verification pipelines, and community reports.
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Stats
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users Card */}
        <div className="p-5 bg-slate-800/80 border border-slate-700/80 rounded-xl hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Users className="w-5 h-5" />
            </span>
            <Link
              to="/admin/users"
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5"
            >
              Manage <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-white tracking-tight">{stats.totalUsers}</div>
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Total Registered</span>
              <span className="text-emerald-400 font-semibold">{stats.activeUsers} active</span>
            </div>
          </div>
        </div>

        {/* Places Card */}
        <div className="p-5 bg-slate-800/80 border border-slate-700/80 rounded-xl hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <MapPin className="w-5 h-5" />
            </span>
            <Link
              to="/admin/places"
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
            >
              Manage <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-white tracking-tight">{stats.totalPlaces}</div>
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Indexed Places</span>
              <span className="text-cyan-400 font-semibold">{stats.activePlaces} active</span>
            </div>
          </div>
        </div>

        {/* Community Reports Card */}
        <div className="p-5 bg-slate-800/80 border border-slate-700/80 rounded-xl hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <Link
              to="/admin/reports"
              className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-0.5"
            >
              Moderate <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-white tracking-tight">{stats.totalReports}</div>
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Community Reports</span>
              <span className="text-amber-400 font-semibold">{stats.pendingReports} pending</span>
            </div>
          </div>
        </div>

        {/* Disputes Card */}
        <div className="p-5 bg-slate-800/80 border border-slate-700/80 rounded-xl hover:border-purple-500/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400">
              <Scale className="w-5 h-5" />
            </span>
            <Link
              to="/admin/disputes"
              className="text-xs font-medium text-purple-400 hover:text-purple-300 flex items-center gap-0.5"
            >
              Resolve <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-white tracking-tight">{stats.openDisputes}</div>
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Open Disputes</span>
              <span className="text-purple-400 font-semibold">{stats.pendingBusinessClaims} pending claims</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Distribution & Verification Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown */}
        <div className="lg:col-span-2 p-6 bg-slate-800/60 border border-slate-700/80 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Venue Distribution by Category
            </h2>
            <Link to="/admin/places" className="text-xs text-slate-400 hover:text-slate-200">
              View all places &rarr;
            </Link>
          </div>

          {Object.keys(stats.placesByCategory).length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No categories recorded yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(stats.placesByCategory).map(([cat, count]) => (
                <div
                  key={cat}
                  className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex flex-col justify-between"
                >
                  <span className="text-xs font-medium text-slate-400 truncate uppercase tracking-wider">
                    {cat.replace(/_/g, ' ')}
                  </span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-lg font-bold text-white">{count}</span>
                    <span className="text-[10px] text-slate-500 font-medium">venues</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Verification Status Summary */}
        <div className="p-6 bg-slate-800/60 border border-slate-700/80 rounded-xl space-y-5">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Verification Pipeline
          </h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-medium">
                <span className="text-slate-300">Verified Features</span>
                <span className="text-emerald-400 font-bold">{stats.verifiedAccessibilityObservations}</span>
              </div>
              <div className="w-full bg-slate-700/60 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (stats.verifiedAccessibilityObservations / Math.max(1, stats.totalPlaces * 5)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5 font-medium">
                <span className="text-slate-300">Approved Reports</span>
                <span className="text-cyan-400 font-bold">{stats.approvedReports}</span>
              </div>
              <div className="w-full bg-slate-700/60 rounded-full h-2">
                <div
                  className="bg-cyan-500 h-2 rounded-full"
                  style={{
                    width: `${
                      stats.totalReports > 0 ? (stats.approvedReports / stats.totalReports) * 100 : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5 font-medium">
                <span className="text-slate-300">Pending Review</span>
                <span className="text-amber-400 font-bold">{stats.pendingReports}</span>
              </div>
              <div className="w-full bg-slate-700/60 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full"
                  style={{
                    width: `${
                      stats.totalReports > 0 ? (stats.pendingReports / stats.totalReports) * 100 : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
              <span className="text-xs text-slate-400">Pending Business Claims</span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {stats.pendingBusinessClaims}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Administrative Activity Log */}
      <div className="p-6 bg-slate-800/60 border border-slate-700/80 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Recent Administrative Actions
          </h2>
          <Link
            to="/admin/audit-logs"
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
          >
            Full Audit Trail <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats.recentActivities.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            No administrative operations recorded yet. Actions will populate as moderators review data.
          </div>
        ) : (
          <div className="divide-y divide-slate-700/60">
            {stats.recentActivities.map((act) => (
              <div key={act.id} className="py-3 flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white px-2 py-0.5 rounded bg-slate-700/80 font-mono">
                      {act.action}
                    </span>
                    <span className="text-xs text-slate-400">
                      on <strong className="text-slate-300">{act.resourceType}</strong>
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{act.metadata || 'No additional remarks'}</p>
                  <p className="text-[11px] text-slate-500">
                    By <span className="text-slate-400">{act.actorName}</span> ({act.actorEmail})
                  </p>
                </div>
                <div className="text-right whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {new Date(act.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
