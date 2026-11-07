import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import { AdminAuditLog } from '../../types/admin';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Clock,
  X,
} from 'lucide-react';

const RESOURCE_TYPES = [
  'ALL',
  'USER',
  'PLACE',
  'REPORT',
  'DISPUTE',
  'OBSERVATION',
  'CLAIM',
  'DATA_IMPORT',
  'SETTING',
];

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [resourceFilter, setResourceFilter] = useState('ALL');
  const [actionSearch, setActionSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getAuditLogs({
        resourceType: resourceFilter !== 'ALL' ? resourceFilter : undefined,
        action: actionSearch || undefined,
        page,
        size: 20,
      });
      setLogs(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch platform audit trail');
    } finally {
      setLoading(false);
    }
  }, [resourceFilter, actionSearch, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-400" />
            Platform Security & Audit Logs
          </h1>
          <p className="text-sm text-slate-400">
            Immutable chronicle of administrative interventions, role modifications, venue changes, and moderation rulings.
          </p>
        </div>
        <div className="text-xs text-slate-400">
          Recorded Audit Entries: <strong className="text-emerald-400">{totalElements}</strong>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-xl text-red-200 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white">
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
            value={actionSearch}
            onChange={(e) => {
              setActionSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search action name (e.g. ACTIVATE_USER, CHANGE_USER_ROLE)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={resourceFilter}
              onChange={(e) => {
                setResourceFilter(e.target.value);
                setPage(0);
              }}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-emerald-500"
            >
              {RESOURCE_TYPES.map((rt) => (
                <option key={rt} value={rt}>
                  Resource: {rt}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchLogs}
            className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
            title="Reload audit logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
            <p className="text-sm">Querying audit trail...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <History className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-medium">No audit entries found matching the filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/60 uppercase text-slate-400 border-b border-slate-700/80 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action & Resource</th>
                  <th className="px-4 py-3">Responsible Actor</th>
                  <th className="px-4 py-3">Audit Details & Metadata</th>
                  <th className="px-4 py-3 text-right">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-400">
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {new Date(log.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        <span className="inline-block px-2 py-0.5 rounded font-mono font-bold text-white bg-slate-900 border border-slate-700">
                          {log.action}
                        </span>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {log.resourceType} {log.resourceId ? `[${log.resourceId.substring(0, 8)}...]` : ''}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center font-bold text-[10px] text-emerald-400">
                          {log.actorName?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <div className="font-medium text-slate-200">{log.actorName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{log.actorEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-slate-300 max-w-md line-clamp-2">
                        {log.metadata || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.outcome === 'SUCCESS'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                      >
                        {log.outcome}
                      </span>
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
              Page {page + 1} of {totalPages} ({totalElements} recorded logs)
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
    </div>
  );
};
