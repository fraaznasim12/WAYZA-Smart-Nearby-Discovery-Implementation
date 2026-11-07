import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import { AdminPlaceSummary, DuplicatePlaceCandidate, AdminPlaceUpdateRequest } from '../../types/admin';
import {
  MapPin,
  Search,
  CheckCircle2,
  RefreshCw,
  Edit2,
  Copy,
  Layers,
  X,
  Navigation,
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  'ALL',
  'HOSPITAL',
  'TRANSIT_HUB',
  'COLLEGE',
  'GOVERNMENT_OFFICE',
  'RESTAURANT',
  'HOTEL',
  'SHOPPING_MALL',
  'COMMERCIAL',
];

export const AdminPlacesPage: React.FC = () => {
  const [places, setPlaces] = useState<AdminPlaceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Duplicate Candidates Modal State
  const [duplicateModalPlace, setDuplicateModalPlace] = useState<AdminPlaceSummary | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicatePlaceCandidate[]>([]);
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);

  // Edit Metadata Modal State
  const [editingPlace, setEditingPlace] = useState<AdminPlaceSummary | null>(null);
  const [editForm, setEditForm] = useState<AdminPlaceUpdateRequest>({
    name: '',
    category: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    phone: '',
    website: '',
    reason: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchPlaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getPlaces({
        search: search || undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        city: cityFilter || undefined,
        isActive: statusFilter === 'ACTIVE' ? true : statusFilter === 'INACTIVE' ? false : undefined,
        page,
        size: 15,
      });
      setPlaces(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch places');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, cityFilter, statusFilter, page]);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  const handleToggleStatus = async (place: AdminPlaceSummary) => {
    const newStatus = !place.isActive;
    try {
      await adminService.updatePlaceStatus(
        place.id,
        newStatus,
        newStatus ? 'Reactivated by administrator' : 'Deactivated for review'
      );
      setSuccess(`Place "${place.name}" is now ${newStatus ? 'active' : 'inactive'}.`);
      fetchPlaces();
    } catch (err: any) {
      setError(err?.message || 'Failed to update place status');
    }
  };

  const handleOpenDuplicates = async (place: AdminPlaceSummary) => {
    setDuplicateModalPlace(place);
    setLoadingDuplicates(true);
    try {
      const candidates = await adminService.getDuplicateCandidates(place.id);
      setDuplicates(candidates);
    } catch (err: any) {
      setError(err?.message || 'Failed to check duplicate candidates');
    } finally {
      setLoadingDuplicates(false);
    }
  };

  const handleOpenEdit = (place: AdminPlaceSummary) => {
    setEditingPlace(place);
    setEditForm({
      name: place.name,
      category: place.category,
      address: place.address,
      city: place.city || '',
      state: place.state || '',
      postalCode: place.postalCode || '',
      phone: place.phone || '',
      website: place.website || '',
      reason: '',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlace) return;
    setSavingEdit(true);
    setError(null);
    try {
      await adminService.updatePlace(editingPlace.id, editForm);
      setSuccess(`Metadata for "${editForm.name}" updated successfully.`);
      setEditingPlace(null);
      fetchPlaces();
    } catch (err: any) {
      setError(err?.message || 'Failed to update place metadata');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-cyan-400" />
            Place & Geospatial Management
          </h1>
          <p className="text-sm text-slate-400">
            Inspect indexed locations, geographical provenance, accessibility profiles, and duplicate detection.
          </p>
        </div>
        <div className="text-xs text-slate-400">
          Total Indexed Venues: <strong className="text-cyan-400">{totalElements}</strong>
        </div>
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
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search venue name, address..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(0);
            }}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-cyan-500"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={cityFilter}
            onChange={(e) => {
              setCityFilter(e.target.value);
              setPage(0);
            }}
            placeholder="City filter..."
            className="w-32 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-cyan-500"
          />

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>

          <button
            onClick={fetchPlaces}
            className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
            title="Reload places"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Places Table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
            <p className="text-sm">Fetching indexed locations...</p>
          </div>
        ) : places.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-medium">No places found matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-xs uppercase text-slate-400 border-b border-slate-700/80 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Venue</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">City / State</th>
                  <th className="px-4 py-3">Provenance</th>
                  <th className="px-4 py-3">Features</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {places.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <div>
                        <div className="font-semibold text-white">{p.name}</div>
                        <div className="text-xs text-slate-400 truncate max-w-xs">{p.address}</div>
                        <div className="text-[11px] font-mono text-cyan-400 flex items-center gap-1 mt-0.5">
                          <Navigation className="w-3 h-3" />
                          {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-slate-700 text-slate-200">
                        <Layers className="w-3 h-3 text-cyan-400" />
                        {p.category.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400">
                      <div>{p.city || '—'}</div>
                      <div className="text-slate-500">{p.state || 'India'}</div>
                    </td>
                    <td className="px-4 py-3.5 text-xs">
                      <span className="font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                        {p.sourceName}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {p.verifiedFeaturesCount} audited
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          p.isActive
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                      >
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleOpenDuplicates(p)}
                          className="px-2 py-1 text-xs font-medium rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                          title="Check for duplicate venues nearby"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="px-2 py-1 text-xs font-medium rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                          title="Edit venue details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                            p.isActive
                              ? 'bg-red-900/40 hover:bg-red-900/60 text-red-300 border border-red-800/40'
                              : 'bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/40'
                          }`}
                        >
                          {p.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-slate-900/60 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {page + 1} of {totalPages} ({totalElements} venues)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Duplicate Candidates Modal */}
      {duplicateModalPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Copy className="w-5 h-5 text-cyan-400" />
                Duplicate Candidates Detection
              </h3>
              <button
                onClick={() => setDuplicateModalPlace(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Evaluating potential duplicate venues for:{' '}
              <strong className="text-white">{duplicateModalPlace.name}</strong> ({duplicateModalPlace.address})
            </p>

            {loadingDuplicates ? (
              <div className="py-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
                <p className="text-xs">Scanning geospatial index for duplicate candidates...</p>
              </div>
            ) : duplicates.length === 0 ? (
              <div className="py-8 text-center text-emerald-400 bg-emerald-950/20 border border-emerald-900/40 rounded-lg">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-1" />
                <p className="text-sm font-semibold">No Duplicate Candidates Detected</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  This venue appears unique within its municipality and spatial cluster.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/60 max-h-72 overflow-y-auto">
                {duplicates.map((c) => (
                  <div key={c.candidateId} className="py-3 flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-white">{c.candidateName}</h4>
                      <p className="text-xs text-slate-400">{c.candidateAddress}</p>
                      <span className="inline-block mt-1 text-[11px] font-medium text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/40">
                        {c.similarityReason} • {c.distanceMeters.toFixed(1)}m away
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-700">
              <button
                onClick={() => setDuplicateModalPlace(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Place Metadata Modal */}
      {editingPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-cyan-400" />
                Edit Venue Metadata
              </h3>
              <button onClick={() => setEditingPlace(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400">Venue Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400">Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    {CATEGORY_OPTIONS.filter((c) => c !== 'ALL').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400">City</label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Official Street Address</label>
                <input
                  type="text"
                  required
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400">Contact Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400">Website URL</label>
                  <input
                    type="text"
                    value={editForm.website}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Audit Justification</label>
                <textarea
                  value={editForm.reason}
                  onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                  placeholder="Official municipal evidence or correction source..."
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingPlace(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Save Corrections'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
