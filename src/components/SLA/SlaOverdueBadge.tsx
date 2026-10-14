import React from 'react';
import { Clock, Flag, ShieldCheck } from 'lucide-react';
import type { CandidateProfile } from '../../types/candidate';
import type { CandidateSlaEvaluation, SlaSettings } from '../../types/sla';
import { slaService } from '../../services/slaService';

export interface SlaOverdueBadgeProps {
  candidate?: CandidateProfile;
  evaluation?: CandidateSlaEvaluation;
  settings?: SlaSettings;
  size?: 'xs' | 'sm' | 'md';
  variant?: 'badge' | 'chip';
  showOnTrack?: boolean; // Nếu false, chỉ hiện khi OVERDUE hoặc WARNING
  className?: string;
}

export const SlaOverdueBadge: React.FC<SlaOverdueBadgeProps> = ({
  candidate,
  evaluation: propEvaluation,
  settings,
  size = 'xs',
  variant = 'badge',
  showOnTrack = false,
  className = '',
}) => {
  const evalData: CandidateSlaEvaluation | null =
    propEvaluation ||
    (candidate ? slaService.calculateCandidateSla(candidate, settings) : null);

  if (!evalData) return null;

  // Nếu là EXEMPT hoặc (ON_TRACK mà showOnTrack = false) thì không hiển thị để giao diện gọn gàng
  if (evalData.status === 'EXEMPT') return null;
  if (evalData.status === 'ON_TRACK' && !showOnTrack) return null;

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
  }[size];

  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
  }[size];

  if (evalData.status === 'OVERDUE') {
    return (
      <span
        data-testid={`sla-badge-overdue-${evalData.candidateId}`}
        title={`Hồ sơ nằm tại giai đoạn "${evalData.stageName}" đã ${evalData.daysInStage} ngày, vượt ngưỡng SLA ${evalData.thresholdDays} ngày.`}
        className={`inline-flex items-center gap-1 font-semibold rounded-md border shadow-2xs transition-all ${
          variant === 'chip' ? 'rounded-full' : 'rounded-md'
        } bg-rose-50 text-rose-700 border-rose-300 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 ${sizeClasses} ${className}`}
      >
        <Flag className={`${iconSizes} text-rose-600 fill-rose-100 shrink-0`} />
        <span>{evalData.badgeText}</span>
      </span>
    );
  }

  if (evalData.status === 'WARNING') {
    return (
      <span
        data-testid={`sla-badge-warning-${evalData.candidateId}`}
        title={`Cảnh báo: Hồ sơ sắp chạm ngưỡng SLA ${evalData.thresholdDays} ngày (đã nằm ${evalData.daysInStage} ngày).`}
        className={`inline-flex items-center gap-1 font-medium rounded-md border transition-all ${
          variant === 'chip' ? 'rounded-full' : 'rounded-md'
        } bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 ${sizeClasses} ${className}`}
      >
        <Clock className={`${iconSizes} text-amber-600 shrink-0`} />
        <span>{evalData.badgeText}</span>
      </span>
    );
  }

  // ON_TRACK (khi showOnTrack = true)
  return (
    <span
      data-testid={`sla-badge-ontrack-${evalData.candidateId}`}
      title={`Hồ sơ đúng hạn SLA: Đã xử lý ${evalData.daysInStage}/${evalData.thresholdDays} ngày.`}
      className={`inline-flex items-center gap-1 font-medium rounded-md border transition-all ${
        variant === 'chip' ? 'rounded-full' : 'rounded-md'
      } bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 ${sizeClasses} ${className}`}
    >
      <ShieldCheck className={`${iconSizes} text-emerald-600 shrink-0`} />
      <span>{evalData.badgeText}</span>
    </span>
  );
};

export default SlaOverdueBadge;
