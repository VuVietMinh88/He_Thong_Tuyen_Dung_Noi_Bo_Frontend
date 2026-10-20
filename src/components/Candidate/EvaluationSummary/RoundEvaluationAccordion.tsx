import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Award,
} from 'lucide-react';
import type { EvaluationRoundItem } from '../../../types/candidateEvaluationSummary';
import { getRecommendationBadgeConfig } from '../../../utils/candidateEvaluationSummaryHelper';

export interface RoundEvaluationAccordionProps {
  rounds: EvaluationRoundItem[];
}

export const RoundEvaluationAccordion: React.FC<RoundEvaluationAccordionProps> = ({ rounds }) => {
  // Mặc định mở toàn bộ các vòng phỏng vấn để Recruiter tiện đọc lướt
  const [openRounds, setOpenRounds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    rounds.forEach((r) => {
      initial[r.roundId] = true;
    });
    return initial;
  });

  const toggleRound = (roundId: string) => {
    setOpenRounds((prev) => ({
      ...prev,
      [roundId]: !prev[roundId],
    }));
  };

  const expandAll = () => {
    const updated: Record<string, boolean> = {};
    rounds.forEach((r) => {
      updated[r.roundId] = true;
    });
    setOpenRounds(updated);
  };

  const collapseAll = () => {
    setOpenRounds({});
  };

  return (
    <div
      data-testid="round-evaluation-accordion"
      className="space-y-4"
    >
      {/* Header & Thao tác mở rộng */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span>Chi tiết đánh giá theo từng vòng phỏng vấn</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Tổng hợp ý kiến độc lập, điểm số tiêu chí và kết luận từ các thành viên hội đồng
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={expandAll}
            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 hover:underline font-semibold"
          >
            Mở rộng tất cả
          </button>
          <span className="text-gray-300 dark:text-gray-700">•</span>
          <button
            type="button"
            onClick={collapseAll}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:underline"
          >
            Thu gọn tất cả
          </button>
        </div>
      </div>

      {/* Danh sách các vòng */}
      <div className="space-y-3.5">
        {rounds.map((round) => {
          const isOpen = !!openRounds[round.roundId];

          return (
            <div
              key={round.roundId}
              data-testid={`round-card-${round.roundId}`}
              className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden dark:border-gray-800 dark:bg-gray-900 transition-all"
            >
              {/* Thanh tiêu đề vòng (Click để toggle) */}
              <button
                type="button"
                data-testid={`btn-toggle-round-${round.roundId}`}
                onClick={() => toggleRound(round.roundId)}
                className="w-full flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-gray-50/70 hover:bg-gray-100/70 dark:bg-gray-850/60 dark:hover:bg-gray-800/60 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-2xs">
                    {round.roundOrder}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      {round.roundName}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {round.roundDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span>{round.roundDate}</span>
                        </span>
                      )}
                      {round.format && (
                        <span className="rounded-md bg-gray-200/70 px-1.5 py-0.2 text-[10px] font-semibold text-gray-700 dark:bg-gray-750 dark:text-gray-300">
                          {round.format === 'ONLINE' ? 'Trực tuyến' : 'Trực tiếp'}
                        </span>
                      )}
                      {round.locationOrLink && (
                        <span className="flex items-center gap-1 max-w-[240px] truncate">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span>{round.locationOrLink}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Điểm trung bình của vòng */}
                  <div className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                      Điểm vòng:
                    </span>
                    <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                      {round.averageScore.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-gray-400">/ 5.0</span>
                  </div>

                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Nội dung chi tiết các Interviewer trong vòng khi mở */}
              {isOpen && (
                <div className="p-5 divide-y divide-gray-100 dark:divide-gray-800 animate-in fade-in duration-200">
                  {/* Tóm lược chung của vòng nếu có */}
                  {round.roundSummary && (
                    <div className="pb-4 text-xs text-gray-600 dark:text-gray-300 italic flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span>{round.roundSummary}</span>
                    </div>
                  )}

                  {round.interviewers.map((inv) => {
                    const badgeCfg = getRecommendationBadgeConfig(inv.recommendation);

                    return (
                      <div
                        key={inv.interviewerId}
                        data-testid={`interviewer-detail-${inv.interviewerId}`}
                        className="pt-4 first:pt-0"
                      >
                        {/* Thông tin Interviewer & Đề xuất */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {inv.interviewerAvatar ? (
                              <img
                                src={inv.interviewerAvatar}
                                alt={inv.interviewerName}
                                className="h-10 w-10 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                                {inv.interviewerName.charAt(0)}
                              </div>
                            )}

                            <div>
                              <div className="text-sm font-bold text-gray-900 dark:text-white">
                                {inv.interviewerName}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {inv.interviewerRole}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Điểm người này chấm */}
                            <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-bold text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                              {`${inv.overallScore.toFixed(1)} / 5.0`}
                            </span>

                            {/* Badge khuyến nghị */}
                            <span
                              data-testid={`badge-recommendation-${inv.interviewerId}`}
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border ${badgeCfg.containerClass}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${badgeCfg.dotClass}`} />
                              <span>{badgeCfg.label}</span>
                            </span>
                          </div>
                        </div>

                        {/* Nhận xét chi tiết */}
                        <div className="mt-3 rounded-xl bg-gray-50/70 p-3 text-xs text-gray-700 leading-relaxed dark:bg-gray-800/50 dark:text-gray-300 border border-gray-100 dark:border-gray-800">
                          {inv.comment}
                        </div>

                        {/* Điểm mạnh & Điểm cần lưu ý */}
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {/* Điểm mạnh (Strengths) */}
                          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                            <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Điểm mạnh nổi bật (Strengths)</span>
                            </div>
                            {inv.strengths && inv.strengths.length > 0 ? (
                              <ul className="space-y-1 text-emerald-900/80 dark:text-emerald-200/90 pl-5 list-disc text-[11px]">
                                {inv.strengths.map((str, idx) => (
                                  <li key={idx}>{str}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-[11px] text-gray-400 italic">Không có ghi chú</p>
                            )}
                          </div>

                          {/* Điểm cần lưu ý (Concerns) */}
                          <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                            <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-1.5">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                              <span>Điểm cần lưu ý / Rủi ro (Concerns)</span>
                            </div>
                            {inv.concerns && inv.concerns.length > 0 ? (
                              <ul className="space-y-1 text-amber-900/80 dark:text-amber-200/90 pl-5 list-disc text-[11px]">
                                {inv.concerns.map((con, idx) => (
                                  <li key={idx}>{con}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-[11px] text-gray-400 italic">
                                Không ghi nhận rủi ro đáng kể
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Điểm thành phần từng tiêu chí nếu có */}
                        {inv.criterionScores && inv.criterionScores.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                            {inv.criterionScores.map((cs) => (
                              <span
                                key={cs.criterionId}
                                className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                              >
                                <span>{cs.criterionName}:</span>
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                  {cs.score.toFixed(1)}
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoundEvaluationAccordion;
