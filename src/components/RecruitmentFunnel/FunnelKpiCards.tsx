import React from 'react';
import {
  Users,
  Percent,
  Clock,
  UserCheck2,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
} from 'lucide-react';
import type { FunnelSummaryKpi } from '../../types/recruitmentFunnel';

export interface FunnelKpiCardsProps {
  kpi: FunnelSummaryKpi;
}

export const FunnelKpiCards: React.FC<FunnelKpiCardsProps> = ({ kpi }) => {
  return (
    <div
      data-testid="funnel-summary-kpi-container"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {/* 1. Tổng số hồ sơ ứng tuyển tiếp nhận (AC 2) */}
      <div
        data-testid="kpi-card-total-applications"
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 h-24 w-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Tổng số hồ sơ tiếp nhận
            </p>
            <h3
              data-testid="kpi-value-total-applications"
              className="text-2xl font-black text-gray-900 dark:text-white mt-1 tracking-tight"
            >
              {kpi.totalApplications.toLocaleString('vi-VN')}
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              Hồ sơ hợp lệ từ mọi nguồn
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Growth badge */}
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          <span className="inline-flex items-center gap-0.5 font-bold text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight className="h-3.5 w-3.5" />
            {`+${kpi.applicationsGrowthPercent ?? 12.8}%`}
          </span>
          <span className="text-gray-400 dark:text-gray-500 text-[11px]">
            so với kỳ trước
          </span>
        </div>
      </div>

      {/* 2. Tỷ lệ chuyển đổi tổng thể: Ứng tuyển -> Nhận việc (AC 2) */}
      <div
        data-testid="kpi-card-conversion-rate"
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 h-24 w-24 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition-colors pointer-events-none" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Tỷ lệ chuyển đổi tổng thể
            </p>
            <h3
              data-testid="kpi-value-conversion-rate"
              className="text-2xl font-black text-violet-600 dark:text-violet-400 mt-1 tracking-tight"
            >
              {`${kpi.overallConversionRate}%`}
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              Từ ứng tuyển đến nhận việc
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
            <Percent className="h-5 w-5" />
          </div>
        </div>

        {/* Conversion comparison */}
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          <span className="inline-flex items-center gap-0.5 font-bold text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-3.5 w-3.5" />
            {`+${kpi.conversionRateChangePercent ?? 0.6}%`}
          </span>
          <span className="text-gray-400 dark:text-gray-500 text-[11px]">
            tiến độ tích cực
          </span>
        </div>
      </div>

      {/* 3. Thời gian tuyển dụng trung bình (Time to Hire) (AC 2) */}
      <div
        data-testid="kpi-card-time-to-hire"
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 h-24 w-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors pointer-events-none" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Thời gian tuyển dụng trung bình
            </p>
            <h3
              data-testid="kpi-value-time-to-hire"
              className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 tracking-tight"
            >
              {`${kpi.avgTimeToHireDays} ngày`}
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              Average Time to Hire
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* Time comparison */}
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          <span className="inline-flex items-center gap-0.5 font-bold text-emerald-600 dark:text-emerald-400">
            <ArrowDownRight className="h-3.5 w-3.5" />
            {`${kpi.timeToHireChangeDays ?? -2.3} ngày`}
          </span>
          <span className="text-gray-400 dark:text-gray-500 text-[11px]">
            rút ngắn so với quý trước
          </span>
        </div>
      </div>

      {/* 4. Tổng ứng viên tiếp nhận (Total Hired) & Tỷ lệ nhận Offer */}
      <div
        data-testid="kpi-card-total-hired"
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Tiếp nhận chính thức (Hired)
            </p>
            <h3
              data-testid="kpi-value-total-hired"
              className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tracking-tight"
            >
              {`${kpi.totalHired} nhân sự`}
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              {`Offer Acceptance: ${kpi.offerAcceptanceRate}%`}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <UserCheck2 className="h-5 w-5" />
          </div>
        </div>

        {/* Offer acceptance rate badge */}
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          <span className="inline-flex items-center gap-1 font-bold text-teal-600 dark:text-teal-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {`Tỷ lệ duyệt hồ sơ: ${kpi.screeningPassRate}%`}
          </span>
        </div>
      </div>
    </div>
  );
};
