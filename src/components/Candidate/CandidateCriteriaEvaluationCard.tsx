import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Briefcase,
  GraduationCap,
  Wrench,
  Award,
  HelpCircle,
  Info,
} from 'lucide-react';
import type {
  CandidateMatchingEvaluation,
  MandatoryCriterionKey,
} from '../../types/candidate';
import {
  MANDATORY_CRITERIA_DISCLAIMER_NOTE,
  getMatchingScoreColorClass,
  getMatchingStatusBadgeConfig,
} from '../../utils/candidateMatchingHelper';

export interface CandidateCriteriaEvaluationCardProps {
  evaluation: CandidateMatchingEvaluation;
  className?: string;
}

const getCriterionIcon = (key: MandatoryCriterionKey) => {
  switch (key) {
    case 'EXPERIENCE':
      return Briefcase;
    case 'EDUCATION':
      return GraduationCap;
    case 'SKILLS':
      return Wrench;
    default:
      return HelpCircle;
  }
};

/**
 * Thẻ "Đánh giá tiêu chí bắt buộc & Điểm phù hợp" dành cho trang Chi tiết hồ sơ (AC 2)
 */
export const CandidateCriteriaEvaluationCard: React.FC<
  CandidateCriteriaEvaluationCardProps
> = ({ evaluation, className = '' }) => {
  const { totalMatchingScore, isOverallPassed, criteriaList, summaryText } = evaluation;
  const scoreColorConfig = getMatchingScoreColorClass(totalMatchingScore);
  const statusBadgeConfig = getMatchingStatusBadgeConfig(isOverallPassed);

  const passedCriteriaCount = criteriaList.filter(
    (criterionItem) => criterionItem.isPassed
  ).length;
  const totalCriteriaCount = criteriaList.length;

  return (
    <div
      id="candidate-criteria-evaluation-card"
      data-testid="candidate-criteria-evaluation-card"
      className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      {/* 1. Header Thẻ đánh giá */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Đánh giá tiêu chí bắt buộc & Điểm phù hợp
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Đối chiếu tự động giữa yêu cầu vị trí tuyển dụng và dữ liệu hồ sơ
            </p>
          </div>
        </div>

        {/* Cờ tổng quát Đạt / Không đạt */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            data-testid="criteria-overall-status-badge"
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold ${statusBadgeConfig.containerClass}`}
          >
            {isOverallPassed ? (
              <CheckCircle2 className={`h-4 w-4 shrink-0 ${statusBadgeConfig.iconClass}`} />
            ) : (
              <XCircle className={`h-4 w-4 shrink-0 ${statusBadgeConfig.iconClass}`} />
            )}
            <span>{`Tổng quát: ${statusBadgeConfig.label}`}</span>
          </span>
        </div>
      </div>

      {/* 2. Cụm điểm tổng phù hợp & Tiến độ */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Điểm tổng phù hợp */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-850">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Điểm tổng phù hợp
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              data-testid="total-matching-score-value"
              className={`text-3xl font-black ${scoreColorConfig.scoreTextClass}`}
            >
              {totalMatchingScore}
            </span>
            <span className="text-sm font-semibold text-gray-400">/ 100</span>
          </div>

          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className={`h-full transition-all duration-500 ${scoreColorConfig.progressBarClass}`}
              style={{ width: `${Math.min(100, Math.max(0, totalMatchingScore))}%` }}
            />
          </div>
        </div>

        {/* Tóm tắt tiêu chí đạt */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-850 sm:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Kết quả đáp ứng tiêu chuẩn
          </span>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {`Đạt ${passedCriteriaCount} / ${totalCriteriaCount} tiêu chí bắt buộc`}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
            {summaryText ||
              `Ứng viên đã thỏa mãn ${passedCriteriaCount} trên tổng số ${totalCriteriaCount} tiêu chí then chốt của vị trí.`}
          </p>
        </div>
      </div>

      {/* 3. Bảng đối chiếu chi tiết 3 điều kiện bắt buộc */}
      <div className="mt-5 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-xs dark:divide-gray-800">
            <thead className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:bg-gray-800/80 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Tiêu chí bắt buộc
                </th>
                <th scope="col" className="px-4 py-3">
                  Yêu cầu vị trí tuyển dụng
                </th>
                <th scope="col" className="px-4 py-3">
                  Dữ liệu hồ sơ ứng viên
                </th>
                <th scope="col" className="px-4 py-3 text-center">
                  Kết quả
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
              {criteriaList.map((criterionItem) => {
                const IconComponent = getCriterionIcon(criterionItem.criterionKey);

                return (
                  <tr
                    key={criterionItem.id}
                    data-testid={`criterion-row-${criterionItem.criterionKey.toLowerCase()}`}
                    className="transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/50"
                  >
                    {/* Cột 1: Tên tiêu chí */}
                    <td className="px-4 py-3.5 whitespace-nowrap font-semibold text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                          <IconComponent className="h-3.5 w-3.5" />
                        </div>
                        <span>{criterionItem.criterionName}</span>
                      </div>
                    </td>

                    {/* Cột 2: Yêu cầu của vị trí */}
                    <td className="px-4 py-3.5 text-gray-600 dark:text-gray-300">
                      <span>{criterionItem.jobRequirement}</span>
                    </td>

                    {/* Cột 3: Hồ sơ ứng viên */}
                    <td className="px-4 py-3.5 font-medium text-gray-800 dark:text-gray-200">
                      <span>{criterionItem.candidateValue}</span>
                    </td>

                    {/* Cột 4: Badge Đạt / Không đạt */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {criterionItem.isPassed ? (
                        <span
                          data-testid={`badge-passed-${criterionItem.criterionKey.toLowerCase()}`}
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          Đạt
                        </span>
                      ) : (
                        <span
                          data-testid={`badge-failed-${criterionItem.criterionKey.toLowerCase()}`}
                          className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-1 text-xs font-bold text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                        >
                          <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                          Không đạt
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Dòng chú thích nghiệp vụ bắt buộc theo đặc tả (AC 2) */}
      <div
        id="criteria-disclaimer-note-banner"
        data-testid="criteria-disclaimer-note-banner"
        className="mt-4 flex items-start gap-2.5 rounded-xl bg-amber-50/80 p-3 text-xs text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900"
      >
        <Info className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <span className="leading-relaxed font-medium">
          {MANDATORY_CRITERIA_DISCLAIMER_NOTE}
        </span>
      </div>
    </div>
  );
};

export default CandidateCriteriaEvaluationCard;
