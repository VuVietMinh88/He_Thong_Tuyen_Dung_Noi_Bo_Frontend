import React, { useState } from 'react';
import type {
  CandidateSourceMetric,
  SourceComparisonBenchmark,
} from '../../types/candidateSourceReport';

interface SourceBenchmarkComparisonProps {
  sources: CandidateSourceMetric[];
  benchmark?: SourceComparisonBenchmark;
}

type BenchmarkSort = 'APPLICATIONS' | 'HIRES' | 'HIRE_RATE';

export const SourceBenchmarkComparison: React.FC<SourceBenchmarkComparisonProps> = ({
  sources,
  benchmark,
}) => {
  const [sortBy, setSortBy] = useState<BenchmarkSort>('HIRE_RATE');
  const [hoveredSourceId, setHoveredSourceId] = useState<string | null>(null);

  const activeSources = sources.filter((s) => s.totalApplications > 0);

  // Sắp xếp các kênh theo tiêu chí đang chọn
  const sortedSources = [...activeSources].sort((a, b) => {
    if (sortBy === 'APPLICATIONS') return b.totalApplications - a.totalApplications;
    if (sortBy === 'HIRES') return b.hiredCount - a.hiredCount;
    return b.hireRate - a.hireRate;
  });

  // Tìm giá trị max để scale độ cao/độ rộng cột
  const maxApplications = Math.max(...activeSources.map((s) => s.totalApplications), 1);
  const maxHired = Math.max(...activeSources.map((s) => s.hiredCount), 1);

  // Lấy dữ liệu benchmark hoặc tính toán dự phòng
  const topVolume =
    benchmark?.highestVolumeSource ||
    [...activeSources].sort((a, b) => b.totalApplications - a.totalApplications)[0] ||
    null;

  const topRoi =
    benchmark?.highestHireRateSource ||
    [...activeSources].sort((a, b) => b.hireRate - a.hireRate)[0] ||
    null;

  const fastest =
    benchmark?.fastestHiringSource ||
    [...activeSources.filter((s) => s.hiredCount > 0)].sort(
      (a, b) => a.avgDaysToHire - b.avgDaysToHire,
    )[0] ||
    null;

  const lowestQuality =
    benchmark?.lowestQualitySource ||
    [...activeSources].sort((a, b) => a.qualificationRate - b.qualificationRate)[0] ||
    null;

  return (
    <div
      data-testid="source-benchmark-comparison"
      className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200/80 dark:border-gray-700 shadow-sm transition-all space-y-6"
    >
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-700/60">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>⚖️</span>
            <span>So sánh đối đầu hiệu suất các kênh tuyển dụng</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Đối chiếu song song Số lượng hồ sơ tiếp nhận vs Số lượng tuyển thành công (Grouped Bar Chart)
          </p>
        </div>

        {/* Chuyển đổi cách sắp xếp */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Sắp xếp theo:</span>
          <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-900 p-1 border border-gray-200/60 dark:border-gray-700">
            <button
              type="button"
              data-testid="btn-sort-benchmark-rate"
              onClick={() => setSortBy('HIRE_RATE')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                sortBy === 'HIRE_RATE'
                  ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              ROI / Tỷ lệ tuyển
            </button>
            <button
              type="button"
              data-testid="btn-sort-benchmark-apps"
              onClick={() => setSortBy('APPLICATIONS')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                sortBy === 'APPLICATIONS'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Lượng hồ sơ
            </button>
            <button
              type="button"
              data-testid="btn-sort-benchmark-hires"
              onClick={() => setSortBy('HIRES')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                sortBy === 'HIRES'
                  ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Số người tuyển
            </button>
          </div>
        </div>
      </div>

      {/* 1. Các thẻ đánh giá nổi bật (Benchmark Highlight Cards - AC 1) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Nguồn mang lại lượng ứng viên lớn nhất */}
        <div
          data-testid="highlight-card-highest-volume"
          className="p-4 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-gradient-to-br from-blue-50/70 via-white to-sky-50/40 dark:from-blue-950/40 dark:via-gray-800 dark:to-sky-950/20 shadow-xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
              Lượng ứng viên lớn nhất
            </span>
            <span className="text-base">🌟</span>
          </div>
          {topVolume ? (
            <div>
              <div
                data-testid="highlight-highest-volume-name"
                className="text-base font-extrabold text-gray-900 dark:text-white truncate"
              >
                {topVolume.sourceName}
              </div>
              <div className="mt-1 flex items-baseline gap-1.5 text-xs">
                <span
                  data-testid="highlight-highest-volume-count"
                  className="text-lg font-black text-blue-600 dark:text-blue-400"
                >
                  {topVolume.totalApplications.toLocaleString('vi-VN')}
                </span>
                <span className="text-gray-500 dark:text-gray-400 font-medium">hồ sơ</span>
                <span className="ml-auto text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                  {`${topVolume.shareOfApplications}% thị phần`}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">
                Kênh đóng góp lưu lượng hồ sơ đầu vào chủ lực cho toàn bộ chiến dịch tuyển dụng.
              </p>
            </div>
          ) : (
            <div className="text-xs text-gray-400 py-2">Chưa có dữ liệu</div>
          )}
        </div>

        {/* Card 2: Nguồn có tỷ lệ tuyển dụng cao nhất (ROI cao nhất) */}
        <div
          data-testid="highlight-card-highest-hire-rate"
          className="p-4 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-gradient-to-br from-purple-50/70 via-white to-violet-50/40 dark:from-purple-950/40 dark:via-gray-800 dark:to-violet-950/20 shadow-xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
              Tỷ lệ tuyển cao nhất (ROI)
            </span>
            <span className="text-base">🏆</span>
          </div>
          {topRoi ? (
            <div>
              <div
                data-testid="highlight-highest-roi-name"
                className="text-base font-extrabold text-gray-900 dark:text-white truncate"
              >
                {topRoi.sourceName}
              </div>
              <div className="mt-1 flex items-baseline gap-1.5 text-xs">
                <span
                  data-testid="highlight-highest-roi-rate"
                  className="text-lg font-black text-purple-600 dark:text-purple-400"
                >
                  {`${topRoi.hireRate}%`}
                </span>
                <span className="text-gray-500 dark:text-gray-400 font-medium">tuyển thành công</span>
                <span className="ml-auto text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                  {topRoi.hiredCount} đã onboard
                </span>
              </div>
              <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">
                Kênh có tỷ lệ hồ sơ đạt chuẩn cao nhất và chi phí chuyển đổi nhân sự tối ưu nhất.
              </p>
            </div>
          ) : (
            <div className="text-xs text-gray-400 py-2">Chưa có dữ liệu</div>
          )}
        </div>

        {/* Card 3: Tuyển dụng nhanh nhất */}
        <div
          data-testid="highlight-card-fastest-hiring"
          className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 dark:from-emerald-950/40 dark:via-gray-800 dark:to-teal-950/20 shadow-xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Tuyển dụng nhanh nhất
            </span>
            <span className="text-base">⚡</span>
          </div>
          {fastest ? (
            <div>
              <div className="text-base font-extrabold text-gray-900 dark:text-white truncate">
                {fastest.sourceName}
              </div>
              <div className="mt-1 flex items-baseline gap-1.5 text-xs">
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {fastest.avgDaysToHire}
                </span>
                <span className="text-gray-500 dark:text-gray-400 font-medium">ngày / ca tuyển</span>
                <span className="ml-auto text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  Tốc độ vượt trội
                </span>
              </div>
              <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">
                Quy trình tiếp nhận và phản hồi ứng viên được rút ngắn đáng kể so với mặt bằng chung.
              </p>
            </div>
          ) : (
            <div className="text-xs text-gray-400 py-2">Chưa có dữ liệu</div>
          )}
        </div>

        {/* Card 4: Kênh cần tối ưu hóa sàng lọc */}
        <div
          data-testid="highlight-card-lowest-quality"
          className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 dark:from-amber-950/40 dark:via-gray-800 dark:to-orange-950/20 shadow-xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              Cần tối ưu sàng lọc
            </span>
            <span className="text-base">⚠️</span>
          </div>
          {lowestQuality ? (
            <div>
              <div className="text-base font-extrabold text-gray-900 dark:text-white truncate">
                {lowestQuality.sourceName}
              </div>
              <div className="mt-1 flex items-baseline gap-1.5 text-xs">
                <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                  {`${lowestQuality.qualificationRate}%`}
                </span>
                <span className="text-gray-500 dark:text-gray-400 font-medium">đạt chuẩn</span>
                <span className="ml-auto text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                  {lowestQuality.totalApplications} nộp
                </span>
              </div>
              <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">
                Hồ sơ nộp nhiều nhưng tỷ lệ rớt ở vòng lọc cao. Nên siết chặt tiêu chí tin tuyển dụng.
              </p>
            </div>
          ) : (
            <div className="text-xs text-gray-400 py-2">Chưa có dữ liệu</div>
          )}
        </div>
      </div>

      {/* 2. Biểu đồ cột nhóm (Grouped Bar Chart - AC 1) */}
      <div
        data-testid="grouped-bar-chart-container"
        className="bg-gray-50/60 dark:bg-gray-900/40 rounded-xl p-4 sm:p-5 border border-gray-200/60 dark:border-gray-700/60"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Biểu đồ so sánh song song: Hồ sơ tiếp nhận vs Nhận việc thành công
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-blue-500 shadow-xs" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">Hồ sơ tiếp nhận (CV)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-purple-600 shadow-xs" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">Tuyển dụng thành công (Hired)</span>
            </div>
          </div>
        </div>

        {/* Danh sách các cặp cột nhóm nằm ngang cho từng kênh */}
        <div className="space-y-4">
          {sortedSources.map((item) => {
            const appWidthPercent = (item.totalApplications / maxApplications) * 100;
            // Scale cột Hired tương đối theo max Hired để nhìn rõ số lượng
            const hireWidthPercent = (item.hiredCount / maxHired) * 100;
            const isHovered = hoveredSourceId === item.sourceId;

            return (
              <div
                key={item.sourceId}
                data-testid={`benchmark-row-${item.sourceId.toLowerCase()}`}
                onMouseEnter={() => setHoveredSourceId(item.sourceId)}
                onMouseLeave={() => setHoveredSourceId(null)}
                className={`p-3 rounded-xl border transition-all ${
                  isHovered
                    ? 'bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-600 shadow-md'
                    : 'bg-white/80 dark:bg-gray-800/80 border-gray-200/50 dark:border-gray-700/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.brandColor }}
                    />
                    <span className="text-xs font-extrabold text-gray-900 dark:text-white">
                      {item.sourceName}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50">
                      Tỷ lệ tuyển: {`${item.hireRate}%`}
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-3">
                    <span>
                      CV nộp: <strong>{item.totalApplications}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Hired: <strong>{item.hiredCount}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Hệ số:{' '}
                      <strong>
                        {item.hiredCount > 0
                          ? `1:${(item.totalApplications / item.hiredCount).toFixed(1)}`
                          : 'N/A'}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Grouped Bar Bars */}
                <div className="space-y-1.5 pt-1">
                  {/* Thanh 1: Tiếp nhận */}
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-[10px] text-gray-400 text-right flex-shrink-0">
                      Tiếp nhận
                    </span>
                    <div className="flex-1 h-3.5 bg-gray-100 dark:bg-gray-700/60 rounded-md overflow-hidden relative">
                      <div
                        data-testid={`bar-applied-${item.sourceId.toLowerCase()}`}
                        className="h-full bg-blue-500 rounded-md transition-all duration-500 flex items-center justify-end pr-1.5 text-[9px] font-bold text-white shadow-xs"
                        style={{ width: `${Math.max(6, appWidthPercent)}%` }}
                      >
                        {item.totalApplications}
                      </div>
                    </div>
                  </div>

                  {/* Thanh 2: Hired */}
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-[10px] text-gray-400 text-right flex-shrink-0">
                      Nhận việc
                    </span>
                    <div className="flex-1 h-3.5 bg-gray-100 dark:bg-gray-700/60 rounded-md overflow-hidden relative">
                      <div
                        data-testid={`bar-hired-${item.sourceId.toLowerCase()}`}
                        className="h-full bg-purple-600 rounded-md transition-all duration-500 flex items-center justify-end pr-1.5 text-[9px] font-bold text-white shadow-xs"
                        style={{ width: `${Math.max(6, hireWidthPercent)}%` }}
                      >
                        {item.hiredCount}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
