import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  ExternalLink,
  Settings,
  ShieldAlert,
  CheckCircle,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Building2,
  FileText,
  Clock,
} from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { NotificationItem, NotificationType } from '../../types/notification';

export const NotificationBell: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [recentNotifications, setRecentNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load unread counter
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationService.getUnreadCount();
      setUnreadCount(res.unreadCount);
    } catch {
      // Quiet fail if network temporarily unavailable
    }
  }, []);

  // Load recent notifications when dropdown opens
  const fetchRecentNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await notificationService.getNotifications(undefined, 0, 5);
      setRecentNotifications(res.content || []);
    } catch {
      // Quiet fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  // SSE Real-time subscription
  useEffect(() => {
    fetchUnreadCount();

    const unsubscribe = notificationService.subscribeToStream((newNotif: NotificationItem) => {
      setUnreadCount((prev) => prev + 1);
      setRecentNotifications((prev) => [newNotif, ...prev.slice(0, 4)]);
    });

    return () => {
      unsubscribe();
    };
  }, [fetchUnreadCount]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      fetchRecentNotifications();
      fetchUnreadCount();
    }
    setIsOpen((prev) => !prev);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setRecentNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true, readAt: new Date().toISOString() }))
      );
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      try {
        await notificationService.markAsRead(item.id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setRecentNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }

    setIsOpen(false);

    // Route navigation based on entity
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
    } else {
      navigate('/notifications');
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'REPORT_APPROVED':
      case 'BUSINESS_CLAIM_APPROVED':
        return <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'REPORT_REJECTED':
      case 'BUSINESS_CLAIM_REJECTED':
        return <XCircle className="w-4 h-4 text-rose-600 shrink-0" />;
      case 'ADDITIONAL_INFORMATION_REQUESTED':
        return <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'DISPUTE_UPDATED':
      case 'DISPUTE_RESOLVED':
      case 'NEW_DISPUTE':
        return <AlertTriangle className="w-4 h-4 text-purple-600 shrink-0" />;
      case 'ACCOUNT_SECURITY_ALERT':
        return <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'NEW_LOCATION_REPORT':
      case 'BUSINESS_OWNERSHIP_UPDATED':
      case 'NEW_BUSINESS_CLAIM':
        return <Building2 className="w-4 h-4 text-sky-600 shrink-0" />;
      default:
        return <FileText className="w-4 h-4 text-teal-600 shrink-0" />;
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
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-label={`Notifications (${unreadCount} unread)`}
        className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-teal-500"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-800">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-teal-100 text-teal-800 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark read</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-6 text-center text-sm text-slate-500">
                <div className="inline-block w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-2" />
                <p>Loading notifications...</p>
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">All caught up!</p>
                <p className="text-xs text-slate-500 mt-0.5">No notifications right now.</p>
              </div>
            ) : (
              recentNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                    !item.isRead ? 'bg-teal-50/40' : ''
                  }`}
                >
                  <div className="mt-0.5">{getNotificationIcon(item.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs truncate ${!item.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                        {item.title}
                      </p>
                      <span className="text-[10px] text-slate-600 shrink-0 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-xs">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-900"
            >
              <span>View all notifications</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <Link
              to="/notifications/settings"
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              title="Notification Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

