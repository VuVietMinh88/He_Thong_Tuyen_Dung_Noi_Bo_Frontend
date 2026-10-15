/**
 * Helper tính toán và đánh dấu điểm nổi bật (Highlights) cho Bảng so sánh ứng viên vòng cuối
 * Jira Task: TKNHTTDNB1-470 / User Story S7-01
 */

import type {
  ComparisonCandidate,
  CriteriaHighlightMap,
  CompetencyCriterionKey,
  InterviewerRecommendation,
  HiringDecisionStatus,
  EvaluationProgress,
} from '../types/candidateComparison';

/**
 * Tính toán ứng viên có điểm số cao nhất (hoặc tốt nhất) ở từng trục tiêu chí
 * Hỗ trợ đánh dấu Highlight màu xanh (AC 3)
 */
export const calculateComparisonHighlights = (
  candidates: ComparisonCandidate[]
): CriteriaHighlightMap => {
  if (!candidates || candidates.length === 0) {
    return {};
  }

  const highlightMap: CriteriaHighlightMap = {};

  const competencyKeys: CompetencyCriterionKey[] = [
    'technical',
    'attitude',
    'language',
    'cultureFit',
    'softSkills',
    'overall',
  ];

  // 1. Tìm điểm cao nhất cho các tiêu chí năng lực
  competencyKeys.forEach((key) => {
    let maxVal = -1;
    const bestIds: string[] = [];

    candidates.forEach((cand) => {
      const score = cand.competencyScores?.[key] ?? 0;
      if (score > maxVal) {
        maxVal = score;
        bestIds.length = 0;
        bestIds.push(cand.id);
      } else if (score === maxVal && maxVal > 0) {
        bestIds.push(cand.id);
      }
    });

    if (maxVal > 0 && bestIds.length > 0) {
      highlightMap[key] = {
        bestValue: maxVal,
        candidateIds: bestIds,
        isTie: bestIds.length > 1,
      };
    }
  });

  // 2. Tiêu chí kinh nghiệm (năm)
  let maxExp = -1;
  const bestExpIds: string[] = [];
  candidates.forEach((cand) => {
    const exp = cand.experienceYears ?? 0;
    if (exp > maxExp) {
      maxExp = exp;
      bestExpIds.length = 0;
      bestExpIds.push(cand.id);
    } else if (exp === maxExp && maxExp > 0) {
      bestExpIds.push(cand.id);
    }
  });
  if (maxExp > 0 && bestExpIds.length > 0) {
    highlightMap.experienceYears = {
      bestValue: maxExp,
      candidateIds: bestExpIds,
      isTie: bestExpIds.length > 1,
    };
  }

  // 3. Tiêu chí điểm khớp sơ bộ (matching score)
  let maxMatching = -1;
  const bestMatchingIds: string[] = [];
  candidates.forEach((cand) => {
    const score = cand.matchingScore ?? 0;
    if (score > maxMatching) {
      maxMatching = score;
      bestMatchingIds.length = 0;
      bestMatchingIds.push(cand.id);
    } else if (score === maxMatching && maxMatching > 0) {
      bestMatchingIds.push(cand.id);
    }
  });
  if (maxMatching > 0 && bestMatchingIds.length > 0) {
    highlightMap.matchingScore = {
      bestValue: maxMatching,
      candidateIds: bestMatchingIds,
      isTie: bestMatchingIds.length > 1,
    };
  }

  return highlightMap;
};

/**
 * Kiểm tra xem ứng viên có phải là ứng viên đạt điểm cao nhất ở tiêu chí này hay không
 */
export const isCandidateTopInCriterion = (
  highlightMap: CriteriaHighlightMap,
  criterionKey: keyof CriteriaHighlightMap,
  candidateId: string
): boolean => {
  const highlight = highlightMap[criterionKey];
  if (!highlight) return false;
  return highlight.candidateIds.includes(candidateId);
};

/**
 * Định dạng tiền tệ VNĐ (ví dụ: 35.000.000 ₫)
 */
export const formatCurrencyVND = (amount?: number): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'Thỏa thuận';
  }
  return `${amount.toLocaleString('vi-VN')} ₫`;
};

/**
 * Cấu hình hiển thị Badge cho Nhận xét người phỏng vấn
 */
