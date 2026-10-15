import React from 'react';
import { Users, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { ConsensusSummary } from '../../../types/candidateEvaluationSummary';
import { getConsensusLevelBadgeConfig } from '../../../utils/candidateEvaluationSummaryHelper';

export interface ConsensusGaugeCardProps {
  consensus: ConsensusSummary;
  overallScore: number;
}

export const ConsensusGaugeCard: React.FC<ConsensusGaugeCardProps> = ({
  consensus,
  overallScore,
}) => {
  const badgeCfg = getConsensusLevelBadgeConfig(consensus.consensusLevel);

  return (
    <div
      data-testid="consensus-gauge-card"
      className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900"
    >
      {/* Header card */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Tỷ lệ đồng thuận của Hội đồng
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Tổng hợp từ các phiếu đánh giá của toàn bộ thành viên hội đồng phỏng vấn
            </p>
          </div>
        </div>

        {/* Badge Mức độ đồng thuận */}
        <span
          data-testid="badge-consensus-level"
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${badgeCfg.badgeClass}`}
        >
          {consensus.consensusLevel === 'UNANIMOUS' && <ShieldCheck className="h-3.5 w-3.5" />}
          {consensus.consensusLevel === 'DIVIDED' && <AlertTriangle className="h-3.5 w-3.5" />}
          <span>{badgeCfg.label}</span>
        </span>
      </div>

      {/* Thước đo phần trăm & Headline */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div
            data-testid="consensus-headline"
            className="text-base font-extrabold text-gray-900 dark:text-white"
          >
            {consensus.consensusHeadline}
          </div>
          {consensus.consensusNote && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {consensus.consensusNote}
            </p>
          )}
        </div>

        {/* Điểm tổng hợp */}
        <div className="flex items-baseline gap-1.5 rounded-xl bg-gray-50 px-4 py-2 border border-gray-100 dark:bg-gray-800 dark:border-gray-750">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Tổng điểm:</span>
          <span
            data-testid="consensus-overall-score"
            className="text-xl font-black text-indigo-600 dark:text-indigo-400"
          >
            {overallScore.toFixed(2)}
          </span>
          <span className="text-xs text-gray-400">/ 5.0</span>
        </div>
      </div>

      {/* Thanh đo tỷ lệ đồng thuận (Gauge Progress Bar) */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
          <span>{`Tỷ lệ khuyến nghị tuyển dụng (${consensus.positiveCount}/${consensus.totalInterviewers})`}</span>
          <span className={`font-bold ${badgeCfg.textColor}`}>
            {`${consensus.consensusPercentage}%`}
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            data-testid="consensus-progress-bar"
            className={`h-full rounded-full transition-all duration-700 ${badgeCfg.progressBarClass}`}
            style={{ width: `${consensus.consensusPercentage}%` }}
          />
        </div>
      </div>

      {/* Thống kê 4 phân loại khuyến nghị */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800 text-center">
        {/* Strong Hire */}
        <div className="rounded-xl bg-purple-50/70 p-2.5 border border-purple-100 dark:bg-purple-950/30 dark:border-purple-900/40">
          <div className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">
            Tuyển xuất sắc
          </div>
          <div
            data-testid="count-strong-hire"
            className="mt-1 text-lg font-black text-purple-900 dark:text-purple-100"
          >
            {consensus.strongHireCount}
          </div>
        </div>

        {/* Hire */}
        <div className="rounded-xl bg-emerald-50/70 p-2.5 border border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/40">
          <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            Khuyến nghị tuyển
          </div>
          <div
            data-testid="count-hire"
            className="mt-1 text-lg font-black text-emerald-900 dark:text-emerald-100"
          >
            {consensus.hireCount}
          </div>
        </div>

        {/* Consider */}
        <div className="rounded-xl bg-amber-50/70 p-2.5 border border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/40">
          <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
            Cân nhắc
          </div>
          <div
            data-testid="count-consider"
            className="mt-1 text-lg font-black text-amber-900 dark:text-amber-100"
          >
            {consensus.considerCount}
          </div>
        </div>

        {/* Do Not Hire */}
        <div className="rounded-xl bg-rose-50/70 p-2.5 border border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/40">
          <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">
            Không tuyển
          </div>
          <div
            data-testid="count-do-not-hire"
            className="mt-1 text-lg font-black text-rose-900 dark:text-rose-100"
          >
            {consensus.doNotHireCount}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsensusGaugeCard;
