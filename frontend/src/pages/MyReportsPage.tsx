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
  Plus,
  Sparkles,
  Star,
  MapPin,
} from 'lucide-react';
import { reportService } from '../services/reportService';
import { AccessibilityReport, ReportStatus, ReportType } from '../types/report';
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

const REPORT_TYPE_CONFIG: Record<
  ReportType,
  { label: string; bg: string; text: string; border: string; icon: React.FC<{ className?: string }> }
> = {
  ACCESSIBILITY_ISSUE: {
    label: 'Barrier / Issue',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: AlertTriangle,
  },
  ACCESSIBILITY_IMPROVEMENT: {
    label: 'Facility / Improvement',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: Sparkles,
  },
  VISIT_REVIEW: {
    label: 'Visit Review',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
    icon: MessageSquare,
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
      if (data.length > 0 && !selectedReport) {
        setSelectedReport(data[0]);
      }
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

  // Derived Summary Counts
  const totalReports = reports.length;
  const pendingReports = reports.filter(
    (r) => r.status === 'PENDING' || r.status === 'IN_REVIEW' || r.status === 'NEEDS_MORE_INFORMATION'
  ).length;
  const approvedReports = reports.filter((r) => r.status === 'APPROVED' || r.status === 'RESOLVED').length;
  const rejectedReports = reports.filter((r) => r.status === 'REJECTED' || r.status === 'DISPUTED').length;

  return (
    <PageLayout className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-[#F7F9FC]">
      {/* Top Banner with prominent + Add Your Report action */}
      <div className="bg-gradient-to-br from-[#102A43] via-[#102A43] to-[#0F766E] rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 border border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-display">
              My Accessibility Reports
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Track barriers, accessibility improvements, and visit experiences you've contributed to make India barrier-free.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <Link
            to="/reports/new"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#2DD4BF] hover:bg-[#20b8a5] active:bg-[#199e8d] text-[#102A43] text-xs sm:text-sm font-extrabold transition-all shadow-lg hover:shadow-xl cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            + Add Your Report
          </Link>
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold transition-all border border-white/20 cursor-pointer"
          >
            <Building2 className="w-4 h-4" />
            Explore Places
          </Link>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Reports</span>
          <p className="text-2xl font-extrabold text-[#102A43] mt-1">{totalReports}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">All community contributions</p>
        </div>

        <div className="bg-white rounded-2xl border border-amber-200/80 p-4 shadow-xs">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pending Review</span>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{pendingReports}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Awaiting moderation</p>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-200/80 p-4 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Approved</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{approvedReports}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Published & verified</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Resolved / Other</span>
          <p className="text-2xl font-extrabold text-slate-700 mt-1">{rejectedReports}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Fixed or rejected</p>
        </div>
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
          <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No Reports Submitted Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
            Whenever you encounter an inaccessible entrance, broken ramp, or missing lift in India, report it to help create a transparent accessibility directory.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/reports/new"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add Your First Report
            </Link>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
            >
              <Building2 className="w-4 h-4" />
              Explore Places
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Reports List */}
          <div className="md:col-span-2 space-y-3.5">
            {reports.map((rep) => {
              const statusCfg = STATUS_CONFIG[rep.status] || STATUS_CONFIG.PENDING;
              const StatusIcon = statusCfg.icon;
              const typeCfg =
                (rep.reportType && REPORT_TYPE_CONFIG[rep.reportType]) ||
                REPORT_TYPE_CONFIG.ACCESSIBILITY_ISSUE;
              const TypeIcon = typeCfg.icon;
              const isSelected = selectedReport?.id === rep.id;

              return (
                <div
                  key={rep.id}
                  onClick={() => setSelectedReport(rep)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/25 shadow-md ring-2 ring-teal-400/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      {/* Report Type Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${typeCfg.bg} ${typeCfg.text} ${typeCfg.border}`}
                      >
                        <TypeIcon className="w-3 h-3" />
                        {rep.reportTypeDisplayName || typeCfg.label}
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </span>
                    </div>

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

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {rep.description}
                  </p>

                  {/* Attached photo thumbnails preview if any */}
                  {rep.photos && rep.photos.length > 0 && (
                    <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-100">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {rep.photos.slice(0, 3).map((photo) => (
                          <img
                            key={photo.id}
                            src={photo.photoUrl}
                            alt="photo thumbnail"
                            className="inline-block h-7 w-7 rounded-lg object-cover ring-2 ring-white"
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-teal-600" />
                        {rep.photos.length} photo{rep.photos.length > 1 ? 's' : ''} attached
                      </span>
                    </div>
                  )}

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[10px]">
                        {rep.categoryDisplayName || rep.category}
                      </span>
                      {rep.observationDate && (
                        <span className="text-[11px] text-slate-400">
                          Visited: {new Date(rep.observationDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
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
                  <p className="text-xs text-teal-700 font-semibold mt-0.5 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {selectedReport.placeName}
                  </p>
                  {selectedReport.placeAddress && (
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {selectedReport.placeAddress}
                    </p>
                  )}
                </div>

                {/* Rating if present */}
                {selectedReport.rating && selectedReport.rating > 0 && (
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>{selectedReport.rating} of 5 Stars</span>
                  </div>
                )}

                <div className="text-xs space-y-2 text-slate-600">
                  <p className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 leading-relaxed whitespace-pre-wrap">
                    {selectedReport.description}
                  </p>
                </div>

                {/* Observation Details Table */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-[11px]">
                  {selectedReport.observationStatus && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Status:</span>
                      <span className="font-semibold text-slate-800">{selectedReport.observationStatus}</span>
                    </div>
                  )}
                  {selectedReport.impact && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Impact:</span>
                      <span className="font-semibold text-slate-800">{selectedReport.impact}</span>
                    </div>
                  )}
                  {selectedReport.observationSource && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Source:</span>
                      <span className="font-semibold text-slate-800">{selectedReport.observationSource}</span>
                    </div>
                  )}
                  {selectedReport.observationDate && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Visit Date:</span>
                      <span className="font-semibold text-slate-800">
                        {new Date(selectedReport.observationDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
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
