import React, { useState, useEffect, useCallback } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import {
  Scale,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  ExternalLink,
  MessageSquare,
  Image as ImageIcon,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
  Archive,
} from 'lucide-react';
import { disputeService } from '../services/disputeService';
import { Dispute, DisputeStatus, DISPUTE_CATEGORY_LABELS } from '../types/dispute';
import { Link } from 'react-router-dom';

const DISPUTE_STATUS_CONFIG: Record<
  DisputeStatus,
  { label: string; bg: string; text: string; border: string; icon: React.FC<{ className?: string }> }
> = {
  OPEN: {
    label: 'Open',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    icon: Clock,
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-800 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    icon: ShieldAlert,
  },
  ADDITIONAL_INFORMATION_REQUIRED: {
    label: 'Info Required',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-800 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    icon: HelpCircle,
  },
  UPHELD: {
    label: 'Upheld (Profile Corrected)',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  OVERTURNED: {
    label: 'Overturned',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-800 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
    icon: XCircle,
  },
  CLOSED: {
    label: 'Closed',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
    icon: Archive,
  },
};

export const MyDisputesPage: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [filter, setFilter] = useState<string>('ALL');

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await disputeService.getMyDisputes();
      setDisputes(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load your disputes.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const filteredDisputes = disputes.filter((d) => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTIVE') return ['OPEN', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED'].includes(d.status);
    if (filter === 'RESOLVED') return ['UPHELD', 'OVERTURNED', 'CLOSED'].includes(d.status);
    return d.status === filter;
  });

  return (
    <PageLayout className="bg-[#F7F9FC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#102A43] via-[#102A43] to-[#0F766E] rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 border border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-amber-500/20 border border-amber-500/30 rounded-2xl text-amber-300">
                <Scale className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                My Accessibility Disputes
              </h1>
            </div>
            <p className="text-slate-300 text-sm max-w-2xl font-normal">
              Track your filed challenges against inaccurate accessibility profiles, incorrect barrier moderation, or updated facility modifications.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-2">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F766E] hover:bg-[#0c615a] active:bg-[#094d48] text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              Explore Places & Dispute
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Total Disputes</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{disputes.length}</div>
          </div>
          <div className="p-4 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl">
            <div className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">Active Review</div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {disputes.filter((d) => ['OPEN', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED'].includes(d.status)).length}
            </div>
          </div>
          <div className="p-4 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl">
            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">Upheld & Corrected</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {disputes.filter((d) => d.status === 'UPHELD').length}
            </div>
          </div>
          <div className="p-4 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl">
            <div className="text-xs font-medium text-rose-600 dark:text-rose-400 mb-1">Overturned</div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {disputes.filter((d) => d.status === 'OVERTURNED').length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6">
          {['ALL', 'ACTIVE', 'UPHELD', 'OVERTURNED', 'CLOSED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                filter === tab
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab === 'ALL' ? 'All Disputes' : tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 text-center text-slate-500 dark:text-slate-400">
            <div className="animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full mx-auto mb-3" />
            Loading your disputes...
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl text-center text-rose-700 dark:text-rose-300">
            {error}
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-8">
            <Scale className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">No Disputes Found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
              You haven&apos;t submitted any accessibility disputes yet. If you notice inaccurate accessibility statuses or contested barrier reports on any venue, you can dispute them directly from that venue&apos;s page.
            </p>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold transition"
            >
              Find a Place to Review
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDisputes.map((dispute) => {
              const statusCfg = DISPUTE_STATUS_CONFIG[dispute.status];
              const StatusIcon = statusCfg.icon;

              return (
                <div
                  key={dispute.id}
                  className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 hover:border-amber-400/50 transition cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between"
                  onClick={() => setSelectedDispute(dispute)}
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusCfg.label}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(dispute.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Venue & Category */}
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white mb-1">
                      <Building2 className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span className="truncate">{dispute.placeName}</span>
                    </div>

                    <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">
                      {DISPUTE_CATEGORY_LABELS[dispute.category] || dispute.category}
                      {dispute.featureCode && ` • Feature: ${dispute.featureCode}`}
                    </div>

                    {/* Explanation snippet */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 mb-4 leading-relaxed">
                      {dispute.explanation}
                    </p>
                  </div>

                  {/* Footer / Meta */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-3">
                      {dispute.photos && dispute.photos.length > 0 && (
                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                          <ImageIcon className="w-3.5 h-3.5" />
                          {dispute.photos.length} Photo{dispute.photos.length > 1 ? 's' : ''}
                        </span>
                      )}
                      {dispute.resolutionNotes && (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <MessageSquare className="w-3.5 h-3.5" />
                          Resolved
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold group">
                      Details
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dispute Detail Modal */}
        {selectedDispute && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8">
              <button
                onClick={() => setSelectedDispute(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                &times;
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Dispute Details</h2>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Filed on {new Date(selectedDispute.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Status pill */}
              <div className="mb-6">
                {(() => {
                  const cfg = DISPUTE_STATUS_CONFIG[selectedDispute.status];
                  const Icon = cfg.icon;
                  return (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                    >
                      <Icon className="w-4 h-4" />
                      {cfg.label}
                    </span>
                  );
                })()}
              </div>

              {/* Details table */}
              <div className="space-y-4 text-sm mb-6">
                <div>
                  <span className="text-xs font-medium text-slate-400 block mb-1">Venue</span>
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>{selectedDispute.placeName}</span>
                    <Link
                      to={`/places/${selectedDispute.placeId}`}
                      className="text-xs text-amber-600 hover:underline flex items-center gap-1"
                    >
                      View Venue <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-medium text-slate-400 block mb-1">Dispute Category</span>
                  <div className="text-slate-800 dark:text-slate-200 font-medium">
                    {DISPUTE_CATEGORY_LABELS[selectedDispute.category] || selectedDispute.category}
                  </div>
                </div>

                {selectedDispute.featureCode && (
                  <div>
                    <span className="text-xs font-medium text-slate-400 block mb-1">Contested Feature</span>
                    <div className="text-slate-800 dark:text-slate-200 font-mono text-xs">
                      {selectedDispute.featureCode}
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-xs font-medium text-slate-400 block mb-1">Grounds / Explanation</span>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {selectedDispute.explanation}
                  </div>
                </div>

                {/* Evidence Photos */}
                {selectedDispute.photos && selectedDispute.photos.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-slate-400 block mb-2">Evidence Photos</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedDispute.photos.map((photo) => (
                        <a
                          key={photo.id}
                          href={photo.photoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video block group relative"
                        >
                          <img
                            src={photo.photoUrl}
                            alt={photo.caption || 'Evidence'}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Moderation Resolution */}
                {selectedDispute.resolutionNotes && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                    <div className="text-xs font-bold text-emerald-800 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Moderator Decision & Notes
                    </div>
                    <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                      {selectedDispute.resolutionNotes}
                    </p>
                    {selectedDispute.resolvedByName && (
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-2">
                        Resolved by: {selectedDispute.resolvedByName}{' '}
                        {selectedDispute.resolvedAt && `on ${new Date(selectedDispute.resolvedAt).toLocaleDateString()}`}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedDispute(null)}
                  className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-sm font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

