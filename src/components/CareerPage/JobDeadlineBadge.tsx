import React from 'react';
import { Clock, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import {
  checkJobDeadlineStatus,
  type DeadlineCategory,
} from '../../services/jobPostingService';

export interface JobDeadlineBadgeProps {
  deadline?: string;
  referenceDate?: Date;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
  customText?: string;
}

export const JobDeadlineBadge: React.FC<JobDeadlineBadgeProps> = ({
  deadline,
  referenceDate,
  size = 'md',
  showIcon = true,
  className = '',
  customText,
}) => {
  const deadlineInfo = checkJobDeadlineStatus(deadline, referenceDate);
  const { status, badgeText } = deadlineInfo;

  // Cấu hình giao diện chuẩn theo AC1:
  // - Open: Xanh lá (emerald)
  // - Closing Soon: Cam/Vàng (amber/orange)
  // - Expired: Xám hoặc Đỏ (rose/slate)
  const getBadgeStyles = (cat: DeadlineCategory) => {
    switch (cat) {
      case 'EXPIRED':
        return {
          container: 'bg-rose-50 text-rose-700 border-rose-200/80',
          iconColor: 'text-rose-600',
          icon: XCircle,
          label: customText || badgeText,
        };
      case 'CLOSING_SOON':
        return {
          container: 'bg-amber-50 text-amber-700 border-amber-200/80 animate-pulse',
          iconColor: 'text-amber-600',
          icon: AlertTriangle,
          label: customText || badgeText,
        };
      case 'OPEN':
      default:
        return {
          container: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          iconColor: 'text-emerald-600',
          icon: deadline ? Clock : CheckCircle2,
          label: customText || badgeText,
        };
    }
  };

  const currentStyle = getBadgeStyles(status);
  const IconComponent = currentStyle.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 rounded-md font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 rounded-lg font-semibold',
    lg: 'text-sm px-3 py-1.5 gap-2 rounded-xl font-bold',
  }[size];

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  }[size];

  return (
    <span
      data-testid="job-deadline-badge"
      data-status={status}
      className={`inline-flex items-center border transition-colors shadow-2xs ${sizeClasses} ${currentStyle.container} ${className}`}
    >
      {showIcon && (
        <IconComponent
          data-testid="job-deadline-badge-icon"
          className={`${iconSizes} ${currentStyle.iconColor} shrink-0`}
        />
      )}
      <span>{currentStyle.label}</span>
    </span>
  );
};

export default JobDeadlineBadge;
