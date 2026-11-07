import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Mail,
  ArrowLeft,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sliders,
} from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { NotificationPreference } from '../types/notification';

export const NotificationSettingsPage: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setIsLoading(true);
    try {
      const data = await notificationService.getPreferences();
      setPreferences(data);
    } catch {
      setSaveStatus({ type: 'error', message: 'Failed to load preferences from server.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleInApp = (type: string) => {
    setPreferences((prev) =>
      prev.map((p) => (p.type === type ? { ...p, inAppEnabled: !p.inAppEnabled } : p))
    );
  };

  const handleToggleEmail = (type: string) => {
    setPreferences((prev) =>
      prev.map((p) => (p.type === type ? { ...p, emailEnabled: !p.emailEnabled } : p))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const payload = preferences.map((p) => ({
        type: p.type,
        inAppEnabled: p.inAppEnabled,
        emailEnabled: p.emailEnabled,
      }));
      const updated = await notificationService.updatePreferences(payload);
      setPreferences(updated);
      setSaveStatus({ type: 'success', message: 'Your notification preferences have been saved!' });
      setTimeout(() => setSaveStatus(null), 4000);
    } catch {
      setSaveStatus({ type: 'error', message: 'Unable to save preferences. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setPreferences((prev) =>
      prev.map((p) => ({
        ...p,
        inAppEnabled: true,
        emailEnabled: false,
      }))
    );
  };

  // Group notifications into categories
  const userNotifications = preferences.filter(
    (p) =>
      p.type.startsWith('REPORT_') ||
      p.type.startsWith('ADDITIONAL_') ||
      p.type.startsWith('DISPUTE_') ||
      p.type === 'ACCESSIBILITY_PROFILE_UPDATED' ||
      p.type === 'ACCOUNT_SECURITY_ALERT'
  );

  const businessNotifications = preferences.filter(
    (p) =>
      p.type.startsWith('BUSINESS_') ||
      p.type === 'NEW_LOCATION_REPORT' ||
      p.type === 'ACCESSIBILITY_PROPOSAL_REVIEWED'
  );

  const adminNotifications = preferences.filter(
    (p) =>
      p.type.startsWith('NEW_ACCESSIBILITY_') ||
      p.type === 'NEW_BUSINESS_CLAIM' ||
      p.type === 'NEW_DISPUTE' ||
      p.type === 'MODERATION_REQUIRED'
  );

  const renderPreferenceGroup = (
    title: string,
    description: string,
    items: NotificationPreference[]
  ) => {
    if (items.length === 0) return null;

    return (
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 bg-slate-50 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>

        <div className="divide-y divide-slate-100">
          {items.map((item) => (
            <div
              key={item.type}
              className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800">{item.defaultTitle}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  {item.defaultSummary}
                </p>
                <span className="inline-block mt-1 text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {item.type}
                </span>
              </div>

              <div className="flex items-center gap-6 self-end sm:self-center shrink-0">
                {/* In-App Toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={item.inAppEnabled}
                    onChange={() => handleToggleInApp(item.type)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-hidden peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600 relative" />
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Bell className="w-3.5 h-3.5 text-teal-600" />
                    <span>In-App</span>
                  </span>
                </label>

                {/* Email Toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={item.emailEnabled}
                    onChange={() => handleToggleEmail(item.type)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-hidden peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600 relative" />
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-sky-600" />
                    <span>Email</span>
                  </span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Link & Header */}
        <div className="flex items-center gap-2">
          <Link
            to="/notifications"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Notifications</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-2xs">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notification Settings</h1>
              <p className="text-sm text-slate-500">
                Configure your preferred delivery channels for platform events and alerts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Defaults</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {saveStatus && (
          <div
            className={`p-4 rounded-xl flex items-center gap-2 text-sm font-semibold border ${
              saveStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {saveStatus.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{saveStatus.message}</span>
          </div>
        )}

        {/* Settings Groups */}
        {isLoading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200">
            <div className="inline-block w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm font-semibold">Loading preferences...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {renderPreferenceGroup(
              'User & Contributor Notifications',
              'Alerts on your report status, requests for more info, and dispute adjudications.',
              userNotifications
            )}

            {renderPreferenceGroup(
              'Business Owner Notifications',
              'Updates regarding your venue ownership claims and community observations at your locations.',
              businessNotifications
            )}

            {renderPreferenceGroup(
              'Platform Moderation & Administrative Alerts',
              'High-priority notices regarding pending community reports, disputes, and moderation items.',
              adminNotifications
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSettingsPage;