export const getRecommendationBadgeConfig = (conclusion: InterviewerRecommendation) => {
  switch (conclusion) {
    case 'RECOMMENDED':
      return {
        label: 'Nên tuyển',
        containerClass:
          'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        dotClass: 'bg-emerald-500',
      };
    case 'CONSIDER':
      return {
        label: 'Cân nhắc',
        containerClass:
          'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
        dotClass: 'bg-amber-500',
      };
    case 'NOT_RECOMMENDED':
      return {
        label: 'Không nên tuyển',
        containerClass:
          'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
        dotClass: 'bg-rose-500',
      };
    default:
      return {
        label: 'Chưa đánh giá',
        containerClass: 'bg-gray-100 text-gray-700 border-gray-200',
        dotClass: 'bg-gray-400',
      };
  }
};

/**
 * Cấu hình hiển thị Badge cho Quyết định tuyển dụng
 */
export const getDecisionBadgeConfig = (status?: HiringDecisionStatus) => {
  switch (status) {
    case 'OFFER':
      return {
        label: 'Đề xuất Offer',
        containerClass:
          'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-200 dark:border-emerald-700',
        badgeBg: 'bg-emerald-600',
      };
    case 'BACKUP':
      return {
        label: 'Dự phòng (Talent Pool)',
        containerClass:
          'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-700',
        badgeBg: 'bg-amber-600',
      };
    case 'REJECT':
      return {
        label: 'Chưa phù hợp',
        containerClass:
          'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/60 dark:text-rose-200 dark:border-rose-700',
        badgeBg: 'bg-rose-600',
      };
    case 'PENDING':
    default:
      return {
        label: 'Chờ quyết định',
        containerClass:
          'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        badgeBg: 'bg-slate-500',
      };
  }
};

/**
 * Cấu hình màu cho điểm số năng lực (thang 1 - 5)
 */
export const getScoreColorClass = (score: number) => {
  if (score >= 4.5) {
    return {
      text: 'text-emerald-700 dark:text-emerald-300',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-200 dark:border-emerald-800',
      progress: 'bg-emerald-500',
    };
  }
  if (score >= 4.0) {
    return {
      text: 'text-blue-700 dark:text-blue-300',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      border: 'border-blue-200 dark:border-blue-800',
      progress: 'bg-blue-500',
    };
  }
  if (score >= 3.0) {
    return {
      text: 'text-amber-700 dark:text-amber-300',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-200 dark:border-amber-800',
      progress: 'bg-amber-500',
    };
  }
  return {
    text: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-800',
    progress: 'bg-rose-500',
  };
};

/**
 * Tính phần trăm điểm (Thang 5.0)
 */
export const getScorePercentage = (score: number): number => {
  return Math.min(Math.max((score / 5) * 100, 0), 100);
};

/**
 * Kiểm tra xem ứng viên đã được tất cả thành viên Hội đồng nộp đủ phiếu đánh giá hay chưa (AC 2)
 */
export const isCandidateFullyEvaluated = (candidate: ComparisonCandidate): boolean => {
  if (candidate.evaluationProgress) {
    return candidate.evaluationProgress.isFullyEvaluated;
  }
  // Fallback: nếu có tối thiểu 2 đánh giá của hội đồng phỏng vấn
  return (candidate.interviewerFeedbacks?.length ?? 0) >= 2;
};

/**
 * Cấu hình huy hiệu hiển thị tiến độ nộp đánh giá của từng ứng viên (AC 1)
 * Ví dụ: "3/3 Đã đánh giá" - Xanh lá, "1/3 Đang chờ" - Vàng cam
 */
export const getEvaluationProgressBadgeConfig = (progress?: EvaluationProgress) => {
  if (!progress) {
    return {
      label: 'Chưa có thông tin',
      containerClass:
        'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-750',
      dotClass: 'bg-slate-400',
      isReady: false,
      tooltip: 'Chưa có dữ liệu tiến độ đánh giá',
    };
  }

  const { completedCount, requiredCount, isFullyEvaluated, pendingInterviewerNames } = progress;

  if (isFullyEvaluated) {
    return {
      label: `${completedCount}/${requiredCount} Đã đánh giá`,
      containerClass:
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      dotClass: 'bg-emerald-500',
      isReady: true,
      tooltip: 'Toàn bộ thành viên Hội đồng đã hoàn tất nộp phiếu đánh giá.',
    };
  }

  const pendingText =
    pendingInterviewerNames && pendingInterviewerNames.length > 0
      ? `Đang chờ: ${pendingInterviewerNames.join(', ')}`
      : 'Ứng viên chưa hoàn thành đủ các phiếu đánh giá';

  return {
    label: `${completedCount}/${requiredCount} Đang chờ`,
    containerClass:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    dotClass: 'bg-amber-500',
    isReady: false,
    tooltip: pendingText,
  };
};
