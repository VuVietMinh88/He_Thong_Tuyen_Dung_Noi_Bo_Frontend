import React, { useState } from 'react';
import type { CandidateSourceMetric } from '../../types/candidateSourceReport';

interface SourceDistributionChartProps {
  sources: CandidateSourceMetric[];
}

type ChartMetricMode = 'APPLICATIONS' | 'HIRES';

export const SourceDistributionChart: React.FC<SourceDistributionChartProps> = ({ sources }) => {
  const [metricMode, setMetricMode] = useState<ChartMetricMode>('APPLICATIONS');
  const [hoveredSourceId, setHoveredSourceId] = useState<string | null>(null);

  // Lấy dữ liệu theo chế độ đang chọn
  const validSources = sources.filter((s) => s.totalApplications > 0);
  const totalValue =
    metricMode === 'APPLICATIONS'
      ? validSources.reduce((acc, s) => acc + s.totalApplications, 0)
      : validSources.reduce((acc, s) => acc + s.hiredCount, 0);

  // Tính toán lát cắt Donut SVG (bằng stroke-dasharray trên vòng tròn)
  // Đường tròn bán kính R = 80, chu vi C = 2 * PI * R ≈ 502.65
  const RADIUS = 80;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  let accumulatedPercent = 0;
  const slices = validSources.map((source) => {
    const value = metricMode === 'APPLICATIONS' ? source.totalApplications : source.hiredCount;
    const percent = totalValue > 0 ? (value / totalValue) * 100 : 0;
    const strokeDasharray = `${(percent / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * CIRCUMFERENCE);
    accumulatedPercent += percent;

    return {
      source,
      value,
      percent: Number(percent.toFixed(1)),
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeHovered = slices.find((s) => s.source.sourceId === hoveredSourceId);

  return (
    <div
      data-testid="source-distribution-chart"
      className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200/80 dark:border-gray-700 shadow-sm transition-all"
    >
      {/* Header & Toggle Mode */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-700/60">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🍩</span>
            <span>Biểu đồ phân bổ tỷ trọng nguồn ứng viên</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Đối chiếu tỷ trọng đóng góp của từng kênh tuyển dụng trong kỳ báo cáo
          </p>
        </div>

        {/* Nút chuyển đổi góc nhìn */}
        <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-900 p-1 border border-gray-200/60 dark:border-gray-700 self-start sm:self-auto">
          <button
            type="button"
            data-testid="chart-mode-applications"
            onClick={() => setMetricMode('APPLICATIONS')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              metricMode === 'APPLICATIONS'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Theo Hồ sơ nộp
          </button>
          <button
            type="button"
            data-testid="chart-mode-hires"
            onClick={() => setMetricMode('HIRES')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              metricMode === 'HIRES'
                ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Theo Số tuyển dụng (Hired)
          </button>
        </div>
      </div>

      {/* Grid: Donut SVG + Legend Table */}
      <div className="pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Cột trái: Donut SVG Chart */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative w-64 h-64 flex items-center justify-center">
            <svg
              data-testid="source-donut-svg"
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 220 220"
            >
              {/* Vòng nền mờ */}
              <circle
                cx="110"
                cy="110"
                r={RADIUS}
                className="stroke-gray-100 dark:stroke-gray-700/50"
                strokeWidth="28"
                fill="transparent"
              />

              {/* Các phân đoạn của từng nguồn */}
              {slices.map((slice) => {
                const isHovered = hoveredSourceId === slice.source.sourceId;
                return (
                  <circle
                    key={slice.source.sourceId}
                    data-testid={`donut-segment-${slice.source.sourceId.toLowerCase()}`}
                    cx="110"
                    cy="110"
                    r={RADIUS}
                    fill="transparent"
                    stroke={slice.source.brandColor}
                    strokeWidth={isHovered ? '34' : '28'}
                    strokeDasharray={slice.strokeDasharray}
                    strokeDashoffset={slice.strokeDashoffset}
                    strokeLinecap="butt"
                    className="transition-all duration-300 cursor-pointer hover:opacity-90"
                    onMouseEnter={() => setHoveredSourceId(slice.source.sourceId)}
                    onMouseLeave={() => setHoveredSourceId(null)}
                  />
                );
              })}
            </svg>

            {/* Vùng trung tâm Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
              {activeHovered ? (
                <>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                    {activeHovered.source.sourceName}
                  </span>
                  <span className="text-xl font-extrabold text-gray-900 dark:text-white">
                    {activeHovered.value.toLocaleString('vi-VN')}
                  </span>
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded-full mt-0.5"
                    style={{
                      backgroundColor: `${activeHovered.source.brandColor}20`,
                      color: activeHovered.source.brandColor,
                    }}
                  >
                    {`${activeHovered.percent}%`}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    {metricMode === 'APPLICATIONS' ? 'Tổng hồ sơ' : 'Tổng nhận việc'}
                  </span>
                  <span
                    data-testid="donut-center-total"
                    className="text-2xl font-extrabold text-gray-900 dark:text-white"
                  >
                    {totalValue.toLocaleString('vi-VN')}
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    {validSources.length} kênh hoạt động
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="text-center mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
            * Rê chuột lên từng phần của biểu đồ để xem thông tin chi tiết
          </div>
        </div>

        {/* Cột phải: Legend Breakdown */}
        <div className="lg:col-span-7 space-y-2.5">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Chi tiết tỷ trọng đóng góp theo kênh
          </div>

          <div className="space-y-2">
            {slices.map((slice) => {
              const isHovered = hoveredSourceId === slice.source.sourceId;
              return (
                <div
                  key={slice.source.sourceId}
                  data-testid={`legend-item-${slice.source.sourceId.toLowerCase()}`}
                  onMouseEnter={() => setHoveredSourceId(slice.source.sourceId)}
                  onMouseLeave={() => setHoveredSourceId(null)}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                    isHovered
                      ? 'bg-blue-50/60 dark:bg-gray-700/60 border-blue-300 dark:border-blue-600 shadow-sm'
                      : 'bg-gray-50/60 dark:bg-gray-900/40 border-gray-200/60 dark:border-gray-700/60 hover:bg-gray-100/60 dark:hover:bg-gray-700/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Chấm tròn chỉ màu */}
                    <span
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: slice.source.brandColor }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {slice.source.sourceName}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <span>Đạt chuẩn: {`${slice.source.qualificationRate}%`}</span>
                        <span>•</span>
                        <span>Tuyển: {`${slice.source.hireRate}%`}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-xs font-extrabold text-gray-900 dark:text-white">
                      {slice.value.toLocaleString('vi-VN')}
                      <span className="font-normal text-[11px] text-gray-500 ml-1">
                        {metricMode === 'APPLICATIONS' ? 'hồ sơ' : 'hired'}
                      </span>
                    </div>
                    {/* Mini progress bar */}
                    <div className="flex items-center justify-end gap-1.5 mt-1">
                      <div className="w-16 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, slice.percent)}%`,
                            backgroundColor: slice.source.brandColor,
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                        {`${slice.percent}%`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
