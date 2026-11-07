import React, { useState, useEffect, useCallback } from 'react';
import { reportService } from '../../services/reportService';
import { AccessibilityReport, ReportStatus } from '../../types/report';
import { ConflictDetection } from '../../types/dispute';
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  User,
  MapPin,
  Image as ImageIcon,
  RefreshCw,
  ExternalLink,
  X,
} from 'lucide-react';

const REPORT_CATEGORY_LABELS: Record<string, string> = {
  INACCESSIBLE_ENTRANCE: 'Inaccessible Entrance',
  DAMAGED_OR_MISSING_RAMP: 'Damaged or Missing Ramp',
  ELEVATOR_UNAVAILABLE: 'Elevator Unavailable',
  INACCESSIBLE_WASHROOM: 'Inaccessible Washroom',
  BLOCKED_PATHWAY: 'Blocked Pathway',
  INACCESSIBLE_PARKING: 'Inaccessible Parking',
  MISSING_SIGNAGE: 'Missing Accessibility Signage',
  OTHER: 'Other Accessibility Issue',
};

const STATUS_OPTIONS: (ReportStatus | 'ALL')[] = [
  'ALL',
  'PENDING',
  'IN_REVIEW',
  'APPROVED',
  'REJECTED',
  'NEEDS_MORE_INFORMATION',
  'DISPUTED',
  'RESOLVED',
];

