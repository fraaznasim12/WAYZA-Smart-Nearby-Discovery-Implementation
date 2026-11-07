import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import { AdminUserSummary } from '../../types/admin';
import { UserRole } from '../../types/auth';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Search,
  Filter,
  Shield,
  UserCheck,
  UserX,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  FileText,
  Scale,
  X,
} from 'lucide-react';

const ROLE_OPTIONS: UserRole[] = [
  'ROLE_USER',
  'ROLE_CONTRIBUTOR',
  'ROLE_BUSINESS',
  'ROLE_BUSINESS_OWNER',
  'ROLE_ADMIN',
];

export const AdminUsersPage: React.FC = () => {
  const { user: currentAdmin } = useAuth();

  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Action Modals
  const [selectedUser, setSelectedUser] = useState<AdminUserSummary | null>(null);
  const [modalType, setModalType] = useState<'STATUS' | 'ROLE' | 'DETAILS' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [targetRole, setTargetRole] = useState<UserRole>('ROLE_CONTRIBUTOR');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getUsers({
        search: search || undefined,
        role: roleFilter !== 'ALL' ? (roleFilter as UserRole) : undefined,
        isEnabled: statusFilter === 'ACTIVE' ? true : statusFilter === 'INACTIVE' ? false : undefined,
        page,
        size: 15,
      });
      setUsers(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch user accounts');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStatusToggle = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    setError(null);
    try {
      const newStatus = !selectedUser.isEnabled;
      await adminService.updateUserStatus(selectedUser.id, newStatus, actionReason);
      setSuccess(
        `User ${selectedUser.fullName} (${selectedUser.email}) was successfully ${
          newStatus ? 'activated' : 'deactivated'
        }.`
      );
      setModalType(null);
      setActionReason('');
      fetchUsers();
    } catch (err: any) {
      setError(err?.message || 'Failed to update user account status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    setError(null);
    try {
      await adminService.updateUserRole(selectedUser.id, targetRole, actionReason);
      setSuccess(
        `User ${selectedUser.fullName} (${selectedUser.email}) role updated to ${targetRole}.`
      );
      setModalType(null);
      setActionReason('');
      fetchUsers();
    } catch (err: any) {
      setError(err?.message || 'Failed to update user role');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            User Management
          </h1>
          <p className="text-sm text-slate-400">
            Control registered users, account activation status, and role privileges with complete audit logging.
          </p>
        </div>
        <div className="text-xs text-slate-400">
          Total Users: <strong className="text-emerald-400">{totalElements}</strong>
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

      {/* Controls Bar: Search & Filters */}
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
            placeholder="Search by name or email address..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(0);
              }}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Roles</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r.replace('ROLE_', '')}
                </option>
              ))}
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Accounts</option>
            <option value="INACTIVE">Deactivated Accounts</option>
          </select>

          <button
            onClick={fetchUsers}
            className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
            title="Reload users"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
            <p className="text-sm">Fetching user directory...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-medium">No users matched your query.</p>
            <p className="text-xs text-slate-500">Try adjusting the search filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-xs uppercase text-slate-400 border-b border-slate-700/80 tracking-wider">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submissions</th>
                  <th className="px-4 py-3">Registered</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {users.map((u) => {
                  const isSelf = currentAdmin?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-emerald-400">
                            {u.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-white flex items-center gap-1.5">
                              {u.fullName}
                              {isSelf && (
                                <span className="px-1.5 py-0.2 text-[10px] rounded bg-emerald-500/20 text-emerald-300 font-bold">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            u.role === 'ROLE_ADMIN'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : u.role === 'ROLE_BUSINESS_OWNER' || u.role === 'ROLE_BUSINESS'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : u.role === 'ROLE_CONTRIBUTOR'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          {u.role.replace('ROLE_', '')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            u.isEnabled
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}
                        >
                          {u.isEnabled ? (
                            <>
                              <UserCheck className="w-3 h-3" /> Active
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3" /> Deactivated
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span title="Reports submitted" className="flex items-center gap-1">
                            <FileText className="w-3 h-3 text-slate-500" />
                            {u.reportsCount}
                          </span>
                          <span title="Disputes filed" className="flex items-center gap-1">
                            <Scale className="w-3 h-3 text-slate-500" />
                            {u.disputesCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {new Date(u.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setModalType('ROLE');
                              setTargetRole(u.role);
                              setActionReason('');
                            }}
                            disabled={isSelf}
                            className="px-2.5 py-1 text-xs font-medium rounded bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            Role
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setModalType('STATUS');
                              setActionReason('');
                            }}
                            disabled={isSelf}
                            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                              u.isEnabled
                                ? 'bg-red-900/40 hover:bg-red-900/60 text-red-300 border border-red-800/40'
                                : 'bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/40'
                            }`}
                          >
                            {u.isEnabled ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-slate-900/60 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {page + 1} of {totalPages} ({totalElements} users)
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

      {/* Confirmation Modal for Role Modification */}
      {modalType === 'ROLE' && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              Change User Role
            </h3>
            <p className="text-xs text-slate-300">
              Modifying privileges for <strong>{selectedUser.fullName}</strong> ({selectedUser.email}).
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">Assign New Role</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as UserRole)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">Audit Reason</label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="State the justification for this administrative change..."
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setModalType(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleChange}
                disabled={actionLoading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Updating...' : 'Confirm Role Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Status Toggle */}
      {modalType === 'STATUS' && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              {selectedUser.isEnabled ? 'Deactivate User Account' : 'Reactivate User Account'}
            </h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to {selectedUser.isEnabled ? 'deactivate' : 'reactivate'} the account for{' '}
              <strong>{selectedUser.fullName}</strong> ({selectedUser.email})?
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">Administrative Reason</label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="State the reason for deactivation or activation..."
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setModalType(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusToggle}
                disabled={actionLoading}
                className={`px-4 py-2 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                  selectedUser.isEnabled
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {actionLoading ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
