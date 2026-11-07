import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import { PlatformSetting } from '../../types/admin';
import {
  Settings,
  RefreshCw,
  Save,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Server,
  Bell,
  Clock,
  X,
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Draft values edited by user
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getSettings();
      setSettings(data);
      const drafts: Record<string, string> = {};
      data.forEach((s) => {
        drafts[s.key] = s.value;
      });
      setDraftValues(drafts);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch platform configuration settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (key: string) => {
    const val = draftValues[key];
    if (val === undefined || !val.trim()) {
      setError(`Setting value for '${key}' cannot be blank.`);
      return;
    }
    setSavingKey(key);
    setError(null);
    try {
      await adminService.updateSetting(key, val.trim());
      setSuccess(`Setting '${key}' updated successfully.`);
      fetchSettings();
    } catch (err: any) {
      setError(err?.message || `Failed to update setting '${key}'`);
    } finally {
      setSavingKey(null);
    }
  };

  // Group settings by their category group
  const groupedSettings = settings.reduce<Record<string, PlatformSetting[]>>((acc, s) => {
    if (!acc[s.group]) acc[s.group] = [];
    acc[s.group].push(s);
    return acc;
  }, {});

  const getGroupIcon = (group: string) => {
    switch (group) {
      case 'STORAGE':
        return <Server className="w-4 h-4 text-cyan-400" />;
      case 'VERIFICATION':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'MODERATION':
        return <Sliders className="w-4 h-4 text-purple-400" />;
      case 'IMPORT':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'NOTIFICATIONS':
        return <Bell className="w-4 h-4 text-rose-400" />;
      default:
        return <Settings className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-400" />
            Platform Runtime Settings
          </h1>
          <p className="text-sm text-slate-400">
            Configure system storage thresholds, verification staleness periods, moderation automation, and provider limits.
          </p>
        </div>
        <button
          onClick={fetchSettings}
          className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reload
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

      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
          <p className="text-sm">Fetching configuration keys...</p>
        </div>
      ) : Object.keys(groupedSettings).length === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <Settings className="w-8 h-8 mx-auto mb-2 text-slate-600" />
          <p className="text-sm">No settings configured in the platform.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSettings).map(([group, items]) => (
            <div key={group} className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2 border-b border-slate-700 pb-2">
                {getGroupIcon(group)}
                {group} Configuration
              </h2>

              <div className="space-y-4">
                {items.map((setting) => {
                  const draftVal = draftValues[setting.key] ?? setting.value;
                  const hasChanged = draftVal !== setting.value;
                  const isSaving = savingKey === setting.key;

                  return (
                    <div
                      key={setting.key}
                      className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-0.5 flex-1">
                        <div className="font-mono text-xs font-bold text-emerald-300">
                          {setting.key}
                        </div>
                        <p className="text-xs text-slate-400">{setting.description}</p>
                        <div className="text-[10px] text-slate-500">
                          Last updated: {new Date(setting.updatedAt).toLocaleString()}
                          {setting.updatedByEmail && ` by ${setting.updatedByEmail}`}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <input
                          type="text"
                          value={draftVal}
                          onChange={(e) =>
                            setDraftValues({ ...draftValues, [setting.key]: e.target.value })
                          }
                          className="w-36 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          onClick={() => handleSave(setting.key)}
                          disabled={!hasChanged || isSaving}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {isSaving ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Save className="w-3.5 h-3.5" />
                          )}
                          Save
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
