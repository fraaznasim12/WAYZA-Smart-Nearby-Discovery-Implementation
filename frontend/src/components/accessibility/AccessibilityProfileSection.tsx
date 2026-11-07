import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Calendar,
  PlusCircle,
  History,
  AlertCircle,
  Scale,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  Info,
} from 'lucide-react';
import { AccessibilityProfile, FeatureCategory } from '../../types/accessibility';
import { accessibilityService } from '../../services/accessibilityService';
import { aiService } from '../../services/aiService';
import { AiProfileExplanation } from '../../types/ai';
import { StatusBadge } from '../common/StatusBadge';
import { ObservationSubmitModal } from './ObservationSubmitModal';
import { ReportIssueModal } from '../report/ReportIssueModal';
import { SubmitDisputeModal } from '../dispute/SubmitDisputeModal';
import { AccessibilityFeature3D, Feature3DType } from '../3d/AccessibilityFeature3D';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AccessibilityProfileSectionProps {
  placeId: string;
  placeName: string;
}

const CATEGORY_ORDER: FeatureCategory[] = [
  'ENTRANCE',
  'VERTICAL_ACCESS',
  'RESTROOM',
  'PARKING',
  'PATHWAYS',
  'ADDITIONAL',
];

const CATEGORY_TITLES: Record<string, string> = {
  ENTRANCE: 'Entrance & Ingress',
  VERTICAL_ACCESS: 'Vertical Access & Elevators',
  RESTROOM: 'Restrooms & Washrooms',
  PARKING: 'Accessible Parking',
  PATHWAYS: 'Pathways & Reception',
  ADDITIONAL: 'Communication & Assistance Aids',
};

/** Maps each accessibility category to the matching 3D model type */
const CATEGORY_3D_TYPE: Record<string, Feature3DType> = {
  ENTRANCE: 'ENTRANCE',
  VERTICAL_ACCESS: 'ELEVATOR',
  RESTROOM: 'BUILDING',
  PARKING: 'BUILDING',
  PATHWAYS: 'RAMP',
  ADDITIONAL: 'RAMP',
};

