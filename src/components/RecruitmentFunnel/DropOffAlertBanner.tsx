import React from 'react';
import { AlertTriangle, TrendingDown, Lightbulb, Users, ArrowRight } from 'lucide-react';
import type { DropOffAlertInfo } from '../../types/recruitmentFunnel';

export interface DropOffAlertBannerProps {
  dropOff: DropOffAlertInfo;
}

export const DropOffAlertBanner: React.FC<DropOffAlertBannerProps> = ({ dropOff }) => {
  return (
    <div
      data-testid="dropoff-alert-banner"
      className="rounded-2xl border-2 border-rose-500/60 bg-gradient-to-r from-rose-50 via-rose-50/50 to-amber-50/30 dark:from-rose-950/40 dark:via-rose-950/20 dark:to-amber-950/10 p-5 shadow-sm relative overflow-hidden transition-all animate-fade-in"
    >
      <div className="absolute top-0 right-0 h-32 w-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Left: Icon & Alert Message (AC 2) */}
        <div className="flex items-start gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/20">
            <AlertTriangle className="h-5 w-5 animate-pulse" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200">
                <TrendingDown className="h-3.5 w-3.5" />
                Cảnh báo điểm rơi tuyển dụng
              </span>
              <span
                data-testid="dropoff-stage-badge"
                className="text-xs font-bold text-rose-600 dark:text-rose-400"
              >
                {`Tầng ${dropOff.stageOrder}: ${dropOff.stageName}`}
              </span>
            </div>

            <h3
              data-testid="dropoff-alert-message"
              className="text-base sm:text-lg font-black text-gray-900 dark:text-white tracking-tight"
            >
              {dropOff.alertMessage}
            </h3>

            <p className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-gray-400" />
                {`Đầu vào: ${dropOff.incomingCount} ứng viên`}
              </span>
              <ArrowRight className="h-3 w-3 text-gray-400" />
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {`Dừng lại / Loại: -${dropOff.dropCount} hồ sơ (${dropOff.dropRate}%)`}
              </span>
              <ArrowRight className="h-3 w-3 text-gray-400" />
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {`Qua vòng: ${dropOff.passedCount}`}
              </span>
            </p>
          </div>
        </div>

        {/* Right: Tỷ lệ rớt nổi bật */}
        <div className="flex items-baseline md:flex-col md:items-end justify-between shrink-0 bg-white/70 dark:bg-gray-900/70 p-3 rounded-xl border border-rose-200/60 dark:border-rose-900/40">
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
            Tỷ lệ hao hụt lớn nhất
          </span>
          <span
            data-testid="dropoff-rate-highlight"
            className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight"
          >
            {`${dropOff.dropRate}%`}
          </span>
        </div>
      </div>

      {/* Actionable recommendation */}
      <div
        data-testid="dropoff-recommendation"
        className="mt-3.5 pt-3 border-t border-rose-200/60 dark:border-rose-900/40 flex items-start gap-2 text-xs text-rose-900 dark:text-rose-200 bg-white/50 dark:bg-gray-900/40 p-2.5 rounded-lg"
      >
        <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">Khuyến nghị điều chỉnh:</strong>{' '}
          <span>{dropOff.recommendation}</span>
        </div>
      </div>
    </div>
  );
};
