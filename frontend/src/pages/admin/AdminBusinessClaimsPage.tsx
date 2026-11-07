import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import { PlaceOwnership } from '../../types/accessibility';
import {
  Building2,
  CheckCircle2,
  RefreshCw,
  Search,
  Calendar,
  Shield,
  X,
  AlertTriangle,
} from 'lucide-react';

export const AdminBusinessClaimsPage: React.FC = () => {
  const [claims, setClaims] = useState<PlaceOwnership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'VERIFIED' | 'ALL'>('PENDING');
  const [search, setSearch] = useState('');

  // Decision Modal
  const [selectedClaim, setSelectedClaim] = useState<PlaceOwnership | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getBusinessClaims({
        isVerified: statusFilter === 'VERIFIED' ? true : statusFilter === 'PENDING' ? false : undefined,
        page: 0,
        size: 20,
      });
      setClaims(data.content);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch business claims');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const handleVerify = async (approved: boolean) => {
    if (!selectedClaim) return;
    setProcessing(true);
    setError(null);
    try {
      await adminService.verifyBusinessClaim(
        selectedClaim.id,
        approved,
        decisionNotes || (approved ? 'Business ownership license verified' : 'Claim documentation rejected')
      );
      setSuccess(`Claim was successfully ${approved ? 'approved' : 'revoked / rejected'}.`);
      setSelectedClaim(null);
      fetchClaims();
    } catch (err: any) {
      setError(err?.message || 'Failed to update business ownership claim');
    } finally {
      setProcessing(false);
    }
  };

  const filteredClaims = claims.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (c.placeName && c.placeName.toLowerCase().includes(q)) ||
      (c.userFullName && c.userFullName.toLowerCase().includes(q)) ||
      (c.userEmail && c.userEmail.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-cyan-400" />
            Business Venue Ownership Claims
          </h1>
          <p className="text-sm text-slate-400">
            Verify facility ownership claims to grant merchant administrators authority over their venue accessibility data.
          </p>
        </div>
        <button
          onClick={fetchClaims}
          className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Claims
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

      {/* Filter Tabs & Search */}
      <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search venue name, applicant email..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex gap-2">
          {(['PENDING', 'VERIFIED', 'ALL'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === tab
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab === 'PENDING' ? 'Pending Approval' : tab === 'VERIFIED' ? 'Verified Owners' : 'All Claims'}
            </button>
          ))}
        </div>
      </div>

      {/* Claims List Table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
            <p className="text-sm">Fetching ownership claims...</p>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-medium">No business ownership claims in this view.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-xs uppercase text-slate-400 border-b border-slate-700/80 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Claimed Venue</th>
                  <th className="px-4 py-3">Claimant Applicant</th>
                  <th className="px-4 py-3">Claim Date</th>
                  <th className="px-4 py-3">Verification Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <div>
                        <div className="font-semibold text-white">{claim.placeName || 'Venue'}</div>
                        <div className="text-xs text-slate-400 font-mono">{claim.placeId}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-cyan-300">
                          {claim.userFullName?.charAt(0) || 'B'}
                        </div>
                        <div>
                          <div className="font-medium text-slate-200">{claim.userFullName || 'Business User'}</div>
                          <div className="text-xs text-slate-400 font-mono">{claim.userEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(claim.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          claim.isVerified
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {claim.isVerified ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Verified Owner
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3" /> Pending Review
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedClaim(claim);
                          setDecisionNotes('');
                        }}
                        className="px-3 py-1.5 text-xs font-semibold rounded bg-cyan-600 hover:bg-cyan-700 text-white transition-colors"
                      >
                        {claim.isVerified ? 'Revoke Status' : 'Evaluate Claim'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Decision Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                Ownership Verification Decision
              </h3>
              <button onClick={() => setSelectedClaim(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Evaluating claim for <strong>{selectedClaim.placeName}</strong> submitted by{' '}
              <strong>{selectedClaim.userFullName}</strong> ({selectedClaim.userEmail}).
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Administrative Notes</label>
              <textarea
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="State registration number, business license check notes..."
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
              <button
                type="button"
                onClick={() => setSelectedClaim(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleVerify(false)}
                disabled={processing}
                className="px-3 py-1.5 bg-red-900/60 hover:bg-red-900 text-red-200 border border-red-700 rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                Reject / Revoke
              </button>
              <button
                type="button"
                onClick={() => handleVerify(true)}
                disabled={processing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                {processing ? 'Saving...' : 'Approve Claim'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
