import React from 'react';
import { CheckCircle2, XCircle, HelpCircle, Clock } from 'lucide-react';
import { FeatureStatus } from '../../types/accessibility';

interface StatusBadgeProps {
  status: FeatureStatus;
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className = '' }) => {
  const config = {
    AVAILABLE: {
      text: label || 'Available',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-emerald-600/20',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />,
      ariaLabel: `Status: Available - ${label || 'Feature confirmed accessible and verified'}`,
    },
    NOT_AVAILABLE: {
      text: label || 'Not Available',
      bg: 'bg-rose-50 text-rose-800 border-rose-300 ring-rose-600/20',
      icon: <XCircle className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />,
      ariaLabel: `Status: Not Available - ${label || 'Feature confirmed inaccessible or absent'}`,
    },
    UNKNOWN: {
      text: label || 'Unknown',
      bg: 'bg-slate-100 text-slate-700 border-slate-300 ring-slate-600/20',
      icon: <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />,
      ariaLabel: `Status: Unknown - ${label || 'No audit reports recorded yet'}`,
    },
    NOT_VERIFIED: {
      text: label || 'Needs Verification',
      bg: 'bg-amber-50 text-amber-900 border-amber-300 ring-amber-600/20',
      icon: <Clock className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />,
      ariaLabel: `Status: Needs Verification - ${label || 'Report is pending or exceeds 180 days freshness'}`,
    },
  }[status];

  return (
    <span
      role="status"
      aria-label={config.ariaLabel}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-xs transition-colors ${config.bg} ${className}`}
    >
      {config.icon}
      <span>{config.text}</span>
    </span>
  );
};
