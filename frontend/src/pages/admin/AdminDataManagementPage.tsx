import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import { DataManagementOverview, DataImportHistory } from '../../types/admin';
import {
  Database,
  RefreshCw,
  CheckCircle2,
  Play,
  MapPin,
  Clock,
  Server,
  Activity,
  X,
} from 'lucide-react';

const REGIONAL_PRESETS = [
  {
    name: 'Maharashtra (Mumbai South)',
    south: 18.90,
    west: 72.80,
    north: 19.05,
    east: 72.90,
    categories: ['HOSPITAL', 'TRANSIT_HUB', 'COLLEGE'],
  },
  {
    name: 'Delhi NCR (Central)',
    south: 28.58,
    west: 77.18,
    north: 28.66,
    east: 77.26,
    categories: ['HOSPITAL', 'TRANSIT_HUB', 'GOVERNMENT_OFFICE'],
  },
  {
    name: 'Karnataka (Bengaluru Central)',
    south: 12.95,
    west: 77.56,
    north: 13.02,
    east: 77.63,
    categories: ['HOSPITAL', 'TRANSIT_HUB', 'SHOPPING_MALL'],
  },
  {
    name: 'Maharashtra (Pune Central)',
    south: 18.50,
    west: 73.82,
    north: 18.56,
    east: 73.88,
    categories: ['HOSPITAL', 'COLLEGE', 'TRANSIT_HUB'],
  },
];

export const AdminDataManagementPage: React.FC = () => {
  const [overview, setOverview] = useState<DataManagementOverview | null>(null);
  const [history, setHistory] = useState<DataImportHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Regional import modal/form
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [customRegion, setCustomRegion] = useState(REGIONAL_PRESETS[0].name);
  const [south, setSouth] = useState(REGIONAL_PRESETS[0].south);
  const [west, setWest] = useState(REGIONAL_PRESETS[0].west);
  const [north, setNorth] = useState(REGIONAL_PRESETS[0].north);
  const [east, setEast] = useState(REGIONAL_PRESETS[0].east);
  const [importing, setImporting] = useState(false);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getDataManagementOverview();
      setOverview(data);
      const hist = await adminService.getDataImportHistory(0, 10);
      setHistory(hist.content);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch geographical data management details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handlePresetChange = (idx: number) => {
    setSelectedPresetIndex(idx);
    const p = REGIONAL_PRESETS[idx];
    setCustomRegion(p.name);
    setSouth(p.south);
    setWest(p.west);
    setNorth(p.north);
    setEast(p.east);
  };

  const handleRunImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setImporting(true);
    setError(null);
    try {
      const result = await adminService.triggerRegionalImport({
        region: customRegion,
        south,
        west,
        north,
        east,
      });

      setSuccess(
        `Import complete for "${customRegion}": ${result.importedCount} new venues imported, ${result.skippedCount} duplicates preserved.`
      );
      fetchOverview();
    } catch (err: any) {
      setError(err?.message || 'Regional import operation encountered an error');
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-400" />
        <p className="text-sm">Loading geographical data management metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-emerald-400" />
            Geographical Data Management
          </h1>
          <p className="text-sm text-slate-400">
            Monitor OpenStreetMap sync pipelines, rate limits, bounded regional ingestion, and duplicate provenance.
          </p>
        </div>
        <button
          onClick={fetchOverview}
          className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Status
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

      {/* Provider Status KPIs */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-slate-800/80 border border-slate-700 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Geodata Provider
              </span>
              <Server className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-lg font-bold text-white">{overview.providerName}</div>
            <div className="pt-2 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  overview.providerAvailable
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    overview.providerAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                {overview.providerAvailable ? 'Reachable & Online' : 'Rate Limited / Offline'}
              </span>
            </div>
          </div>

          <div className="p-5 bg-slate-800/80 border border-slate-700 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Synchronized
              </span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">{overview.totalImportedRecords}</div>
            <p className="text-xs text-slate-400">Total venues in PostGIS spatial database</p>
          </div>

          <div className="p-5 bg-slate-800/80 border border-slate-700 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Last Ingestion
              </span>
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-sm font-semibold text-white">
              {overview.lastImportAt ? new Date(overview.lastImportAt).toLocaleString() : 'System Seed'}
            </div>
            <p className="text-xs text-slate-400">Idempotent deduplication active</p>
          </div>
        </div>
      )}

      {/* Trigger Bounded Regional Import Tool */}
      <div className="p-6 bg-slate-800/80 border border-slate-700 rounded-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-400" />
              Initiate Bounded Regional Import
            </h2>
            <p className="text-xs text-slate-400">
              Query the Overpass API for real Indian public facilities within a bounding box. Existing records are preserved.
            </p>
          </div>
        </div>

        <form onSubmit={handleRunImport} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">
              Select Regional Preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {REGIONAL_PRESETS.map((p, idx) => (
                <button
                  type="button"
                  key={p.name}
                  onClick={() => handlePresetChange(idx)}
                  className={`p-2.5 rounded-lg text-left text-xs transition-colors border ${
                    selectedPresetIndex === idx
                      ? 'bg-emerald-950/40 border-emerald-500 text-white font-semibold'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 mb-1" />
                  <div className="truncate">{p.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <div>
              <label className="text-[11px] font-mono text-slate-400">South (Min Lat)</label>
              <input
                type="number"
                step="0.0001"
                required
                value={south}
                onChange={(e) => setSouth(parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-slate-400">West (Min Lng)</label>
              <input
                type="number"
                step="0.0001"
                required
                value={west}
                onChange={(e) => setWest(parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-slate-400">North (Max Lat)</label>
              <input
                type="number"
                step="0.0001"
                required
                value={north}
                onChange={(e) => setNorth(parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-slate-400">East (Max Lng)</label>
              <input
                type="number"
                step="0.0001"
                required
                value={east}
                onChange={(e) => setEast(parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500">
              * Max bounding box diagonal recommended &le; 25 km to respect Overpass API fair usage.
            </span>
            <button
              type="submit"
              disabled={importing}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {importing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Ingesting Geodata...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Start Regional Sync
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Historical Ingestion Audit Log */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            Ingestion & Synchronization History
          </h3>
        </div>

        {history.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No historical batch imports recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/60 uppercase text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Region & Bounding Box</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Imported</th>
                  <th className="px-4 py-3">Duplicates Skipped</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-700/30">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{h.regionName || 'Custom Bounding Box'}</div>
                      <div className="text-[11px] font-mono text-slate-500">{h.boundingBox}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{h.providerName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                          h.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {h.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-400">+{h.recordsImported}</td>
                    <td className="px-4 py-3 text-slate-400">{h.recordsSkipped}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(h.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
