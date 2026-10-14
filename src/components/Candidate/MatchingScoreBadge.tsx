import React from 'react';
import { CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import {
  getMatchingScoreColorClass,
  getMatchingStatusBadgeConfig,
} from '../../utils/candidateMatchingHelper';

export interface MatchingScoreBadgeProps {
  totalMatchingScore: number;
  isOverallPassed: boolean;
  variant?: 'compact' | 'standard' | 'detailed';
  showStatusFlag?: boolean;
  className?: string;
}

/**
 * Component hiển thị Huy hiệu Điểm tổng phù hợp kèm cờ Đạt / Không đạt (AC 1 & AC 2)
 */
export const MatchingScoreBadge: React.FC<MatchingScoreBadgeProps> = ({
  totalMatchingScore,
  isOverallPassed,
  variant = 'standard',
  showStatusFlag = true,
  className = '',
}) => {
  const scoreColorConfig = getMatchingScoreColorClass(totalMatchingScore);
  const statusBadgeConfig = getMatchingStatusBadgeConfig(isOverallPassed);

  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 ${className}`}
        aria-label={`Điểm phù hợp: ${totalMatchingScore}/100, Trạng thái: ${statusBadgeConfig.label}`}
      >
        {/* Điểm số rút gọn */}
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold ${scoreColorConfig.badgeContainerClass}`}
        >
          <Sparkles className="h-3 w-3 shrink-0" />
          <span>{`${totalMatchingScore}%`}</span>
        </span>

        {/* Cờ Đạt / Không đạt */}
        {showStatusFlag && (
          <span
            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${statusBadgeConfig.containerClass}`}
          >
            {isOverallPassed ? (
              <CheckCircle2 className={`h-3 w-3 shrink-0 ${statusBadgeConfig.iconClass}`} />
            ) : (
              <XCircle className={`h-3 w-3 shrink-0 ${statusBadgeConfig.iconClass}`} />
            )}
            <span>{statusBadgeConfig.label}</span>
          </span>
        )}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div
        className={`flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-2xs dark:border-gray-800 dark:bg-gray-850 ${className}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Điểm tổng phù hợp
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${scoreColorConfig.badgeContainerClass}`}
            >
              {scoreColorConfig.scoreGradeText}
            </span>
          </div>

          {showStatusFlag && (
            <span
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${statusBadgeConfig.containerClass}`}
            >
              {isOverallPassed ? (
                <CheckCircle2 className={`h-3.5 w-3.5 ${statusBadgeConfig.iconClass}`} />
              ) : (
                <XCircle className={`h-3.5 w-3.5 ${statusBadgeConfig.iconClass}`} />
              )}
              <span>{statusBadgeConfig.label}</span>
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-extrabold ${scoreColorConfig.scoreTextClass}`}>
            {totalMatchingScore}
          </span>
          <span className="text-sm font-semibold text-gray-400">/ 100</span>
        </div>

        {/* Thanh tiến trình phần trăm trực quan */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
          <div
            className={`h-full transition-all duration-500 ${scoreColorConfig.progressBarClass}`}
            style={{ width: `${Math.min(100, Math.max(0, totalMatchingScore))}%` }}
          />
        </div>
      </div>
    );
  }

  // Variant 'standard' (Mặc định cho danh sách ứng viên)
  return (
    <div
      className={`inline-flex items-center gap-1.5 ${className}`}
      aria-label={`Điểm phù hợp: ${totalMatchingScore}/100, Trạng thái: ${statusBadgeConfig.label}`}
    >
      <span
        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${scoreColorConfig.badgeContainerClass}`}
      >
        <Sparkles className="h-3.5 w-3.5 shrink-0" />
        <span>{`${totalMatchingScore}/100`}</span>
      </span>

      {showStatusFlag && (
        <span
          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold ${statusBadgeConfig.containerClass}`}
        >
          {isOverallPassed ? (
            <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${statusBadgeConfig.iconClass}`} />
          ) : (
            <XCircle className={`h-3.5 w-3.5 shrink-0 ${statusBadgeConfig.iconClass}`} />
          )}
          <span>{statusBadgeConfig.label}</span>
        </span>
      )}
    </div>
  );
};

export default MatchingScoreBadge;
