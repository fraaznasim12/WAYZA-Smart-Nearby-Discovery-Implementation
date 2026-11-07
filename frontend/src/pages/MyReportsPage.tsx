import React, { useState, useEffect, useCallback } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import {
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Building2,
  ExternalLink,
  MessageSquare,
  Image as ImageIcon,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
  Scale,
} from 'lucide-react';
import { reportService } from '../services/reportService';
import { AccessibilityReport, ReportStatus } from '../types/report';
import { Link } from 'react-router-dom';

const STATUS_CONFIG: Record<
  ReportStatus,
  { label: string; bg: string; text: string; border: string; icon: React.FC<{ className?: string }> }
> = {
  PENDING: {
    label: 'Pending Review',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: Clock,
  },
  IN_REVIEW: {
    label: 'Under Investigation',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    icon: ShieldAlert,
  },
  APPROVED: {
    label: 'Approved Barrier',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Rejected',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    icon: XCircle,
  },
  RESOLVED: {
    label: 'Remediated & Fixed',
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-200',
    icon: CheckCircle2,
  },
  NEEDS_MORE_INFORMATION: {
    label: 'More Info Requested',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    icon: HelpCircle,
  },
  DISPUTED: {
    label: 'Disputed',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: Scale,
  },
};

export const MyReportsPage: React.FC = () => {
  const [reports, setReports] = useState<AccessibilityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<AccessibilityReport | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportService.getMyReports();
      setReports(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load your community reports.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <PageLayout className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-[#F7F9FC]">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-[#102A43] via-[#102A43] to-[#0F766E] rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight font-display">My Accessibility Reports</h1>
          </div>
          <p className="text-xs text-slate-300">
            Track barriers and accessibility issues you've reported across public venues in India.
          </p>
        </div>
        <Link
          to="/explore"
          className="relative z-10 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0c615a] active:bg-[#094d48] text-white text-xs font-bold transition-all shadow-md self-start sm:self-auto cursor-pointer"
        >
          <Building2 className="w-4 h-4" />
          Explore Places to Report
        </Link>
      </div>

      {loading ? (
        <div className="py-20 text-center" aria-live="polite">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent" />
          <p className="mt-3 text-xs text-slate-500 font-medium">Loading your reports...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          <p className="font-bold text-sm mb-1">Unable to Load Reports</p>
          <p>{error}</p>
          <button
            onClick={fetchReports}
            className="mt-3 px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : reports.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-slate-200 bg-white shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No Reports Submitted Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            Whenever you encounter an inaccessible entrance, broken ramp, or missing lift in India, report it to help create a transparent accessibility directory.
          </p>
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors"
          >
            Explore Places
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Reports List */}
          <div className="md:col-span-2 space-y-3">
            {reports.map((rep) => {
              const statusCfg = STATUS_CONFIG[rep.status] || STATUS_CONFIG.PENDING;
              const StatusIcon = statusCfg.icon;
              const isSelected = selectedReport?.id === rep.id;

              return (
                <div
                  key={rep.id}
                  onClick={() => setSelectedReport(rep)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/20 shadow-md ring-2 ring-teal-400/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusCfg.label}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Reported {new Date(rep.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">{rep.title}</h3>

                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-2 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>{rep.placeName}</span>
                    {rep.placeAddress && <span className="text-slate-400">• {rep.placeAddress}</span>}
                  </p>

                  <p className="text-xs text-slate-600 line-clamp-2">{rep.description}</p>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[10px]">
                      {rep.categoryDisplayName || rep.category}
                    </span>
                    <span className="flex items-center gap-1 text-teal-600 font-bold hover:underline">
                      View details <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Report Detail Sidebar */}
          <div className="md:col-span-1">
            {selectedReport ? (
              <div className="sticky top-20 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Report Overview
                  </h4>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      STATUS_CONFIG[selectedReport.status]?.bg
                    } ${STATUS_CONFIG[selectedReport.status]?.text} ${
                      STATUS_CONFIG[selectedReport.status]?.border
                    }`}
                  >
                    {STATUS_CONFIG[selectedReport.status]?.label}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedReport.title}</h3>
                  <p className="text-xs text-teal-700 font-semibold mt-0.5">
                    {selectedReport.placeName}
                  </p>
                </div>

                <div className="text-xs space-y-2 text-slate-600">
                  <p className="p-3 rounded-2xl bg-slate-50 border border-slate-100 leading-relaxed">
                    {selectedReport.description}
                  </p>
                </div>

                {/* Moderation Notes */}
                {selectedReport.adminNotes && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs">
                    <span className="block font-bold text-amber-900 mb-0.5 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                      Moderator Feedback:
                    </span>
                    <p className="text-amber-950 leading-snug">{selectedReport.adminNotes}</p>
                  </div>
                )}

                {/* Attached Evidence Photos */}
                {selectedReport.photos && selectedReport.photos.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
                      Evidence Photos ({selectedReport.photos.length})
                    </h5>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedReport.photos.map((photo) => (
                        <a
                          key={photo.id}
                          href={photo.photoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-900"
                        >
                          <img
                            src={photo.photoUrl}
                            alt={photo.caption || 'Evidence'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <ExternalLink className="w-4 h-4" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-xs">
                Select a report from the list to view full details, moderator feedback, and evidence.
              </div>
            )}
          </div>
        </div>
      )}
    </PageLayout>
  );
};
