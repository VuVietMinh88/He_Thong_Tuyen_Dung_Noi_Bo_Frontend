import React from 'react';
import { TrendingUp, Check, AlertCircle } from 'lucide-react';
import type { CompetencyBenchmarkItem } from '../../../types/candidateEvaluationSummary';
import { getGapStatusBadgeConfig } from '../../../utils/candidateEvaluationSummaryHelper';

export interface CompetencyBarChartProps {
  benchmarks: CompetencyBenchmarkItem[];
}

export const CompetencyBarChart: React.FC<CompetencyBarChartProps> = ({ benchmarks }) => {
  return (
    <div
      data-testid="competency-bar-chart-container"
      className="space-y-4 p-2"
    >
      {benchmarks.map((item) => {
        const candidatePercentage = Math.min(Math.max((item.score / 5) * 100, 0), 100);
        const targetPercentage = Math.min(Math.max((item.targetScore / 5) * 100, 0), 100);
        const badgeCfg = getGapStatusBadgeConfig(item.gapStatus, item.gap);

        return (
          <div
            key={item.id}
            data-testid={`competency-bar-item-${item.id}`}
            className="rounded-xl border border-gray-100 bg-gray-50/60 p-3.5 transition-all hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-850/60 dark:hover:bg-gray-850"
          >
            {/* Tiêu đề năng lực & Điểm số */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {item.name}
                </span>
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                  {`Trọng số: ${item.weight}%`}
                </span>
              </div>

              {/* Badge Gap Analysis */}
              <div className="flex items-center gap-2">
                <span
                  data-testid={`badge-gap-${item.id}`}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border ${badgeCfg.containerClass}`}
                >
                  {badgeCfg.iconName === 'TrendingUp' && <TrendingUp className="h-3.5 w-3.5" />}
                  {badgeCfg.iconName === 'Check' && <Check className="h-3.5 w-3.5" />}
                  {badgeCfg.iconName === 'AlertCircle' && <AlertCircle className="h-3.5 w-3.5" />}
                  <span>{badgeCfg.label}</span>
                </span>
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  {`${item.score.toFixed(1)} / 5.0`}
                </span>
              </div>
            </div>

            {/* Thanh tiến độ trực quan với Vạch mốc Target Benchmark */}
            <div className="relative mt-2.5 h-3.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              {/* Thanh màu điểm ứng viên đạt được */}
              <div
                data-testid={`bar-progress-${item.id}`}
                className={`h-full rounded-full transition-all duration-500 ${
                  item.score >= item.targetScore
                    ? 'bg-linear-to-r from-indigo-500 to-emerald-500'
                    : 'bg-linear-to-r from-amber-400 to-amber-500'
                }`}
                style={{ width: `${candidatePercentage}%` }}
              />

              {/* Vạch mốc Target Score */}
              <div
                data-testid={`target-marker-${item.id}`}
                title={`Điểm chuẩn kỳ vọng: ${item.targetScore.toFixed(1)}/5.0`}
                className="absolute top-0 bottom-0 w-1 bg-slate-900 dark:bg-white shadow-xs z-10"
                style={{ left: `calc(${targetPercentage}% - 2px)` }}
              />
            </div>

            {/* Chú thích điểm chuẩn & Điểm đạt */}
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
              <span>{`Chuẩn vị trí yêu cầu: ${item.targetScore.toFixed(1)}`}</span>
              {item.description && (
                <span className="italic line-clamp-1 max-w-[70%] text-right text-gray-500 dark:text-gray-400">
                  {item.description}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CompetencyBarChart;
