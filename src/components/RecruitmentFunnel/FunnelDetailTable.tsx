import React from 'react';
import { Table, ArrowDown, Clock } from 'lucide-react';
import type { FunnelStageMetric } from '../../types/recruitmentFunnel';

export interface FunnelDetailTableProps {
  stages: FunnelStageMetric[];
}

export const FunnelDetailTable: React.FC<FunnelDetailTableProps> = ({ stages }) => {
  const initialAppliedCount = stages[0]?.count || 1;

  return (
    <div
      data-testid="funnel-detail-table"
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs space-y-4"
    >
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Table className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Bảng đối soát chi tiết chỉ số từng tầng phễu
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Chi tiết ứng viên, tỷ lệ chuyển đổi, tỷ lệ loại và thời gian xử lý qua các vòng
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-gray-50/80 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
              <th className="py-3 px-3 font-bold rounded-l-lg">STT & Giai đoạn</th>
              <th className="py-3 px-3 font-bold text-right">Số lượng ứng viên</th>
              <th className="py-3 px-3 font-bold text-center">Tỷ lệ qua vòng (%)</th>
              <th className="py-3 px-3 font-bold text-center">Bị loại / Dừng lại</th>
              <th className="py-3 px-3 font-bold text-center">Giữ chân lũy kế (%)</th>
              <th className="py-3 px-3 font-bold text-center">Thời gian TB</th>
              <th className="py-3 px-3 font-bold rounded-r-lg">Tiến độ quy mô</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {stages.map((stage) => {
              const miniProgressWidth = Math.max(
                6,
                Math.round((stage.count / initialAppliedCount) * 100),
              );

              return (
                <tr
                  key={stage.id}
                  data-testid={`funnel-table-row-${stage.id.toLowerCase()}`}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
                >
                  {/* STT & Giai đoạn */}
                  <td className="py-3 px-3 font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 text-[11px] font-bold text-gray-700 dark:text-gray-300">
                        {stage.stageOrder}
                      </span>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white">
                          {stage.name}
                        </div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 line-clamp-1 max-w-xs">
                          {stage.description}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Số lượng ứng viên */}
                  <td className="py-3 px-3 text-right">
                    <span className="font-black text-gray-900 dark:text-white text-sm">
                      {stage.count.toLocaleString('vi-VN')}
                    </span>
                    <div className="text-[10px] text-gray-400">
                      {Math.round((stage.count / initialAppliedCount) * 1000) / 10}% tổng hồ sơ
                    </div>
                  </td>

                  {/* Tỷ lệ qua vòng (%) */}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md font-bold text-xs ${
                        stage.stageOrder === 1
                          ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          : stage.passRate >= 60
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : stage.passRate >= 40
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {stage.passRate}%
                    </span>
                  </td>

                  {/* Bị loại / Dừng lại */}
                  <td className="py-3 px-3 text-center">
                    {stage.stageOrder === 1 ? (
                      <span className="text-gray-400">-</span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 font-semibold">
                        -{stage.dropCount} ({stage.dropRate}%)
                      </span>
                    )}
                  </td>

                  {/* Giữ chân lũy kế (%) */}
                  <td className="py-3 px-3 text-center">
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {stage.retentionRate}%
                    </span>
                  </td>

                  {/* Thời gian TB */}
                  <td className="py-3 px-3 text-center">
                    <div className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span>{stage.avgDaysInStage} ngày</span>
                    </div>
                  </td>

                  {/* Tiến độ quy mô */}
                  <td className="py-3 px-3 w-36">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${miniProgressWidth}%` }}
                          className={`h-full rounded-full ${
                            stage.stageOrder === 1
                              ? 'bg-blue-600'
                              : stage.stageOrder === 2
                                ? 'bg-indigo-600'
                                : stage.stageOrder === 3
                                  ? 'bg-violet-600'
                                  : stage.stageOrder === 4
                                    ? 'bg-purple-600'
                                    : stage.stageOrder === 5
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-600'
                          }`}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 w-8 text-right">
                        {miniProgressWidth}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
        <span>* Tỷ lệ qua vòng (%) được tính dựa trên số lượng ứng viên vượt qua so với số ứng viên đầu vào của vòng trước đó.</span>
        <div className="flex items-center gap-1 text-gray-500">
          <ArrowDown className="h-3 w-3" />
          <span>Dòng chảy ứng viên một chiều</span>
        </div>
      </div>
    </div>
  );
};
