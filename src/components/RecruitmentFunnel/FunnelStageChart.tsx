import React, { useState } from 'react';
import {
  FileText,
  UserCheck,
  CalendarCheck,
  Award,
  Send,
  UserPlus,
  ArrowDown,
  Info,
  Clock,
  UserMinus,
  TrendingUp,
} from 'lucide-react';
import type { FunnelStageMetric, FunnelStageId } from '../../types/recruitmentFunnel';

export interface FunnelStageChartProps {
  stages: FunnelStageMetric[];
  onSelectStage?: (stage: FunnelStageMetric) => void;
}

const STAGE_ICONS: Record<FunnelStageId, React.ReactNode> = {
  APPLIED: <FileText className="h-5 w-5" />,
  SCREENED: <UserCheck className="h-5 w-5" />,
  INTERVIEW_1: <CalendarCheck className="h-5 w-5" />,
  INTERVIEW_2: <Award className="h-5 w-5" />,
  OFFERED: <Send className="h-5 w-5" />,
  HIRED: <UserPlus className="h-5 w-5" />,
};

export const FunnelStageChart: React.FC<FunnelStageChartProps> = ({
  stages,
  onSelectStage,
}) => {
  const [activeStageId, setActiveStageId] = useState<FunnelStageId | null>(null);

  const appliedCount = stages[0]?.count || 1;

  const handleStageClick = (stage: FunnelStageMetric) => {
    setActiveStageId((prev) => (prev === stage.id ? null : stage.id));
    onSelectStage?.(stage);
  };

  return (
    <div
      data-testid="funnel-stage-chart"
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>Bố cục các tầng phễu tuyển dụng (Recruitment Funnel)</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Lưu lượng ứng viên, tỷ lệ vượt qua vòng (%) và tỷ lệ chuyển đổi tích lũy
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Info className="h-3.5 w-3.5 text-blue-500" />
          <span>Click vào từng tầng để xem phân tích chi tiết</span>
        </div>
      </div>

      {/* Visual Funnel Stack (AC 3) */}
      <div className="space-y-3">
        {stages.map((stage, index) => {
          const isSelected = activeStageId === stage.id;
          const isFirstStage = index === 0;
          const prevStage = !isFirstStage ? stages[index - 1] : null;

          // Tính toán độ rộng thanh tiến trình phễu (width % dựa trên retention so với ban đầu, min 18% để đủ chứa text)
          const widthPercentage = Math.max(18, Math.min(100, Math.round((stage.count / appliedCount) * 100)));

          return (
            <React.Fragment key={stage.id}>
              {/* Connector giữa 2 vòng: Hiển thị Tỷ lệ qua vòng & Số lượng loại (AC 3) */}
              {!isFirstStage && prevStage && (
                <div
                  data-testid={`funnel-connector-${stage.id.toLowerCase()}`}
                  className="flex items-center justify-center my-1"
                >
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 px-3.5 py-1 rounded-full shadow-2xs">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                      <TrendingUp className="h-3 w-3" />
                      <span data-testid={`stage-passrate-${stage.id.toLowerCase()}`}>
                        {`Vượt qua: ${stage.passRate}%`}
                      </span>
                    </div>

                    <span className="h-3 w-px bg-gray-300 dark:bg-gray-700" />

                    <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                      <UserMinus className="h-3 w-3" />
                      <span data-testid={`stage-dropcount-${stage.id.toLowerCase()}`}>
                        {`Loại: -${stage.dropCount} (${stage.dropRate}%)`}
                      </span>
                    </div>

                    <ArrowDown className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
              )}

              {/* Khối hiển thị tầng phễu (Stage Card) */}
              <div
                data-testid={`stage-card-${stage.id.toLowerCase()}`}
                onClick={() => handleStageClick(stage)}
                className={`group cursor-pointer rounded-xl border transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/20'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50/60 dark:hover:bg-gray-800/40'
                }`}
              >
                <div className="p-4">
                  {/* Row 1: Header information */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      {/* Stage Order Badge */}
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black shadow-xs ${
                          stage.stageOrder === 1
                            ? 'bg-blue-600 text-white'
                            : stage.stageOrder === 2
                              ? 'bg-indigo-600 text-white'
                              : stage.stageOrder === 3
                                ? 'bg-violet-600 text-white'
                                : stage.stageOrder === 4
                                  ? 'bg-purple-600 text-white'
                                  : stage.stageOrder === 5
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {stage.stageOrder}
                      </span>

                      {/* Icon */}
                      <div className="text-gray-600 dark:text-gray-300">
                        {STAGE_ICONS[stage.id]}
                      </div>

                      {/* Title */}
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                          {stage.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                          {stage.description}
                        </p>
                      </div>
                    </div>

                    {/* Stage Metrics badges */}
                    <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                      {/* Số lượng ứng viên */}
                      <div className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-xs font-extrabold flex items-center gap-1.5">
                        <span>Ứng viên:</span>
                        <span
                          data-testid={`stage-count-${stage.id.toLowerCase()}`}
                          className="text-sm text-blue-600 dark:text-blue-400"
                        >
                          {stage.count}
                        </span>
                      </div>

                      {/* Tỷ lệ % vượt qua vòng (AC 3) */}
                      <div className="px-2.5 py-1 rounded-lg border text-xs font-semibold bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                        {`Qua vòng: ${stage.passRate}%`}
                      </div>

                      {/* Tỷ lệ giữ chân lũy kế */}
                      <div
                        data-testid={`stage-retention-${stage.id.toLowerCase()}`}
                        className="px-2.5 py-1 rounded-lg border text-xs font-semibold bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                      >
                        {`Giữ chân: ${stage.retentionRate}%`}
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Thanh trực quan hình phễu (Funnel Bar) */}
                  <div className="relative pt-1">
                    <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
                      <div
                        data-testid={`funnel-bar-${stage.id.toLowerCase()}`}
                        style={{ width: `${widthPercentage}%` }}
                        className={`h-full transition-all duration-500 rounded-full ${
                          stage.stageOrder === 1
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                            : stage.stageOrder === 2
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                              : stage.stageOrder === 3
                                ? 'bg-gradient-to-r from-indigo-600 to-violet-600'
                                : stage.stageOrder === 4
                                  ? 'bg-gradient-to-r from-violet-600 to-purple-600'
                                  : stage.stageOrder === 5
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                    : 'bg-gradient-to-r from-emerald-500 to-teal-600'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Row 3: Chi tiết mở rộng khi click */}
                  {isSelected && (
                    <div
                      data-testid={`stage-expanded-detail-${stage.id.toLowerCase()}`}
                      className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-gray-50/50 dark:bg-gray-800/30 p-3 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Thời gian TB tại vòng:</span>
                          <span className="ml-1 font-bold text-gray-800 dark:text-gray-200">
                            {stage.avgDaysInStage} ngày
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Ứng viên bị loại / rút:</span>
                        <span className="ml-1 font-bold text-rose-600 dark:text-rose-400">
                          {stage.dropCount} hồ sơ ({stage.dropRate}%)
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-500 dark:text-gray-400">So với đầu phễu:</span>
                        <span className="ml-1 font-bold text-blue-600 dark:text-blue-400">
                          {stage.count}/{appliedCount} ({stage.retentionRate}%)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
