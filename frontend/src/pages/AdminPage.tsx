import React, { useState, useEffect, useCallback } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import {
  ShieldAlert,
  FileCheck,
  CheckCircle2,
  ExternalLink,
  Building2,
  AlertTriangle,
  Image as ImageIcon,
  Scale,
  RefreshCw,
  Search,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { accessibilityService } from '../services/accessibilityService';
import { reportService } from '../services/reportService';
import { disputeService } from '../services/disputeService';
import { ObservationSubmission, VerificationStatus } from '../types/accessibility';
import { AccessibilityReport, ReportStatus } from '../types/report';
import {
  Dispute,
  DisputeStatus,
  DISPUTE_CATEGORY_LABELS,
  ConflictDetection,
  PlaceFreshness,
} from '../types/dispute';
import { StatusBadge } from '../components/common/StatusBadge';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'QUEUE' | 'REPORTS' | 'DISPUTES' | 'FRESHNESS' | 'OVERVIEW'>('QUEUE');

  // Common feedback state
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Observations queue state
  const [selectedStatus, setSelectedStatus] = useState<VerificationStatus | 'ALL'>('PENDING');
  const [submissions, setSubmissions] = useState<ObservationSubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  // Community Reports moderation state
  const [selectedReportStatus, setSelectedReportStatus] = useState<ReportStatus | 'ALL'>('PENDING');
  const [reports, setReports] = useState<AccessibilityReport[]>([]);
  const [loadingReports, setLoadingReports] = useState<boolean>(false);
  const [reportNotes, setReportNotes] = useState<Record<string, string>>({});
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [updateProfileChecked, setUpdateProfileChecked] = useState<Record<string, boolean>>({});
  const [reportFeatureCode, setReportFeatureCode] = useState<Record<string, string>>({});
  const [reportFeatureStatus, setReportFeatureStatus] = useState<Record<string, 'AVAILABLE' | 'NOT_AVAILABLE'>>({});
  const [selectedConflictReport, setSelectedConflictReport] = useState<ConflictDetection | null>(null);

  // Disputes management state
  const [selectedDisputeStatus, setSelectedDisputeStatus] = useState<DisputeStatus | 'ALL'>('OPEN');
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loadingDisputes, setLoadingDisputes] = useState<boolean>(false);
  const [disputeNotes, setDisputeNotes] = useState<Record<string, string>>({});
  const [disputeCorrectProfile, setDisputeCorrectProfile] = useState<Record<string, boolean>>({});
  const [disputeTargetFeature, setDisputeTargetFeature] = useState<Record<string, string>>({});
  const [disputeTargetStatus, setDisputeTargetStatus] = useState<Record<string, 'AVAILABLE' | 'NOT_AVAILABLE'>>({});

  // Freshness Audit state
  const [freshnessPlaceId, setFreshnessPlaceId] = useState<string>('');
  const [freshnessThreshold, setFreshnessThreshold] = useState<number>(90);
  const [freshnessData, setFreshnessData] = useState<PlaceFreshness | null>(null);
  const [loadingFreshness, setLoadingFreshness] = useState<boolean>(false);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await accessibilityService.getAdminObservations(
        selectedStatus === 'ALL' ? undefined : selectedStatus
      );
      setSubmissions(data.content);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load observation submissions');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  const loadReports = useCallback(async () => {
    setLoadingReports(true);
    setError(null);
    try {
      const data = await reportService.getAdminReports(selectedReportStatus);
      setReports(data.content);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load community reports');
    } finally {
      setLoadingReports(false);
    }
  }, [selectedReportStatus]);

  const loadDisputes = useCallback(async () => {
    setLoadingDisputes(true);
    setError(null);
    try {
      const data = await disputeService.getAdminDisputes(selectedDisputeStatus);
      setDisputes(data.content);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load disputes queue');
    } finally {
      setLoadingDisputes(false);
    }
  }, [selectedDisputeStatus]);

  useEffect(() => {
    if (activeTab === 'QUEUE') {
      loadSubmissions();
    } else if (activeTab === 'REPORTS') {
      loadReports();
    } else if (activeTab === 'DISPUTES') {
      loadDisputes();
    }
  }, [activeTab, loadSubmissions, loadReports, loadDisputes]);

  const handleReview = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    setProcessingId(id);
    setError(null);
    setSuccessMessage(null);

    const notes = reviewNotes[id]?.trim() || (decision === 'APPROVED' ? 'Approved by admin' : 'Rejected by admin');

    try {
      await accessibilityService.reviewObservation(id, {
        decision,
        reviewNotes: notes,
      });

      setSuccessMessage(
        decision === 'APPROVED'
          ? 'Observation APPROVED! Official venue accessibility profile updated.'
          : 'Observation REJECTED. Audit record preserved.'
      );

      await loadSubmissions();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to execute review action');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReportModeration = async (reportId: string, newStatus: ReportStatus) => {
    setProcessingId(reportId);
    setError(null);
    setSuccessMessage(null);

    const notes = reportNotes[reportId]?.trim();
    const rejectionReason = rejectionReasons[reportId]?.trim();
    const shouldUpdateProfile = Boolean(updateProfileChecked[reportId]);
    const fCode = reportFeatureCode[reportId] || 'ELEVATOR_AVAILABILITY';
    const fStatus = reportFeatureStatus[reportId] || 'NOT_AVAILABLE';

    if (newStatus === 'REJECTED' && !rejectionReason && !notes) {
      setError('A rejection reason or explanatory note is required when rejecting a report.');
      setProcessingId(null);
      return;
    }

    try {
      await reportService.updateReportStatus(reportId, {
        status: newStatus,
        adminNotes: notes,
        rejectionReason: newStatus === 'REJECTED' ? (rejectionReason || notes) : undefined,
        updateAccessibilityFeature: newStatus === 'APPROVED' ? shouldUpdateProfile : false,
        featureCode: shouldUpdateProfile ? fCode : undefined,
        featureStatus: shouldUpdateProfile ? fStatus : undefined,
      });

      setSuccessMessage(
        newStatus === 'APPROVED'
          ? `Report APPROVED! ${shouldUpdateProfile ? 'Venue accessibility profile updated & audit log written.' : ''}`
          : newStatus === 'RESOLVED'
          ? 'Report marked as RESOLVED (Fixed & Remediated).'
          : `Report status updated to ${newStatus}.`
      );

      await loadReports();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update report status');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRequestReportInfo = async (reportId: string) => {
    const notes = reportNotes[reportId]?.trim();
    if (!notes) {
      setError('Please provide notes explaining what additional information is needed from the contributor.');
      return;
    }

    setProcessingId(reportId);
    setError(null);
    try {
      await reportService.requestMoreInformation(reportId, notes);
      setSuccessMessage('Report moved to NEEDS_MORE_INFORMATION. Submitter has been notified.');
      await loadReports();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to request additional information');
    } finally {
      setProcessingId(null);
    }
  };

  const handleInspectConflicts = async (reportId: string) => {
    setError(null);
    try {
      const data = await reportService.getReportConflicts(reportId);
      setSelectedConflictReport(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to run conflict detection');
    }
  };

  const handleDisputeModeration = async (disputeId: string, newStatus: DisputeStatus) => {
    setProcessingId(disputeId);
    setError(null);
    setSuccessMessage(null);

    const notes = disputeNotes[disputeId]?.trim();
    const correctProfile = Boolean(disputeCorrectProfile[disputeId]);
    const fCode = disputeTargetFeature[disputeId];
    const fStatus = disputeTargetStatus[disputeId] || 'AVAILABLE';

    try {
      await disputeService.updateDisputeStatus(disputeId, {
        status: newStatus,
        resolutionNotes: notes || `Dispute resolved as ${newStatus}`,
        correctAccessibilityProfile: newStatus === 'UPHELD' ? correctProfile : false,
        targetFeatureCode: correctProfile ? fCode : undefined,
        targetFeatureStatus: correctProfile ? fStatus : undefined,
      });

      setSuccessMessage(
        newStatus === 'UPHELD'
          ? `Dispute UPHELD! ${correctProfile ? 'Physical accessibility profile corrected.' : ''}`
          : `Dispute marked as ${newStatus}.`
      );

      await loadDisputes();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resolve dispute');
    } finally {
      setProcessingId(null);
    }
  };

  const handleFetchFreshness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!freshnessPlaceId.trim()) return;

    setLoadingFreshness(true);
    setError(null);
    try {
      const data = await disputeService.getPlaceFreshness(freshnessPlaceId.trim(), freshnessThreshold);
      setFreshnessData(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to audit place freshness');
      setFreshnessData(null);
    } finally {
      setLoadingFreshness(false);
    }
  };

  return (
    <PageLayout className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold">Admin Verification & Moderation Console</h1>
          </div>
          <p className="text-xs text-slate-300">
            Role: <span className="font-mono text-teal-300 font-bold">ROLE_ADMIN</span> | Active Moderator:{' '}
            <strong className="text-white">{user?.fullName || user?.email}</strong>
          </p>
        </div>

        {/* Console Mode Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('QUEUE')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'QUEUE' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Observations
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('REPORTS')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'REPORTS' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Reports
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('DISPUTES')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'DISPUTES' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Disputes Queue
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('FRESHNESS')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'FRESHNESS' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Freshness Audit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'OVERVIEW' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="font-bold ml-2">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold ml-2">Dismiss</button>
        </div>
      )}

      {/* DISPUTES QUEUE TAB */}
      {activeTab === 'DISPUTES' ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-600" />
                <h2 className="text-base font-bold text-slate-900">Community Disputes Management</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Investigate contested barrier reports, verify renovated accessibility features, and execute auditable profile corrections.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
              {(['OPEN', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED', 'UPHELD', 'OVERTURNED', 'CLOSED', 'ALL'] as (DisputeStatus | 'ALL')[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedDisputeStatus(st)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    selectedDisputeStatus === st
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {loadingDisputes ? (
            <div className="py-16 text-center text-xs text-slate-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-600 border-t-transparent" />
              <p className="mt-2">Loading disputes...</p>
            </div>
          ) : disputes.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-slate-200 bg-white text-xs text-slate-500">
              No disputes found for status: <strong>{selectedDisputeStatus}</strong>
            </div>
          ) : (
            <div className="space-y-5">
              {disputes.map((dispute) => {
                const isProcessing = processingId === dispute.id;
                const willCorrectProfile = Boolean(disputeCorrectProfile[dispute.id]);

                return (
                  <article
                    key={dispute.id}
                    className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Scale className="w-4 h-4 text-amber-600" />
                          <h3 className="text-base font-bold text-slate-900">
                            {DISPUTE_CATEGORY_LABELS[dispute.category] || dispute.category}
                          </h3>
                        </div>
                        <p className="text-xs text-teal-700 font-semibold mt-0.5">
                          {dispute.placeName} {dispute.placeAddress ? `• ${dispute.placeAddress}` : ''}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Disputed by: <strong className="text-slate-700">{dispute.submittingUserName}</strong> ({dispute.submittingUserEmail})
                          {dispute.featureCode && ` • Feature: ${dispute.featureCode}`}
                          {dispute.assignedReviewerName && ` • Assigned Reviewer: ${dispute.assignedReviewerName}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            dispute.status === 'UPHELD'
                              ? 'bg-emerald-100 text-emerald-800'
                              : dispute.status === 'OVERTURNED'
                              ? 'bg-rose-100 text-rose-800'
                              : dispute.status === 'UNDER_REVIEW'
                              ? 'bg-blue-100 text-blue-800'
                              : dispute.status === 'ADDITIONAL_INFORMATION_REQUIRED'
                              ? 'bg-purple-100 text-purple-800'
                              : dispute.status === 'CLOSED'
                              ? 'bg-slate-100 text-slate-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {dispute.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(dispute.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                      <div className="font-semibold text-slate-900">Grounds for Dispute:</div>
                      <p className="leading-relaxed whitespace-pre-wrap">{dispute.explanation}</p>
                    </div>

                    {/* Evidence photos */}
                    {dispute.photos && dispute.photos.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                          Attached Photographic Evidence ({dispute.photos.length})
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {dispute.photos.map((photo) => (
                            <a
                              key={photo.id}
                              href={photo.photoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 group"
                            >
                              <img
                                src={photo.photoUrl}
                                alt={photo.caption || 'Dispute Photo'}
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

                    {/* Resolution / Decision Notes */}
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <textarea
                        placeholder="Resolution justification or investigation notes..."
                        value={disputeNotes[dispute.id] ?? (dispute.resolutionNotes || '')}
                        onChange={(e) =>
                          setDisputeNotes((prev) => ({ ...prev, [dispute.id]: e.target.value }))
                        }
                        rows={2}
                        className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                      />

                      {/* Profile Correction Box on UPHELD */}
                      {['OPEN', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED'].includes(dispute.status) && (
                        <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200 text-xs space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-900">
                            <input
                              type="checkbox"
                              checked={willCorrectProfile}
                              onChange={(e) =>
                                setDisputeCorrectProfile((prev) => ({
                                  ...prev,
                                  [dispute.id]: e.target.checked,
                                }))
                              }
                              className="rounded text-amber-600 focus:ring-amber-500"
                            />
                            Correct Place Accessibility Profile upon UPHELD decision
                          </label>

                          {willCorrectProfile && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              <div>
                                <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                                  Target Feature Code:
                                </span>
                                <input
                                  type="text"
                                  value={disputeTargetFeature[dispute.id] ?? (dispute.featureCode || 'WHEELCHAIR_ACCESSIBLE_ENTRANCE')}
                                  onChange={(e) =>
                                    setDisputeTargetFeature((prev) => ({
                                      ...prev,
                                      [dispute.id]: e.target.value,
                                    }))
                                  }
                                  className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                                />
                              </div>
                              <div>
                                <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                                  Set Corrected Status To:
                                </span>
                                <select
                                  value={disputeTargetStatus[dispute.id] || 'AVAILABLE'}
                                  onChange={(e) =>
                                    setDisputeTargetStatus((prev) => ({
                                      ...prev,
                                      [dispute.id]: e.target.value as 'AVAILABLE' | 'NOT_AVAILABLE',
                                    }))
                                  }
                                  className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
                                >
                                  <option value="AVAILABLE">AVAILABLE (Operational & Verified)</option>
                                  <option value="NOT_AVAILABLE">NOT_AVAILABLE (Confirmed Barrier)</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Decision Buttons */}
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {dispute.status === 'OPEN' && (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleDisputeModeration(dispute.id, 'UNDER_REVIEW')}
                            className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition-colors disabled:opacity-50"
                          >
                            Mark Under Review
                          </button>
                        )}

                        {['OPEN', 'UNDER_REVIEW'].includes(dispute.status) && (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleDisputeModeration(dispute.id, 'ADDITIONAL_INFORMATION_REQUIRED')}
                            className="px-4 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold transition-colors disabled:opacity-50"
                          >
                            Request More Info
                          </button>
                        )}

                        {['OPEN', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED'].includes(dispute.status) && (
                          <>
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleDisputeModeration(dispute.id, 'OVERTURNED')}
                              className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-colors disabled:opacity-50"
                            >
                              Overturn Dispute
                            </button>
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleDisputeModeration(dispute.id, 'UPHELD')}
                              className="px-5 py-2 rounded-xl bg-amber-600 text-white hover:bg-amber-500 text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                            >
                              Upheld Dispute {willCorrectProfile ? '& Correct Profile' : ''}
                            </button>
                          </>
                        )}

                        {['UPHELD', 'OVERTURNED'].includes(dispute.status) && (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleDisputeModeration(dispute.id, 'CLOSED')}
                            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 text-xs font-bold transition-colors disabled:opacity-50"
                          >
                            Close Dispute
                          </button>
                        )}

                        {dispute.profileCorrected && (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 ml-auto">
                            Profile Corrected
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === 'FRESHNESS' ? (
        /* FRESHNESS AUDIT TAB */
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900">Accessibility Information Freshness Audit</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluate information aging across Indian venues against a configurable threshold. Stale features are flagged for re-verification without automatic conversion of verified data.
            </p>
          </div>

          <form onSubmit={handleFetchFreshness} className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Place UUID or Venue ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={freshnessPlaceId}
                    onChange={(e) => setFreshnessPlaceId(e.target.value)}
                    placeholder="e.g. 1cc413ea-6957-48ce-9a92-7d201a653661"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Staleness Threshold (Days)
                </label>
                <input
                  type="number"
                  min={7}
                  max={365}
                  value={freshnessThreshold}
                  onChange={(e) => setFreshnessThreshold(parseInt(e.target.value) || 90)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loadingFreshness}
                className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
              >
                {loadingFreshness ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Audit Venue Freshness
              </button>
            </div>
          </form>

          {freshnessData && (
            <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{freshnessData.placeName}</h3>
                  <p className="text-xs text-slate-500 font-mono">ID: {freshnessData.placeId}</p>
                </div>
                <div className="text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                  Policy Threshold: <strong>{freshnessData.freshnessThresholdDays} Days</strong>
                </div>
              </div>

              {/* Counts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">Total Features</div>
                  <div className="text-xl font-bold text-slate-900">{freshnessData.totalFeatures}</div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="text-xs text-emerald-700 font-medium">Fresh (≤ {freshnessData.freshnessThresholdDays}d)</div>
                  <div className="text-xl font-bold text-emerald-700">{freshnessData.freshCount}</div>
                </div>
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <div className="text-xs text-amber-700 font-medium">Stale (&gt; {freshnessData.freshnessThresholdDays}d)</div>
                  <div className="text-xl font-bold text-amber-700">{freshnessData.staleCount}</div>
                </div>
                <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">Unverified</div>
                  <div className="text-xl font-bold text-slate-700">{freshnessData.unverifiedCount}</div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  Feature Staleness Breakdown
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                  {freshnessData.features.map((item) => (
                    <div key={item.featureCode} className="p-3.5 bg-slate-50/50 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-900">{item.featureName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{item.featureCode}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={item.status} />
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            item.freshnessRating === 'FRESH'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.freshnessRating === 'AGING'
                              ? 'bg-blue-100 text-blue-800'
                              : item.freshnessRating === 'STALE'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {item.freshnessRating}
                          {item.daysSinceVerification !== null && item.daysSinceVerification !== undefined
                            ? ` (${item.daysSinceVerification}d)`
                            : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'QUEUE' ? (
        /* OBSERVATIONS QUEUE */
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Observation Moderation Queue</h2>
              <p className="text-xs text-slate-500">
                Review community checklists and photo evidence before official catalogue updates.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
              {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as (VerificationStatus | 'ALL')[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    selectedStatus === st ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-slate-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent" />
              <p className="mt-2">Loading observations queue...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-slate-200 bg-white text-xs text-slate-500">
              No submissions found for status: <strong>{selectedStatus}</strong>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((sub) => {
                const isPending = sub.verificationStatus === 'PENDING';
                const isProcessing = processingId === sub.id;

                return (
                  <article key={sub.id} className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-teal-600" />
                          <h3 className="text-sm font-bold text-slate-900">{sub.placeName || 'Venue Audit'}</h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Submitted by: <strong className="text-slate-700">{sub.submittedByName || 'Contributor'}</strong> ({sub.submissionType})
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            sub.verificationStatus === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sub.verificationStatus === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {sub.verificationStatus}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(sub.observationDate || sub.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {sub.description && (
                      <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        {sub.description}
                      </p>
                    )}

                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                        Evaluated Features ({sub.items.length})
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {sub.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between"
                          >
                            <span className="font-semibold text-slate-800">{item.featureCode}</span>
                            <StatusBadge status={item.status} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {sub.evidence && sub.evidence.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                          Attached Photographic Evidence
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {sub.evidence.map((ev, idx) => (
                            <a
                              key={idx}
                              href={ev.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 group"
                            >
                              <img
                                src={ev.imageUrl}
                                alt={ev.caption || 'Evidence'}
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

                    {isPending ? (
                      <div className="pt-3 border-t border-slate-100 space-y-3">
                        <textarea
                          placeholder="Admin review notes or reasoning for audit log..."
                          value={reviewNotes[sub.id] || ''}
                          onChange={(e) =>
                            setReviewNotes((prev) => ({ ...prev, [sub.id]: e.target.value }))
                          }
                          rows={2}
                          className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleReview(sub.id, 'REJECTED')}
                            className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-colors disabled:opacity-50"
                          >
                            Reject Observation
                          </button>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleReview(sub.id, 'APPROVED')}
                            className="px-5 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                          >
                            Approve & Update Profile
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span>Reviewed by: {sub.reviewedByName || 'Admin'}</span>
                        {sub.reviewNotes && <span className="italic">&quot;{sub.reviewNotes}&quot;</span>}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === 'REPORTS' ? (
        /* REPORTS QUEUE */
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Community Accessibility Reports</h2>
              <p className="text-xs text-slate-500">
                Moderate reported physical barriers, detect baseline conflicts, and assign review tasks.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
              {(['PENDING', 'IN_REVIEW', 'NEEDS_MORE_INFORMATION', 'APPROVED', 'REJECTED', 'DISPUTED', 'RESOLVED', 'ALL'] as (ReportStatus | 'ALL')[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedReportStatus(st)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    selectedReportStatus === st ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {loadingReports ? (
            <div className="py-16 text-center text-xs text-slate-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent" />
              <p className="mt-2">Loading reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-slate-200 bg-white text-xs text-slate-500">
              No reports found for status: <strong>{selectedReportStatus}</strong>
            </div>
          ) : (
            <div className="space-y-5">
              {reports.map((rep) => {
                const isProcessing = processingId === rep.id;
                const updateProfile = Boolean(updateProfileChecked[rep.id]);

                return (
                  <article key={rep.id} className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <h3 className="text-base font-bold text-slate-900">{rep.title}</h3>
                        </div>
                        <p className="text-xs text-teal-700 font-semibold mt-0.5">
                          {rep.placeName} {rep.placeAddress ? `• ${rep.placeAddress}` : ''}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Reported by: <strong className="text-slate-700">{rep.reportingUserName}</strong> ({rep.reportingUserEmail})
                          {rep.assignedReviewerName && ` • Assigned Reviewer: ${rep.assignedReviewerName}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            rep.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rep.status === 'RESOLVED'
                              ? 'bg-teal-100 text-teal-800'
                              : rep.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : rep.status === 'NEEDS_MORE_INFORMATION'
                              ? 'bg-purple-100 text-purple-800'
                              : rep.status === 'DISPUTED'
                              ? 'bg-amber-100 text-amber-800'
                              : rep.status === 'IN_REVIEW'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rep.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(rep.observationDate || rep.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                      <div className="font-semibold text-slate-900 flex items-center justify-between">
                        <span>Category: <span className="text-teal-700">{rep.categoryDisplayName || rep.category}</span></span>
                        <button
                          type="button"
                          onClick={() => handleInspectConflicts(rep.id)}
                          className="text-[11px] font-bold text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1"
                        >
                          <Info className="w-3.5 h-3.5" />
                          Check Duplicate & Conflict Analysis
                        </button>
                      </div>
                      <p className="leading-relaxed">{rep.description}</p>
                    </div>

                    {rep.rejectionReason && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                        <strong>Rejection Reason:</strong> {rep.rejectionReason}
                      </div>
                    )}

                    {rep.photos && rep.photos.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
                          Evidence Photographs ({rep.photos.length})
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {rep.photos.map((photo) => (
                            <a
                              key={photo.id}
                              href={photo.photoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 group"
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

                    {/* Controls */}
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <textarea
                          placeholder="Admin review notes..."
                          value={reportNotes[rep.id] ?? (rep.adminNotes || '')}
                          onChange={(e) =>
                            setReportNotes((prev) => ({ ...prev, [rep.id]: e.target.value }))
                          }
                          rows={2}
                          className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500"
                        />
                        <textarea
                          placeholder="Rejection Reason (Required if rejecting)..."
                          value={rejectionReasons[rep.id] ?? (rep.rejectionReason || '')}
                          onChange={(e) =>
                            setRejectionReasons((prev) => ({ ...prev, [rep.id]: e.target.value }))
                          }
                          rows={2}
                          className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500"
                        />
                      </div>

                      {rep.status !== 'RESOLVED' && (
                        <div className="p-3 rounded-2xl bg-teal-50/50 border border-teal-200 text-xs space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer font-bold text-teal-900">
                            <input
                              type="checkbox"
                              checked={updateProfile}
                              onChange={(e) =>
                                setUpdateProfileChecked((prev) => ({
                                  ...prev,
                                  [rep.id]: e.target.checked,
                                }))
                              }
                              className="rounded text-teal-600 focus:ring-teal-500"
                            />
                            Update Place Accessibility Profile with verified barrier status
                          </label>

                          {updateProfile && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              <div>
                                <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                                  Standard Feature Code:
                                </span>
                                <select
                                  value={reportFeatureCode[rep.id] || 'ELEVATOR_AVAILABILITY'}
                                  onChange={(e) =>
                                    setReportFeatureCode((prev) => ({
                                      ...prev,
                                      [rep.id]: e.target.value,
                                    }))
                                  }
                                  className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
                                >
                                  <option value="WHEELCHAIR_ACCESSIBLE_ENTRANCE">WHEELCHAIR_ACCESSIBLE_ENTRANCE</option>
                                  <option value="ENTRANCE_RAMP">ENTRANCE_RAMP</option>
                                  <option value="ELEVATOR_AVAILABILITY">ELEVATOR_AVAILABILITY</option>
                                  <option value="ACCESSIBLE_WASHROOM">ACCESSIBLE_WASHROOM</option>
                                  <option value="WHEELCHAIR_ACCESSIBLE_PATHWAYS">WHEELCHAIR_ACCESSIBLE_PATHWAYS</option>
                                  <option value="ACCESSIBLE_PARKING">ACCESSIBLE_PARKING</option>
                                  <option value="BRAILLE_SIGNAGE">BRAILLE_SIGNAGE</option>
                                </select>
                              </div>
                              <div>
                                <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                                  Set Status To:
                                </span>
                                <select
                                  value={reportFeatureStatus[rep.id] || 'NOT_AVAILABLE'}
                                  onChange={(e) =>
                                    setReportFeatureStatus((prev) => ({
                                      ...prev,
                                      [rep.id]: e.target.value as 'AVAILABLE' | 'NOT_AVAILABLE',
                                    }))
                                  }
                                  className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
                                >
                                  <option value="NOT_AVAILABLE">NOT_AVAILABLE (Barrier Confirmed)</option>
                                  <option value="AVAILABLE">AVAILABLE (Remediated / Verified)</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {rep.status === 'PENDING' && (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleReportModeration(rep.id, 'IN_REVIEW')}
                            className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition-colors disabled:opacity-50"
                          >
                            Mark In-Review
                          </button>
                        )}

                        {['PENDING', 'IN_REVIEW'].includes(rep.status) && (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleRequestReportInfo(rep.id)}
                            className="px-4 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold transition-colors disabled:opacity-50"
                          >
                            Request More Info
                          </button>
                        )}

                        {['PENDING', 'IN_REVIEW', 'NEEDS_MORE_INFORMATION'].includes(rep.status) && (
                          <>
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleReportModeration(rep.id, 'REJECTED')}
                              className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-colors disabled:opacity-50"
                            >
                              Reject Report
                            </button>
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleReportModeration(rep.id, 'APPROVED')}
                              className="px-5 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                            >
                              Approve Report
                            </button>
                          </>
                        )}

                        {rep.status === 'APPROVED' && (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleReportModeration(rep.id, 'RESOLVED')}
                            className="px-5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                          >
                            Mark as Resolved (Fixed)
                          </button>
                        )}

                        {rep.profileUpdated && (
                          <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded-md border border-teal-200 ml-auto">
                            Profile Updated
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* CONSOLE OVERVIEW TAB */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3 mb-2">
              <FileCheck className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-bold text-slate-900">Verification Engine Policy</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              In accordance with core system rules, missing information is never assumed to be inaccessible and is labeled <em>UNKNOWN</em>.
              Only verified reports approved by authorized administrators update official accessibility catalogue records.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3 mb-2">
              <Scale className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-slate-900">Dispute & Conflict Management</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Community disputes prevent misinformation and facilitate updates when physical infrastructure is remodeled. Reviewer separation guarantees that contributors cannot moderate their own disputes or reports.
            </p>
          </div>
        </div>
      )}

      {/* Conflict Detection Modal */}
      {selectedConflictReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 md:p-8">
            <button
              onClick={() => setSelectedConflictReport(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-lg transition"
            >
              &times;
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-2xl ${selectedConflictReport.hasConflict ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {selectedConflictReport.hasConflict ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Evidence Conflict & Duplicate Analysis</h3>
                <p className="text-xs text-slate-500">{selectedConflictReport.placeName}</p>
              </div>
            </div>

            <div className={`p-4 rounded-2xl mb-4 text-xs leading-relaxed ${selectedConflictReport.hasConflict ? 'bg-amber-50 border border-amber-200 text-amber-900' : 'bg-emerald-50 border border-emerald-200 text-emerald-900'}`}>
              <strong>Summary:</strong> {selectedConflictReport.conflictDescription}
            </div>

            <div className="space-y-3 text-xs mb-6">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-slate-600">Current Verified Feature Status:</span>
                <span className="font-bold text-slate-800">
                  {selectedConflictReport.currentFeatureStatus || 'UNKNOWN / UNSET'}
                </span>
              </div>

              {selectedConflictReport.currentLastVerifiedAt && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-600">Last Verified Date:</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(selectedConflictReport.currentLastVerifiedAt).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                  Similar or Overlapping Reports ({selectedConflictReport.similarReports.length})
                </h4>
                {selectedConflictReport.similarReports.length === 0 ? (
                  <p className="text-slate-400 italic">No duplicate reports on this venue.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedConflictReport.similarReports.map((s) => (
                      <div key={s.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-800">{s.title}</div>
                          <div className="text-[11px] text-slate-400">By {s.submitterName} on {new Date(s.createdAt).toLocaleDateString()}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                          {s.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedConflictReport(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default AdminPage;