export const AdminReportsPage: React.FC = () => {
  const [reports, setReports] = useState<AccessibilityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Selected report for detailed drawer/modal
  const [selectedReport, setSelectedReport] = useState<AccessibilityReport | null>(null);
  const [conflictData, setConflictData] = useState<ConflictDetection | null>(null);

  // Action states
  const [actionNotes, setActionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [updateProfile, setUpdateProfile] = useState(false);
  const [targetFeatureCode, setTargetFeatureCode] = useState('WHEELCHAIR_ACCESSIBLE_ENTRANCE');
  const [targetStatus, setTargetStatus] = useState<'AVAILABLE' | 'NOT_AVAILABLE'>('NOT_AVAILABLE');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportService.getAdminReports(selectedStatus);
      setReports(data.content);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch community reports');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleSelectReport = async (report: AccessibilityReport) => {
    setSelectedReport(report);
    setActionNotes('');
    setRejectionReason('');
    setUpdateProfile(false);
    setConflictData(null);

    try {
      const conflicts = await reportService.getReportConflicts(report.id);
      setConflictData(conflicts);
    } catch (err: any) {
      console.warn('Could not load conflicts:', err);
    }
  };

  const handleStatusTransition = async (newStatus: ReportStatus) => {
    if (!selectedReport) return;
    setSubmittingAction(true);
    setError(null);
    try {
      await reportService.updateReportStatus(selectedReport.id, {
        status: newStatus,
        adminNotes: actionNotes,
        rejectionReason: newStatus === 'REJECTED' ? (rejectionReason || actionNotes) : undefined,
        updateAccessibilityFeature: newStatus === 'APPROVED' ? updateProfile : false,
        featureCode: newStatus === 'APPROVED' && updateProfile ? targetFeatureCode : undefined,
        featureStatus: newStatus === 'APPROVED' && updateProfile ? targetStatus : undefined,
      });

      setSuccess(`Report ${selectedReport.id.substring(0, 8)} transitioned to ${newStatus}.`);
      setSelectedReport(null);
      fetchReports();
    } catch (err: any) {
      setError(err?.message || 'Failed to update report status');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRequestMoreInfo = async () => {
    if (!selectedReport || !actionNotes.trim()) {
      setError('Please provide questions/notes specifying what additional information is needed.');
      return;
    }
    setSubmittingAction(true);
    setError(null);
    try {
      await reportService.requestMoreInformation(selectedReport.id, actionNotes);
      setSuccess('Additional information requested from reporter.');
      setSelectedReport(null);
      fetchReports();
    } catch (err: any) {
      setError(err?.message || 'Failed to request more info');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    const matchesCat = categoryFilter === 'ALL' || r.category === categoryFilter;
    const matchesSearch =
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.placeName.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            Community Reports Moderation
          </h1>
          <p className="text-sm text-slate-400">
            Review user-submitted accessibility issue reports, inspect photographic evidence, and approve profile updates.
          </p>
        </div>
        <button
          onClick={fetchReports}
          className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-xl text-red-200 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-900/20 border border-emerald-700/50 rounded-xl text-emerald-200 text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {success}
          </span>
          <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search report title, venue, description..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-amber-500"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  Status: {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Categories</option>
            {Object.entries(REPORT_CATEGORY_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {String(label)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
            <p className="text-sm">Fetching community reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-medium">No community reports found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                onClick={() => handleSelectReport(report)}
                className={`p-4 hover:bg-slate-700/40 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  selectedReport?.id === report.id ? 'bg-slate-700/60 border-l-4 border-amber-400' : ''
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {report.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      #{report.id.substring(0, 8)}
                    </span>
                    <span className="text-xs text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/40 font-medium">
                      {REPORT_CATEGORY_LABELS[report.category] || report.category}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white text-base">{report.title}</h3>
                  <p className="text-xs text-slate-300 line-clamp-1">{report.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {report.placeName}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      {report.reportingUserEmail}
                    </span>
                    {report.photos && report.photos.length > 0 && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <ImageIcon className="w-3.5 h-3.5" />
                        {report.photos.length} photos
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                  <span className="text-xs text-slate-400">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-xs text-amber-400 font-medium mt-1">Review Details &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Drawer / Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-3xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-700 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {selectedReport.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ID: {selectedReport.id}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white">{selectedReport.title}</h3>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Place & Reporter Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-900/60 border border-slate-700 rounded-lg text-xs">
              <div>
                <span className="text-slate-500 block">Associated Place:</span>
                <strong className="text-slate-200 text-sm">{selectedReport.placeName}</strong>
                <p className="text-slate-400">{selectedReport.placeAddress}</p>
              </div>
              <div>
                <span className="text-slate-500 block">Reported By:</span>
                <strong className="text-slate-200">{selectedReport.reportingUserEmail}</strong>
                <p className="text-slate-400">
                  Observed on: {selectedReport.observationDate || 'Not specified'}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Detailed Description</label>
              <div className="p-3 bg-slate-900/80 border border-slate-700 rounded-lg text-xs text-slate-200 whitespace-pre-wrap">
                {selectedReport.description}
              </div>
            </div>

            {/* Photographs */}
            {selectedReport.photos && selectedReport.photos.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  Photographic Evidence ({selectedReport.photos.length})
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedReport.photos.map((photo) => (
                    <a
                      key={photo.id}
                      href={photo.photoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative rounded-lg overflow-hidden border border-slate-700 aspect-video bg-slate-900 block"
                    >
                      <img
                        src={photo.photoUrl}
                        alt="Evidence"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1">
                        View Full <ExternalLink className="w-3 h-3" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Conflict Detection Analysis */}
            {conflictData && conflictData.hasConflict && (
              <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg text-xs space-y-1">
                <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Conflict Warning
                </div>
                <p className="text-amber-200/90">{conflictData.conflictDescription}</p>
              </div>
            )}

            {/* Administrative Action Controls */}
            <div className="p-4 bg-slate-900/60 border border-slate-700 rounded-xl space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Administrative Decision
              </h4>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Moderator Notes</label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Notes explaining your decision..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Rejection Reason (if rejecting) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Rejection Reason (Mandatory if Rejecting)
                </label>
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Reason communicated to reporter..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Profile Correction Checkbox */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg space-y-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateProfile}
                    onChange={(e) => setUpdateProfile(e.target.checked)}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>
                    Update place accessibility profile immediately upon approval
                  </span>
                </label>

                {updateProfile && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Feature Code</label>
                      <select
                        value={targetFeatureCode}
                        onChange={(e) => setTargetFeatureCode(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-xs rounded p-1.5 text-white"
                      >
                        <option value="WHEELCHAIR_ACCESSIBLE_ENTRANCE">Wheelchair Entrance</option>
                        <option value="ELEVATOR_AVAILABLE">Elevator</option>
                        <option value="ACCESSIBLE_RESTROOM">Accessible Restroom</option>
                        <option value="ACCESSIBLE_PARKING">Accessible Parking</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">New Status</label>
                      <select
                        value={targetStatus}
                        onChange={(e) => setTargetStatus(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 text-xs rounded p-1.5 text-white"
                      >
                        <option value="NOT_AVAILABLE">NOT_AVAILABLE (Confirmed Issue)</option>
                        <option value="AVAILABLE">AVAILABLE (Fixed/Present)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRequestMoreInfo}
                  disabled={submittingAction}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  Request More Info
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatusTransition('REJECTED')}
                    disabled={submittingAction}
                    className="px-3 py-1.5 bg-red-900/60 hover:bg-red-900 text-red-200 border border-red-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusTransition('APPROVED')}
                    disabled={submittingAction}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {submittingAction ? 'Processing...' : 'Approve Report'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
