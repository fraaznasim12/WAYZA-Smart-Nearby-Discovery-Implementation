import React, { useState, useEffect, useCallback } from 'react';
import { disputeService } from '../../services/disputeService';
import { Dispute, DisputeStatus, DISPUTE_CATEGORY_LABELS } from '../../types/dispute';
import {
  Scale,
  Search,
  Filter,
  CheckCircle2,
  Image as ImageIcon,
  ExternalLink,
  RefreshCw,
  X,
} from 'lucide-react';

const STATUS_FILTERS: (DisputeStatus | 'ALL')[] = [
  'ALL',
  'OPEN',
  'UNDER_REVIEW',
  'UPHELD',
  'OVERTURNED',
  'CLOSED',
];

export const AdminDisputesPage: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<DisputeStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  // Selected Dispute for Resolution Modal
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [correctProfile, setCorrectProfile] = useState(false);
  const [targetFeatureCode, setTargetFeatureCode] = useState('WHEELCHAIR_ACCESSIBLE_ENTRANCE');
  const [targetStatus, setTargetStatus] = useState<'AVAILABLE' | 'NOT_AVAILABLE'>('AVAILABLE');
  const [processing, setProcessing] = useState(false);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await disputeService.getAdminDisputes(
        selectedStatus === 'ALL' ? undefined : selectedStatus
      );
      setDisputes(data.content);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch disputes queue');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const handleResolve = async (newStatus: DisputeStatus) => {
    if (!selectedDispute) return;
    if (!resolutionNotes.trim()) {
      setError('Please provide resolution notes explaining your finding.');
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      await disputeService.updateDisputeStatus(selectedDispute.id, {
        status: newStatus,
        resolutionNotes,
        correctAccessibilityProfile: correctProfile,
        targetFeatureCode: correctProfile ? targetFeatureCode : undefined,
        targetFeatureStatus: correctProfile ? targetStatus : undefined,
      });

      setSuccess(`Dispute resolved with status: ${newStatus}`);
      setSelectedDispute(null);
      fetchDisputes();
    } catch (err: any) {
      setError(err?.message || 'Failed to resolve dispute');
    } finally {
      setProcessing(false);
    }
  };

  const filteredDisputes = disputes.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.placeName.toLowerCase().includes(q) ||
      d.explanation.toLowerCase().includes(q) ||
      (d.submittingUserEmail && d.submittingUserEmail.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Scale className="w-6 h-6 text-purple-400" />
            Dispute & Arbitration Management
          </h1>
          <p className="text-sm text-slate-400">
            Adjudicate conflicting accessibility claims, evaluate evidence, and rectify official facility records.
          </p>
        </div>
        <button
          onClick={fetchDisputes}
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

      {/* Search & Status Filter Bar */}
      <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search venue name, explanation, claimant..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-purple-500"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                Status: {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Disputes Table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400" />
            <p className="text-sm">Fetching dispute dockets...</p>
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Scale className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-medium">No disputes in this queue.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {filteredDisputes.map((dispute) => (
              <div
                key={dispute.id}
                onClick={() => {
                  setSelectedDispute(dispute);
                  setResolutionNotes('');
                  setCorrectProfile(false);
                }}
                className={`p-4 hover:bg-slate-700/40 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  selectedDispute?.id === dispute.id
                    ? 'bg-slate-700/60 border-l-4 border-purple-400'
                    : ''
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {dispute.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      #{dispute.id.substring(0, 8)}
                    </span>
                    <span className="text-xs text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-900/40 font-medium">
                      {DISPUTE_CATEGORY_LABELS[dispute.category] || dispute.category}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white text-base">{dispute.placeName}</h3>
                  <p className="text-xs text-slate-300 line-clamp-1">{dispute.explanation}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                    <span>Filed by: {dispute.submittingUserEmail}</span>
                    {dispute.featureCode && (
                      <span className="font-mono text-cyan-400">
                        Feature: {dispute.featureCode}
                      </span>
                    )}
                    {dispute.photos && dispute.photos.length > 0 && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <ImageIcon className="w-3.5 h-3.5" />
                        {dispute.photos.length} photos
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400">
                    {new Date(dispute.createdAt).toLocaleDateString()}
                  </span>
                  <span className="block text-xs text-purple-400 font-medium mt-1">
                    Adjudicate &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolution Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-700 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {selectedDispute.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ID: {selectedDispute.id}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white">Dispute Adjudication</h3>
              </div>
              <button
                onClick={() => setSelectedDispute(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Venue & Dispute Metadata */}
            <div className="p-3 bg-slate-900/60 border border-slate-700 rounded-lg text-xs space-y-1">
              <div>
                <span className="text-slate-500">Venue: </span>
                <strong className="text-white">{selectedDispute.placeName}</strong>
              </div>
              <div>
                <span className="text-slate-500">Claimant: </span>
                <span className="text-slate-300">{selectedDispute.submittingUserEmail}</span>
              </div>
              <div>
                <span className="text-slate-500">Category: </span>
                <span className="text-purple-300 font-semibold">
                  {DISPUTE_CATEGORY_LABELS[selectedDispute.category] || selectedDispute.category}
                </span>
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Claimant's Justification</label>
              <div className="p-3 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200">
                {selectedDispute.explanation}
              </div>
            </div>

            {/* Attached Photos */}
            {selectedDispute.photos && selectedDispute.photos.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400">Attached Evidence</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedDispute.photos.map((p) => (
                    <a
                      key={p.id}
                      href={p.photoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-video bg-slate-900 border border-slate-700 rounded overflow-hidden group block relative"
                    >
                      <img src={p.photoUrl} alt="Dispute evidence" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px]">
                        Full <ExternalLink className="w-3 h-3 ml-1" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Adjudication Notes */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Adjudication & Resolution Notes (Mandatory)
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="State the arbitration findings, evidence verification, and justification..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Profile Correction Option */}
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={correctProfile}
                  onChange={(e) => setCorrectProfile(e.target.checked)}
                  className="rounded border-slate-700 text-purple-500 focus:ring-purple-500"
                />
                <span>Directly update place accessibility profile based on this ruling</span>
              </label>

              {correctProfile && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Target Feature</label>
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
                    <label className="text-[11px] text-slate-400 block mb-1">Status Ruling</label>
                    <select
                      value={targetStatus}
                      onChange={(e) => setTargetStatus(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 text-xs rounded p-1.5 text-white"
                    >
                      <option value="AVAILABLE">AVAILABLE (Ruling: Operational)</option>
                      <option value="NOT_AVAILABLE">NOT_AVAILABLE (Ruling: Absent/Broken)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-700">
              <button
                type="button"
                onClick={() => handleResolve('CLOSED')}
                disabled={processing}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                Close Without Ruling
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleResolve('OVERTURNED')}
                  disabled={processing}
                  className="px-3 py-1.5 bg-amber-900/60 hover:bg-amber-900 text-amber-200 border border-amber-700 rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  Overturn Previous Info
                </button>
                <button
                  type="button"
                  onClick={() => handleResolve('UPHELD')}
                  disabled={processing}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 shadow-sm"
                >
                  {processing ? 'Ruling...' : 'Uphold Dispute'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
