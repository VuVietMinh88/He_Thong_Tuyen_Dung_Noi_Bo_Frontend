import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle,
  TrendingUp,
} from 'lucide-react';
import type { OnboardingProgressSummary } from '../../types/onboardingChecklist';
import { ONBOARDING_PHASES } from '../../types/onboardingChecklist';

export interface OnboardingProgressBarProps {
  summary: OnboardingProgressSummary;
}

export const OnboardingProgressBar: React.FC<OnboardingProgressBarProps> = ({ summary }) => {
  return (
    <div
      data-testid="onboarding-progress-overview"
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs space-y-4"
    >
      {/* 1. Header & % Hoàn thành tổng quan (AC 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Tiến độ tiếp nhận nhân viên mới (Onboarding Progress)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Hoàn thành các nhiệm vụ cốt lõi để sẵn sàng làm việc chính thức
            </p>
          </div>
        </div>

        {/* Tỷ lệ hoàn thành % */}
        <div className="flex items-baseline gap-2 self-start sm:self-auto">
          <span
            data-testid="text-progress-percentage"
            className="text-2xl font-black text-indigo-600 dark:text-indigo-400"
          >
            {summary.percentage}%
          </span>
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            {`(${summary.completedTasks}/${summary.totalTasks} đầu việc)`}
          </span>
        </div>
      </div>

      {/* 2. Thanh tiến trình trực quan (Visual Progress Bar - AC 1) */}
      <div className="relative">
        <div
          data-testid="progress-bar-container"
          className="h-3 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden shadow-inner flex"
          role="progressbar"
          aria-valuenow={summary.percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            data-testid="progress-bar-fill"
            style={{ width: `${summary.percentage}%` }}
            className={`h-full transition-all duration-500 ease-out rounded-full ${
              summary.percentage === 100
                ? 'bg-emerald-500'
                : summary.percentage >= 50
                ? 'bg-gradient-to-r from-indigo-500 to-emerald-500'
                : 'bg-gradient-to-r from-blue-500 to-indigo-500'
            }`}
          />
        </div>
      </div>

      {/* 3. Các badge đếm số lượng: Đã xong, Đang xử lý, Quá hạn, Chưa bắt đầu (AC 1) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        {/* Đã xong */}
        <div
          data-testid="badge-stat-completed"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5 dark:border-emerald-900/40 dark:bg-emerald-950/20"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
              {`Đã xong: ${summary.completedTasks}`}
            </span>
            <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400 block truncate">
              {summary.totalTasks > 0 ? Math.round((summary.completedTasks / summary.totalTasks) * 100) : 0}% tổng việc
            </span>
          </div>
        </div>

        {/* Đang xử lý */}
        <div
          data-testid="badge-stat-in-progress"
          className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 p-2.5 dark:border-blue-900/40 dark:bg-blue-950/20"
        >
          <PlayCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-xs font-bold text-blue-900 dark:text-blue-200 block">
              {`Đang xử lý: ${summary.inProgressTasks}`}
            </span>
            <span className="text-[10px] text-blue-700/80 dark:text-blue-400 block truncate">
              Đang trong quy trình
            </span>
          </div>
        </div>

        {/* Quá hạn (Overdue) - Hiển thị cảnh báo đỏ */}
        <div
          data-testid="badge-stat-overdue"
          className={`flex items-center gap-2 rounded-xl border p-2.5 transition-colors ${
            summary.overdueTasks > 0
              ? 'border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200 shadow-xs ring-1 ring-rose-500/20'
              : 'border-gray-200 bg-gray-50/70 text-gray-600 dark:border-gray-800 dark:bg-gray-850 dark:text-gray-400'
          }`}
        >
          <AlertTriangle
            className={`h-4 w-4 shrink-0 ${
              summary.overdueTasks > 0 ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-gray-400'
            }`}
          />
          <div className="min-w-0">
            <span className={`text-xs font-bold block ${summary.overdueTasks > 0 ? 'text-rose-700 dark:text-rose-300' : ''}`}>
              {`Quá hạn: ${summary.overdueTasks}`}
            </span>
            <span className="text-[10px] block truncate">
              {summary.overdueTasks > 0 ? 'Cần xử lý gấp' : 'Đúng tiến độ'}
            </span>
          </div>
        </div>

        {/* Chưa bắt đầu */}
        <div
          data-testid="badge-stat-not-started"
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/70 p-2.5 dark:border-gray-800 dark:bg-gray-850"
        >
          <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
              {`Chưa bắt đầu: ${summary.notStartedTasks}`}
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 block truncate">
              Chờ đến lượt
            </span>
          </div>
        </div>
      </div>

      {/* 4. Chi tiết tiến độ theo từng giai đoạn (Phase breakdown mini-bars) */}
      <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
        <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
          Tiến độ theo từng giai đoạn tiếp nhận:
        </span>
        <div data-testid="phase-progress-list" className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {ONBOARDING_PHASES.map((phase) => {
            const pStat = summary.phaseProgress[phase.id] || { total: 0, completed: 0, percentage: 0 };
            return (
              <div
                key={phase.id}
                data-testid={`phase-mini-progress-${phase.id}`}
                className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 text-[11px]">
                    {phase.shortLabel}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    {pStat.completed}/{pStat.total} ({pStat.percentage}%)
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    style={{ width: `${pStat.percentage}%` }}
                    className={`h-full rounded-full transition-all ${
                      pStat.percentage === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OnboardingProgressBar;
