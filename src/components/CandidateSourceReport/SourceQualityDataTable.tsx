import React, { useState } from 'react';
import type { CandidateSourceMetric, QualityTier } from '../../types/candidateSourceReport';

interface SourceQualityDataTableProps {
  sources: CandidateSourceMetric[];
}

type SortField =
  | 'sourceName'
  | 'totalApplications'
  | 'screenedCount'
  | 'interviewCount'
  | 'offeredCount'
  | 'hiredCount'
  | 'qualificationRate'
  | 'hireRate';

type SortDirection = 'asc' | 'desc';

export const SourceQualityDataTable: React.FC<SourceQualityDataTableProps> = ({ sources }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('qualificationRate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Lọc theo tìm kiếm
  const filteredSources = sources.filter((item) =>
    item.sourceName.toLowerCase().includes(searchTerm.toLowerCase().trim()),
  );

  // Sắp xếp
  const sortedSources = [...filteredSources].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (typeof aVal === 'string') {
      return sortDirection === 'asc'
        ? (aVal as string).localeCompare(bVal as string)
        : (bVal as string).localeCompare(aVal as string);
    }

    aVal = Number(aVal) || 0;
    bVal = Number(bVal) || 0;
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Tính tổng hàng footer
  const totalApps = sources.reduce((sum, s) => sum + s.totalApplications, 0);
  const totalScreened = sources.reduce((sum, s) => sum + s.screenedCount, 0);
  const totalInterviews = sources.reduce((sum, s) => sum + s.interviewCount, 0);
  const totalOffers = sources.reduce((sum, s) => sum + s.offeredCount, 0);
  const totalHired = sources.reduce((sum, s) => sum + s.hiredCount, 0);
  const avgQualificationRate =
    totalApps > 0 ? Number(((totalInterviews / totalApps) * 100).toFixed(1)) : 0;
  const avgHireRate = totalApps > 0 ? Number(((totalHired / totalApps) * 100).toFixed(1)) : 0;

  // Render badge mức độ hiệu quả (Xanh/Vàng/Đỏ)
  const renderQualityBadge = (tier: QualityTier, sourceId: string) => {
    switch (tier) {
      case 'EXCELLENT':
        return (
          <span
            data-testid={`quality-badge-${sourceId.toLowerCase()}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Xuất sắc (Hiệu quả cao)</span>
          </span>
        );
      case 'GOOD':
        return (
          <span
            data-testid={`quality-badge-${sourceId.toLowerCase()}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-700"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Đạt chuẩn (Khá)</span>
          </span>
        );
      case 'AVERAGE':
        return (
          <span
            data-testid={`quality-badge-${sourceId.toLowerCase()}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Trung bình</span>
          </span>
        );
      case 'POOR':
      default:
        return (
          <span
            data-testid={`quality-badge-${sourceId.toLowerCase()}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-700"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Cần cải thiện (Kém)</span>
          </span>
        );
    }
  };

  // Helper render sort indicator
  const renderSortArrow = (field: SortField) => {
    if (sortField !== field) {
      return <span className="text-gray-300 dark:text-gray-600 ml-1">↕</span>;
    }
    return <span className="text-blue-600 dark:text-blue-400 font-bold ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div
      data-testid="source-quality-data-table"
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden transition-all"
    >
      {/* Header & Search */}
      <div className="p-4 sm:p-5 border-b border-gray-200/80 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📋</span>
            <span>Bảng phân tích chi tiết hiệu quả các nguồn ứng viên</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Đối chiếu số lượng ứng viên từng vòng với tỷ lệ đạt chuẩn và thành công
          </p>
        </div>

        {/* Input tìm kiếm nhanh */}
        <div className="w-full sm:w-64 relative">
          <input
            type="text"
            data-testid="search-source-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo kênh tuyển dụng..."
            className="w-full text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 pl-8 pr-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
          <span className="absolute left-2.5 top-2.5 text-gray-400 text-xs">🔍</span>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Bảng dữ liệu chính */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50/80 dark:bg-gray-900/60 border-b border-gray-200/80 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold uppercase tracking-wider select-none">
              <th
                onClick={() => handleSort('sourceName')}
                className="py-3 px-4 cursor-pointer hover:bg-gray-100/60 dark:hover:bg-gray-700/40 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Kênh tuyển dụng</span>
                  {renderSortArrow('sourceName')}
                </div>
              </th>
              <th
                onClick={() => handleSort('totalApplications')}
                className="py-3 px-3 text-right cursor-pointer hover:bg-gray-100/60 dark:hover:bg-gray-700/40 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Tiếp nhận</span>
                  {renderSortArrow('totalApplications')}
                </div>
              </th>
              <th
                onClick={() => handleSort('screenedCount')}
                className="py-3 px-3 text-right cursor-pointer hover:bg-gray-100/60 dark:hover:bg-gray-700/40 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Đạt lọc</span>
                  {renderSortArrow('screenedCount')}
                </div>
              </th>
              <th
                onClick={() => handleSort('interviewCount')}
                className="py-3 px-3 text-right cursor-pointer hover:bg-gray-100/60 dark:hover:bg-gray-700/40 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Phỏng vấn</span>
                  {renderSortArrow('interviewCount')}
                </div>
              </th>
              <th
                onClick={() => handleSort('offeredCount')}
                className="py-3 px-3 text-right cursor-pointer hover:bg-gray-100/60 dark:hover:bg-gray-700/40 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Offer</span>
                  {renderSortArrow('offeredCount')}
                </div>
              </th>
              <th
                onClick={() => handleSort('hiredCount')}
                className="py-3 px-3 text-right cursor-pointer hover:bg-gray-100/60 dark:hover:bg-gray-700/40 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Nhận việc</span>
                  {renderSortArrow('hiredCount')}
                </div>
              </th>
              <th
                onClick={() => handleSort('qualificationRate')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-gray-100/60 dark:hover:bg-gray-700/40 transition-colors bg-blue-50/30 dark:bg-blue-950/10"
              >
                <div className="flex items-center justify-end gap-1">
                  <span className="text-blue-700 dark:text-blue-300 font-bold">Tỷ lệ đạt chuẩn</span>
                  {renderSortArrow('qualificationRate')}
                </div>
              </th>
              <th
                onClick={() => handleSort('hireRate')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-gray-100/60 dark:hover:bg-gray-700/40 transition-colors bg-purple-50/30 dark:bg-purple-950/10"
              >
                <div className="flex items-center justify-end gap-1">
                  <span className="text-purple-700 dark:text-purple-300 font-bold">Tỷ lệ tuyển dụng</span>
                  {renderSortArrow('hireRate')}
                </div>
              </th>
              <th className="py-3 px-4 text-center">
                <span>Mức độ hiệu quả</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
            {sortedSources.length > 0 ? (
              sortedSources.map((item) => (
                <tr
                  key={item.sourceId}
                  data-testid={`source-row-${item.sourceId.toLowerCase()}`}
                  className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors"
                >
                  {/* Kênh tuyển dụng */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: item.brandColor }}
                      />
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {item.sourceName}
                        </span>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                          {item.shareOfApplications}% tổng hồ sơ • {item.avgDaysToHire} ngày tuyển
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Tiếp nhận */}
                  <td
                    data-testid={`cell-applied-${item.sourceId.toLowerCase()}`}
                    className="py-3.5 px-3 text-right font-medium text-gray-800 dark:text-gray-200"
                  >
                    {item.totalApplications.toLocaleString('vi-VN')}
                  </td>

                  {/* Đạt lọc */}
                  <td
                    data-testid={`cell-screened-${item.sourceId.toLowerCase()}`}
                    className="py-3.5 px-3 text-right text-gray-700 dark:text-gray-300"
                  >
                    <div>{item.screenedCount.toLocaleString('vi-VN')}</div>
                    <div className="text-[10px] text-gray-400">{`${item.screeningPassRate}%`}</div>
                  </td>

                  {/* Phỏng vấn */}
                  <td
                    data-testid={`cell-interview-${item.sourceId.toLowerCase()}`}
                    className="py-3.5 px-3 text-right font-semibold text-gray-800 dark:text-gray-200"
                  >
                    {item.interviewCount.toLocaleString('vi-VN')}
                  </td>

                  {/* Offer */}
                  <td
                    data-testid={`cell-offered-${item.sourceId.toLowerCase()}`}
                    className="py-3.5 px-3 text-right text-gray-700 dark:text-gray-300"
                  >
                    {item.offeredCount.toLocaleString('vi-VN')}
                  </td>

                  {/* Nhận việc */}
                  <td
                    data-testid={`cell-hired-${item.sourceId.toLowerCase()}`}
                    className="py-3.5 px-3 text-right font-bold text-gray-900 dark:text-white"
                  >
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-extrabold">
                      {item.hiredCount.toLocaleString('vi-VN')}
                    </span>
                  </td>

                  {/* Tỷ lệ đạt chuẩn */}
                  <td
                    data-testid={`cell-qual-rate-${item.sourceId.toLowerCase()}`}
                    className="py-3.5 px-4 text-right bg-blue-50/20 dark:bg-blue-950/10"
                  >
                    <div className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                      {`${item.qualificationRate}%`}
                    </div>
                    {/* Mini progress bar */}
                    <div className="w-20 ml-auto h-1 rounded-full bg-gray-200 dark:bg-gray-700 mt-1 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${Math.min(100, item.qualificationRate * 2)}%` }}
                      />
                    </div>
                  </td>

                  {/* Tỷ lệ tuyển dụng */}
                  <td
                    data-testid={`cell-hire-rate-${item.sourceId.toLowerCase()}`}
                    className="py-3.5 px-4 text-right bg-purple-50/20 dark:bg-purple-950/10"
                  >
                    <div className="font-extrabold text-purple-600 dark:text-purple-400 text-sm">
                      {`${item.hireRate}%`}
                    </div>
                    {/* Mini progress bar */}
                    <div className="w-20 ml-auto h-1 rounded-full bg-gray-200 dark:bg-gray-700 mt-1 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-purple-500"
                        style={{ width: `${Math.min(100, item.hireRate * 4)}%` }}
                      />
                    </div>
                  </td>

                  {/* Mức độ hiệu quả */}
                  <td className="py-3.5 px-4 text-center">
                    {renderQualityBadge(item.qualityTier, item.sourceId)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="py-8 text-center text-gray-500 dark:text-gray-400">
                  Không tìm thấy kênh tuyển dụng nào phù hợp với từ khóa &quot;{searchTerm}&quot;
                </td>
              </tr>
            )}
          </tbody>

          {/* Footer tổng kết */}
          <tfoot>
            <tr className="bg-gray-100/80 dark:bg-gray-900/80 font-bold border-t-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
              <td className="py-3.5 px-4">
                <span>Tổng cộng / Toàn hệ thống</span>
              </td>
              <td className="py-3.5 px-3 text-right">
                {totalApps.toLocaleString('vi-VN')}
              </td>
              <td className="py-3.5 px-3 text-right">
                {totalScreened.toLocaleString('vi-VN')}
              </td>
              <td className="py-3.5 px-3 text-right">
                {totalInterviews.toLocaleString('vi-VN')}
              </td>
              <td className="py-3.5 px-3 text-right">
                {totalOffers.toLocaleString('vi-VN')}
              </td>
              <td className="py-3.5 px-3 text-right">
                <span className="text-purple-600 dark:text-purple-400">
                  {totalHired.toLocaleString('vi-VN')}
                </span>
              </td>
              <td className="py-3.5 px-4 text-right text-blue-600 dark:text-blue-400 font-extrabold">
                {`${avgQualificationRate}%`}
              </td>
              <td className="py-3.5 px-4 text-right text-purple-600 dark:text-purple-400 font-extrabold">
                {`${avgHireRate}%`}
              </td>
              <td className="py-3.5 px-4 text-center text-[11px] text-gray-500 font-normal">
                {sources.length} nguồn theo dõi
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