export const AccessibilityProfileSection: React.FC<AccessibilityProfileSectionProps> = ({
  placeId,
  placeName,
}) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<AccessibilityProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState<boolean>(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // AI Accessibility Explanation state
  const [isExplaining, setIsExplaining] = useState<boolean>(false);
  const [aiExplanation, setAiExplanation] = useState<AiProfileExplanation | null>(null);
  const [aiExplanationOpen, setAiExplanationOpen] = useState<boolean>(false);
  const [aiExplanationError, setAiExplanationError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await accessibilityService.getPlaceAccessibility(placeId);
      setProfile(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load accessibility profile');
      }
    } finally {
      setLoading(false);
    }
  }, [placeId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const handleOpenSubmit = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsSubmitModalOpen(true);
  };

  const handleOpenReport = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsReportModalOpen(true);
  };

  const handleOpenDispute = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsDisputeModalOpen(true);
  };

  const handleToggleAiExplanation = async () => {
    if (aiExplanationOpen) {
      setAiExplanationOpen(false);
      return;
    }
    setAiExplanationOpen(true);
    if (!aiExplanation && !isExplaining) {
      setIsExplaining(true);
      setAiExplanationError(null);
      try {
        const data = await aiService.explainPlace(placeId);
        setAiExplanation(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setAiExplanationError(err.message);
        } else {
          setAiExplanationError('Failed to generate AI accessibility explanation.');
        }
      } finally {
        setIsExplaining(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center" aria-live="polite">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent" />
        <p className="mt-2 text-xs text-slate-500">Loading accessibility profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
        <p className="font-semibold">Unable to load accessibility profile</p>
        <p className="mt-1">{error || 'Please try again later'}</p>
        <button
          onClick={loadProfile}
          className="mt-2 text-xs font-bold underline hover:text-rose-950"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6" aria-labelledby="accessibility-profile-heading">
      {/* 4-State Verification Summary Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" aria-hidden="true" />
            <h3 id="accessibility-profile-heading" className="text-base font-bold text-slate-900">
              Accessibility Facility Audit
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleToggleAiExplanation}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                aiExplanationOpen
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
              }`}
            >
              {isExplaining ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              )}
              {aiExplanationOpen ? 'Hide AI Summary' : 'Explain with AI'}
            </button>
            <button
              type="button"
              onClick={handleOpenDispute}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold transition-colors"
            >
              <Scale className="w-3.5 h-3.5 text-amber-600" />
              Dispute Info
            </button>
            <button
              type="button"
              onClick={handleOpenReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300 text-xs font-bold transition-colors"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
              Report Barrier
            </button>
            <button
              type="button"
              onClick={handleOpenSubmit}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0F766E] text-white text-xs font-bold hover:bg-[#0c615a] active:bg-[#094d48] shadow-md shadow-[#0F766E]/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Submit Audit Update
            </button>
          </div>
        </div>

        {/* Four Status Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#E8F5F1] border border-[#10B981]/30 flex items-center gap-3 shadow-2xs">
            <CheckCircle2 className="w-6 h-6 text-[#0F766E] shrink-0" aria-hidden="true" />
            <div>
              <span className="block text-xl font-extrabold text-[#172B3A] leading-tight">
                {profile.availableCount}
              </span>
              <span className="text-xs font-semibold text-[#0F766E]">Available</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 shadow-2xs">
            <XCircle className="w-6 h-6 text-rose-600 shrink-0" aria-hidden="true" />
            <div>
              <span className="block text-xl font-extrabold text-rose-950 leading-tight">
                {profile.notAvailableCount}
              </span>
              <span className="text-xs font-semibold text-rose-700">Not Available</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3 shadow-2xs">
            <Clock className="w-6 h-6 text-amber-600 shrink-0" aria-hidden="true" />
            <div>
              <span className="block text-xl font-extrabold text-amber-950 leading-tight">
                {profile.notVerifiedCount}
              </span>
              <span className="text-xs font-semibold text-amber-700">Needs Verification</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3 shadow-2xs">
            <HelpCircle className="w-6 h-6 text-slate-500 shrink-0" aria-hidden="true" />
            <div>
              <span className="block text-xl font-extrabold text-slate-900 leading-tight">
                {profile.unknownCount}
              </span>
              <span className="text-xs font-semibold text-slate-600">Unknown</span>
            </div>
          </div>
        </div>

        {/* Verification Freshness Info */}
        <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Last Verified:{' '}
            <strong className="text-slate-700">
              {profile.lastVerifiedAt
                ? new Date(profile.lastVerifiedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'No official audit recorded'}
            </strong>
          </span>
          <span className="text-slate-400">
            Tracking {profile.totalTrackedFeatures} standardized criteria
          </span>
        </div>

        {profile.pendingObservationsCount > 0 && (
          <div className="mt-2.5 p-2.5 rounded-lg bg-teal-50/80 border border-teal-200 text-teal-900 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              <strong>{profile.pendingObservationsCount} community observation(s)</strong> currently under review by administrators.
            </span>
          </div>
        )}

        {/* AI Plain-English Accessibility Breakdown */}
        {aiExplanationOpen && (
          <div className="mt-3 p-4 rounded-2xl bg-linear-to-br from-purple-50/90 to-indigo-50/90 border border-purple-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-purple-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                AI Plain-English Accessibility Summary
              </span>
              <button
                type="button"
                onClick={() => setAiExplanationOpen(false)}
                className="text-xs text-purple-700 hover:text-purple-900 font-semibold"
              >
                Close
              </button>
            </div>

            {isExplaining && (
              <div className="flex items-center gap-2 py-3 text-purple-700 text-xs">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synthesizing accessibility audit records...</span>
              </div>
            )}

            {aiExplanationError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {aiExplanationError}
              </div>
            )}

            {aiExplanation && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-800 leading-relaxed font-normal bg-white/70 p-3 rounded-xl border border-purple-100">
                  {aiExplanation.plainEnglishExplanation}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Confirmed Available */}
                  <div className="p-3 bg-white/80 rounded-xl border border-emerald-200">
                    <span className="block font-bold text-emerald-900 mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Confirmed Available ({aiExplanation.confirmedAvailable.length})
                    </span>
                    {aiExplanation.confirmedAvailable.length > 0 ? (
                      <ul className="list-disc list-inside space-y-0.5 text-emerald-800 text-[11px]">
                        {aiExplanation.confirmedAvailable.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">No confirmed available facilities.</span>
                    )}
                  </div>

                  {/* Confirmed Unavailable */}
                  <div className="p-3 bg-white/80 rounded-xl border border-rose-200">
                    <span className="block font-bold text-rose-900 mb-1 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      Confirmed Not Available ({aiExplanation.confirmedUnavailable.length})
                    </span>
                    {aiExplanation.confirmedUnavailable.length > 0 ? (
                      <ul className="list-disc list-inside space-y-0.5 text-rose-800 text-[11px]">
                        {aiExplanation.confirmedUnavailable.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">No confirmed unavailable facilities.</span>
                    )}
                  </div>
                </div>

                {/* Unknown or Unverified */}
                {(aiExplanation.unknownFeatures.length > 0 || aiExplanation.unverifiedObservations.length > 0) && (
                  <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      {aiExplanation.unknownFeatures.length > 0 && (
                        <p>
                          <strong>Unknown details ({aiExplanation.unknownFeatures.length}):</strong>{' '}
                          {aiExplanation.unknownFeatures.join(', ')}.
                        </p>
                      )}
                      {aiExplanation.unverifiedObservations.length > 0 && (
                        <p className="mt-0.5">
                          <strong>Pending verification:</strong>{' '}
                          {aiExplanation.unverifiedObservations.join(', ')}.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span>Grounded strictly in verified database records</span>
                  {aiExplanation.lastVerifiedAt && (
                    <span>Audit Date: {new Date(aiExplanation.lastVerifiedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Categorized Features Accordion with 3D Illustrations */}
      <div className="space-y-3">
        {CATEGORY_ORDER.map((category) => {
          const catFeatures = profile.features.filter((f) => f.category === category);
          if (catFeatures.length === 0) return null;

          const isCollapsed = collapsedCategories[category];
          const availableInCat = catFeatures.filter((f) => f.status === 'AVAILABLE').length;
          const model3DType = CATEGORY_3D_TYPE[category] ?? 'BUILDING';

          return (
            <div
              key={category}
              className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className="w-full px-4 py-3 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between text-left transition-colors"
                aria-expanded={!isCollapsed}
              >
                <div className="flex items-center gap-3">
                  {/* 3D illustration — small widget next to category title */}
                  <AccessibilityFeature3D
                    type={model3DType}
                    className="w-12 h-12 shrink-0 rounded-lg"
                    interactive={false}
                  />
                  <div>
                    <span className="text-sm font-bold text-slate-800">
                      {CATEGORY_TITLES[category] || category}
                    </span>
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                      {availableInCat}/{catFeatures.length} Available
                    </span>
                  </div>
                </div>
                {isCollapsed ? (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>

              {!isCollapsed && (
                <div className="divide-y divide-slate-100 p-2">
                  {catFeatures.map((feat) => (
                    <div key={feat.code} className="py-2.5 px-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">{feat.name}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{feat.description}</p>
                        {feat.notes && (
                          <p className="text-xs text-teal-800 bg-teal-50/60 rounded px-2 py-1 mt-1 border border-teal-100">
                            <strong>Note:</strong> {feat.notes}
                          </p>
                        )}
                        {/* Per-feature last verified timestamp */}
                        {feat.lastVerifiedAt && (
                          <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" aria-hidden="true" />
                            Verified{' '}
                            {new Date(feat.lastVerifiedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 sm:self-start mt-1">
                        <StatusBadge status={feat.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Observation Audit History */}
      {profile.recentObservations && profile.recentObservations.length > 0 && (
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-slate-600" />
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Recent Field Audit History
            </h4>
          </div>
          <div className="space-y-2">
            {profile.recentObservations.map((obs) => (
              <div
                key={obs.id}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">
                      {obs.submittedByName || 'Community Contributor'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        obs.verificationStatus === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : obs.verificationStatus === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {obs.verificationStatus}
                    </span>
                    <span className="text-slate-400">
                      {new Date(obs.observationDate || obs.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {obs.description && <p className="text-slate-600 mt-1">{obs.description}</p>}
                  {obs.reviewNotes && (
                    <p className="text-slate-500 italic mt-0.5">Admin Note: {obs.reviewNotes}</p>
                  )}
                </div>
                <div className="text-slate-500 shrink-0 text-right">
                  {obs.items.length} feature(s) evaluated
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Observation Modal */}
      <ObservationSubmitModal
        placeId={placeId}
        placeName={placeName}
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSuccess={loadProfile}
      />

      {/* Community Barrier Report Modal */}
      <ReportIssueModal
        placeId={placeId}
        placeName={placeName}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSuccess={loadProfile}
      />

      {/* Community Dispute Submission Modal */}
      <SubmitDisputeModal
        placeId={placeId}
        placeName={placeName}
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        onSuccess={loadProfile}
      />
    </div>
  );
};

