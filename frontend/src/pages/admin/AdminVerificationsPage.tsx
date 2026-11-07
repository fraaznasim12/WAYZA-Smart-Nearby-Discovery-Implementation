import React, { useState, useEffect, useCallback } from 'react';
import { accessibilityService } from '../../services/accessibilityService';
import { disputeService } from '../../services/disputeService';
import { ObservationSubmission, VerificationStatus } from '../../types/accessibility';
import { PlaceFreshness } from '../../types/dispute';
import {
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  Image as ImageIcon,
  ExternalLink,
  X,
  FileCheck,
} from 'lucide-react';

export const AdminVerificationsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<ObservationSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | 'ALL'>('PENDING');

  // Selected Submission Modal
  const [selectedSubmission, setSelectedSubmission] = useState<ObservationSubmission | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Freshness Audit
  const [freshnessPlaceId, setFreshnessPlaceId] = useState('');
  const [freshnessData, setFreshnessData] = useState<PlaceFreshness | null>(null);
  const [loadingFreshness, setLoadingFreshness] = useState(false);

  const fetchObservations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await accessibilityService.getAdminObservations(
        statusFilter === 'ALL' ? undefined : statusFilter
      );
      setSubmissions(data.content);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch accessibility observation queue');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchObservations();
  }, [fetchObservations]);

  const handleApprove = async (id: string) => {
    setProcessing(true);
    setError(null);
    try {
      await accessibilityService.approveObservation(id, reviewNotes || 'Approved by administrator');
      setSuccess('Observation checklist approved and official accessibility features updated.');
      setSelectedSubmission(null);
      fetchObservations();
    } catch (err: any) {
      setError(err?.message || 'Failed to approve observation checklist');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!reviewNotes.trim()) {
      setError('Please provide rejection notes explaining the reason.');
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      await accessibilityService.rejectObservation(id, reviewNotes);
      setSuccess('Observation checklist rejected.');
      setSelectedSubmission(null);
      fetchObservations();
    } catch (err: any) {
      setError(err?.message || 'Failed to reject observation checklist');
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckFreshness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!freshnessPlaceId.trim()) return;
    setLoadingFreshness(true);
    setFreshnessData(null);
    try {
      const data = await disputeService.getPlaceFreshness(freshnessPlaceId.trim(), 90);
      setFreshnessData(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to inspect venue freshness status');
    } finally {
      setLoadingFreshness(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            Accessibility Verification Queue
          </h1>
          <p className="text-sm text-slate-400">
            Moderate multi-feature observation checklists, inspect photographic evidence, and audit stale features.
          </p>
        </div>
        <button
          onClick={fetchObservations}
          className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Queue
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

      {/* Staleness Audit Bar */}
      <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-cyan-400" />
          Quick Staleness & Freshness Audit
        </h3>
        <form onSubmit={handleCheckFreshness} className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            value={freshnessPlaceId}
            onChange={(e) => setFreshnessPlaceId(e.target.value)}
            placeholder="Enter Place UUID (e.g. 550e8400-...)..."
            className="flex-1 min-w-[280px] bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={loadingFreshness}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors"
          >
            {loadingFreshness ? 'Auditing...' : 'Audit Freshness'}
          </button>
        </form>

        {freshnessData && (
          <div className="mt-4 p-3 bg-slate-900/80 border border-slate-700 rounded-lg text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">{freshnessData.placeName}</span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  freshnessData.staleCount === 0
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {freshnessData.staleCount} stale features (&gt; 90 days)
              </span>
            </div>
            <p className="text-slate-400">
              Total Tracked Features: {freshnessData.totalFeatures} • Fresh: {freshnessData.freshCount} • Stale: {freshnessData.staleCount}
            </p>
          </div>
        )}
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-2">
        {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as (VerificationStatus | 'ALL')[]).map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === st
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Submissions List */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
            <p className="text-sm">Fetching observation checklists...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <FileCheck className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-medium">No observation submissions in this queue.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                onClick={() => {
                  setSelectedSubmission(sub);
                  setReviewNotes('');
                }}
                className="p-4 hover:bg-slate-700/40 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {sub.verificationStatus}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      #{sub.id.substring(0, 8)}
                    </span>
                    <span className="text-xs text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/40 font-medium">
                      {sub.submissionType || 'COMMUNITY'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white text-base">
                    {sub.items?.length || 0} Facilities Audited
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      Place ID: {sub.placeId.substring(0, 8)}...
                    </span>
                    {sub.evidence && sub.evidence.length > 0 && (
                      <span className="flex items-center gap-1 text-cyan-400">
                        <ImageIcon className="w-3.5 h-3.5" />
                        {sub.evidence.length} photos
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400">
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </span>
                  <span className="block text-xs text-emerald-400 font-medium mt-1">
                    Review Checklist &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Checklist Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-700 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {selectedSubmission.verificationStatus}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ID: {selectedSubmission.id}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">Observation Checklist Details</h3>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Checklist items table */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">Observed Features</label>
              <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900/60">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 text-slate-400 uppercase border-b border-slate-700">
                    <tr>
                      <th className="px-3 py-2">Feature</th>
                      <th className="px-3 py-2">Proposed Status</th>
                      <th className="px-3 py-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {selectedSubmission.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 font-medium text-white">
                          {item.featureCode?.replace(/_/g, ' ') || 'Feature'}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`font-semibold ${
                              item.status === 'AVAILABLE' ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-400">{item.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Attached Photos */}
            {selectedSubmission.evidence && selectedSubmission.evidence.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400">Photographs</label>
                <div className="grid grid-cols-3 gap-3">
                  {selectedSubmission.evidence.map((ev, i) => (
                    <a
                      key={i}
                      href={ev.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-video bg-slate-900 border border-slate-700 rounded overflow-hidden group block relative"
                    >
                      <img src={ev.imageUrl} alt="Evidence" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px]">
                        Full <ExternalLink className="w-3 h-3 ml-1" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Review Notes */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Moderator Remarks</label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Audit notes or rejection justification..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
              <button
                type="button"
                onClick={() => handleReject(selectedSubmission.id)}
                disabled={processing}
                className="px-3 py-1.5 bg-red-900/60 hover:bg-red-900 text-red-200 border border-red-700 rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                Reject Checklist
              </button>
              <button
                type="button"
                onClick={() => handleApprove(selectedSubmission.id)}
                disabled={processing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 shadow-sm"
              >
                {processing ? 'Updating Features...' : 'Approve & Update Official Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
