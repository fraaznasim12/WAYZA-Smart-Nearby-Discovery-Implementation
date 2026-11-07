import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Building2,
  ShieldAlert,
  FileText,
  Clock,
  Filter,
  ExternalLink,
  Settings,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from 'lucide-react';
import { notificationService, PageResult } from '../services/notificationService';
import { NotificationItem, NotificationType } from '../types/notification';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res: PageResult<NotificationItem> = await notificationService.getNotifications(
        unreadOnly ? false : undefined,
        page,
        15
      );
      setNotifications(res.content || []);
      if (res.page) {
        setTotalPages(res.page.totalPages || 1);
        setTotalElements(res.page.totalElements || 0);
      } else {
        setTotalPages(res.totalPages || 1);
        setTotalElements(res.totalElements || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setIsLoading(false);
    }
  }, [unreadOnly, page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification read', err);
    }
  };

  const handleMarkAllRead = async () => {
    setIsUpdating(true);
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
    } catch (err) {
      console.error('Failed to mark all notifications read', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNavigateToEntity = (item: NotificationItem) => {
    if (!item.isRead) {
      handleMarkAsRead(item.id);
    }

    if (item.relatedEntityType === 'PLACE' && item.relatedEntityId) {
      navigate(`/places/${item.relatedEntityId}`);
    } else if (item.relatedEntityType === 'REPORT') {
      navigate('/reports');
    } else if (item.relatedEntityType === 'DISPUTE') {
      navigate('/my-disputes');
    } else if (item.relatedEntityType === 'CLAIM') {
      navigate('/business');
    } else if (item.relatedEntityType === 'USER') {
      navigate('/dashboard');
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'REPORT_APPROVED':
      case 'BUSINESS_CLAIM_APPROVED':
        return <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />;
      case 'REPORT_REJECTED':
      case 'BUSINESS_CLAIM_REJECTED':
        return <XCircle className="w-5 h-5 text-rose-600 shrink-0" />;
      case 'ADDITIONAL_INFORMATION_REQUESTED':
        return <HelpCircle className="w-5 h-5 text-amber-600 shrink-0" />;
      case 'DISPUTE_UPDATED':
      case 'DISPUTE_RESOLVED':
      case 'NEW_DISPUTE':
        return <AlertTriangle className="w-5 h-5 text-purple-600 shrink-0" />;
      case 'ACCOUNT_SECURITY_ALERT':
        return <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />;
      case 'NEW_LOCATION_REPORT':
      case 'BUSINESS_OWNERSHIP_UPDATED':
      case 'NEW_BUSINESS_CLAIM':
        return <Building2 className="w-5 h-5 text-sky-600 shrink-0" />;
      default:
        return <FileText className="w-5 h-5 text-teal-600 shrink-0" />;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (typeFilter === 'REPORTS') {
      return item.type.includes('REPORT') || item.relatedEntityType === 'REPORT';
    }
    if (typeFilter === 'DISPUTES') {
      return item.type.includes('DISPUTE') || item.relatedEntityType === 'DISPUTE';
    }
    if (typeFilter === 'BUSINESS') {
      return item.type.includes('CLAIM') || item.type.includes('OWNERSHIP') || item.relatedEntityType === 'CLAIM';
    }
    if (typeFilter === 'SECURITY') {
      return item.type.includes('SECURITY') || item.relatedEntityType === 'USER';
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F7F9FC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F5F1] border border-[#0F766E]/20 flex items-center justify-center text-[#0F766E] shadow-2xs">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notification Center</h1>
              <p className="text-sm text-slate-500">
                Real-time updates on reports, disputes, venue claims, and platform activity.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={isUpdating || notifications.every((n) => n.isRead)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-teal-600" />
              <span>Mark all read</span>
            </button>

            <Link
              to="/notifications/settings"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Preferences</span>
            </Link>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          {/* Read / Unread Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setUnreadOnly(false);
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !unreadOnly ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => {
                setUnreadOnly(true);
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                unreadOnly ? 'bg-white text-teal-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unread Only
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter notifications by category"
              className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="REPORTS">Accessibility Reports</option>
              <option value="DISPUTES">Disputes & Decisions</option>
              <option value="BUSINESS">Business & Claims</option>
              <option value="SECURITY">Security & Account</option>
            </select>
          </div>
        </div>

        {/* Notification List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200">
              <div className="inline-block w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm font-semibold">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200">
              <Inbox className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-800">No notifications found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                {unreadOnly
                  ? "You don't have any unread notifications. Check back later for activity updates!"
                  : "You haven't received any notifications matching your selected criteria."}
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleNavigateToEntity(item)}
                className={`bg-white rounded-2xl p-5 border transition-all duration-150 cursor-pointer hover:shadow-md ${
                  !item.isRead
                    ? 'border-teal-300 bg-teal-50/20 shadow-2xs'
                    : 'border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-slate-100/80 shrink-0 mt-0.5">
                    {getNotificationIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm ${!item.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                          {item.title}
                        </h4>
                        {!item.isRead && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                            New
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatRelativeTime(item.createdAt)}</span>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      {item.message}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        {item.relatedEntityType && (
                          <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-md bg-slate-100 text-slate-600 uppercase tracking-wider">
                            {item.relatedEntityType}
                          </span>
                        )}
                        <span className="text-xs text-slate-600 font-mono">
                          {item.type.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {!item.isRead && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkAsRead(item.id, e)}
                            className="text-xs font-semibold text-teal-700 hover:text-teal-900 px-2 py-1 rounded-md hover:bg-teal-50 transition-colors"
                          >
                            Mark Read
                          </button>
                        )}
                        {item.relatedEntityType && (
                          <button
                            type="button"
                            className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200">
            <span className="text-xs text-slate-500">
              Showing page {page + 1} of {totalPages} ({totalElements} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;

