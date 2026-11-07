import React, { useState, useEffect, useCallback } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import {
  Building2,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Plus,
  Send,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { accessibilityService } from '../services/accessibilityService';
import { PlaceOwnership } from '../types/accessibility';
import { ObservationSubmitModal } from '../components/accessibility/ObservationSubmitModal';

export const BusinessPage: React.FC = () => {
  const { user } = useAuth();

  const [claims, setClaims] = useState<PlaceOwnership[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Claim place input
  const [claimPlaceId, setClaimPlaceId] = useState<string>('');
  const [isClaiming, setIsClaiming] = useState<boolean>(false);

  // Update modal state
  const [activeModalPlace, setActiveModalPlace] = useState<{ id: string; name: string } | null>(null);

  const loadClaims = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await accessibilityService.getMyClaims();
      setClaims(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load business venue claims');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimPlaceId.trim()) return;

    setIsClaiming(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await accessibilityService.claimPlace(claimPlaceId.trim());
      setSuccessMessage('Venue claim submitted successfully! Awaiting administrative verification.');
      setClaimPlaceId('');
      await loadClaims();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to claim venue');
      }
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <PageLayout className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-[#F7F9FC]">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#102A43] via-[#102A43] to-[#0F766E] text-white p-6 sm:p-10 rounded-3xl border border-slate-700/50 shadow-xl mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md text-emerald-300 border border-white/20">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display">
              Business Facility Management
            </h1>
          </div>
          <p className="text-xs text-slate-300">
            Role: <span className="font-mono text-emerald-300 font-bold">{user?.role}</span> | Verified Business Account:{' '}
            <strong className="text-white">{user?.fullName || user?.email}</strong>
          </p>
        </div>
      </div>

      {successMessage && (
        <div
          role="status"
          className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between animate-in fade-in duration-150"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 ml-2 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between animate-in fade-in duration-150"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs font-bold text-rose-800 hover:text-rose-950 ml-2 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Claim a Venue Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-[#E8F5F1] text-[#0F766E]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#172B3A] font-display">
              Claim a Business Location
            </h2>
            <p className="text-xs text-[#486581]">
              Enter a Venue UUID to request facility management. Once verified by our administrators, you can publish official facility profiles.
            </p>
          </div>
        </div>

        <form onSubmit={handleClaimSubmit} className="mt-4 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
            value={claimPlaceId}
            onChange={(e) => setClaimPlaceId(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0F766E] font-mono"
            required
          />
          <button
            type="submit"
            disabled={isClaiming || !claimPlaceId.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F766E] text-white text-xs font-bold hover:bg-[#0c615a] active:bg-[#094d48] disabled:opacity-50 transition-all shadow-md shadow-[#0F766E]/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isClaiming ? 'Submitting Claim...' : 'Claim Venue'}</span>
          </button>
        </form>
      </div>

      {/* Claimed Venues List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#0F766E]" />
            <h2 className="text-base font-bold text-[#172B3A] font-display">
              My Claimed Locations
            </h2>
          </div>
          <span className="text-xs text-[#486581] font-semibold bg-slate-100 px-2.5 py-1 rounded-full">
            {claims.length} registered location(s)
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center bg-white rounded-3xl border border-slate-200/80">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#0F766E] border-t-transparent" />
            <p className="mt-2 text-xs text-[#486581]">Loading registered venues...</p>
          </div>
        ) : claims.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F5F1] text-[#0F766E] flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#172B3A]">No Venues Claimed Yet</h3>
            <p className="text-xs text-[#486581] mt-1 max-w-sm mx-auto">
              Use the form above to claim your business location and manage its official accessibility profile.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:border-[#0F766E]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-base font-bold text-[#172B3A] font-display">
                      {claim.placeName || 'Business Location'}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        claim.isVerified
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {claim.isVerified ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Verified Owner</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Pending Admin Approval</span>
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#486581] font-mono mb-4 break-all">
                    UUID: {claim.placeId}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-[#486581]">
                    Claimed: {new Date(claim.createdAt).toLocaleDateString()}
                  </span>

                  {claim.isVerified ? (
                    <button
                      type="button"
                      onClick={() =>
                        setActiveModalPlace({
                          id: claim.placeId,
                          name: claim.placeName || 'Business Location',
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0F766E] text-white text-xs font-bold hover:bg-[#0c615a] shadow-xs transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Facility Update</span>
                    </button>
                  ) : (
                    <span className="text-xs text-amber-700 italic">
                      Locked until ownership verification
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Observation Submit Modal for Business Owner */}
      {activeModalPlace && (
        <ObservationSubmitModal
          placeId={activeModalPlace.id}
          placeName={activeModalPlace.name}
          isOpen={true}
          onClose={() => setActiveModalPlace(null)}
          onSuccess={() => {
            setSuccessMessage('Official business facility proposal submitted to the verification queue!');
          }}
        />
      )}
    </PageLayout>
  );
};

export default BusinessPage;
