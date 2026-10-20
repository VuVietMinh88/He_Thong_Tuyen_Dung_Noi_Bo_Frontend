/**
 * Helper tính toán tỷ lệ đồng thuận, phân tích khoảng cách năng lực và tọa độ biểu đồ mạng nhện
 * Jira Task: TKNHTTDNB1-485 / User Story S7-02
 */

import type {
  EvaluationRoundItem,
  ConsensusSummary,
  ConsensusRecommendation,
  ConsensusLevel,
  CompetencyBenchmarkItem,
  CompetencyGapStatus,
  FinalHiringDecisionStatus,
  DecisionValidationErrors,
} from '../types/candidateEvaluationSummary';

/**
 * Tính toán tỷ lệ đồng thuận của hội đồng phỏng vấn (AC 1)
 */
export const calculateConsensusSummary = (rounds: EvaluationRoundItem[]): ConsensusSummary => {
  const allInterviewers = rounds.flatMap((r) => r.interviewers || []);
  const totalInterviewers = allInterviewers.length;

  if (totalInterviewers === 0) {
    return {
      totalInterviewers: 0,
      strongHireCount: 0,
      hireCount: 0,
      considerCount: 0,
      doNotHireCount: 0,
      positiveCount: 0,
      consensusPercentage: 0,
      consensusLevel: 'DIVIDED',
      consensusHeadline: 'Chưa có phiếu đánh giá nào được nộp',
      consensusNote: 'Đang chờ hội đồng hoàn tất các buổi phỏng vấn',
    };
  }

  let strongHireCount = 0;
  let hireCount = 0;
  let considerCount = 0;
  let doNotHireCount = 0;

  allInterviewers.forEach((inv) => {
    switch (inv.recommendation) {
      case 'STRONG_HIRE':
        strongHireCount++;
        break;
      case 'HIRE':
        hireCount++;
        break;
      case 'CONSIDER':
        considerCount++;
        break;
      case 'DO_NOT_HIRE':
        doNotHireCount++;
        break;
    }
  });

  const positiveCount = strongHireCount + hireCount;
  const consensusPercentage = Math.round((positiveCount / totalInterviewers) * 100);

  let consensusLevel: ConsensusLevel = 'DIVIDED';
  if (consensusPercentage === 100) {
    consensusLevel = 'UNANIMOUS';
  } else if (consensusPercentage >= 75) {
    consensusLevel = 'STRONG';
  } else if (consensusPercentage >= 50) {
    consensusLevel = 'MODERATE';
  }

  let headline = `${positiveCount}/${totalInterviewers} Khuyến nghị tuyển dụng (Strong Hire / Hire)`;
  if (consensusLevel === 'UNANIMOUS') {
    headline = `${positiveCount}/${totalInterviewers} Hội đồng đồng thuận tuyệt đối (Tuyển dụng)`;
  } else if (consensusLevel === 'DIVIDED') {
    headline = `${positiveCount}/${totalInterviewers} Có ý kiến trái chiều giữa các thành viên`;
  }

  return {
    totalInterviewers,
    strongHireCount,
    hireCount,
    considerCount,
    doNotHireCount,
    positiveCount,
    consensusPercentage,
    consensusLevel,
    consensusHeadline: headline,
    consensusNote:
      consensusLevel === 'UNANIMOUS' || consensusLevel === 'STRONG'
        ? 'Hội đồng thống nhất cao về năng lực và độ phù hợp của ứng viên.'
        : 'Có sự chênh lệch trong đánh giá, cần lưu ý ý kiến của các interviewer.',
  };
};

/**
 * Cấu hình hiển thị Badge cho từng mức khuyến nghị cá nhân
 */
export const getRecommendationBadgeConfig = (recommendation: ConsensusRecommendation) => {
  switch (recommendation) {
    case 'STRONG_HIRE':
      return {
        label: 'Tuyển dụng xuất sắc',
        shortLabel: 'Strong Hire',
        containerClass:
          'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
        dotClass: 'bg-purple-500',
        bgClass: 'bg-purple-600',
      };
    case 'HIRE':
      return {
        label: 'Khuyến nghị tuyển',
        shortLabel: 'Hire',
        containerClass:
          'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        dotClass: 'bg-emerald-500',
        bgClass: 'bg-emerald-600',
      };
    case 'CONSIDER':
      return {
        label: 'Cân nhắc / Dự phòng',
        shortLabel: 'Consider',
        containerClass:
          'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
        dotClass: 'bg-amber-500',
        bgClass: 'bg-amber-600',
      };
    case 'DO_NOT_HIRE':
    default:
      return {
        label: 'Không tuyển dụng',
        shortLabel: 'Do Not Hire',
        containerClass:
          'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
        dotClass: 'bg-rose-500',
        bgClass: 'bg-rose-600',
      };
  }
};

/**
 * Cấu hình hiển thị Thước đo mức độ đồng thuận (AC 1)
 */
export const getConsensusLevelBadgeConfig = (level: ConsensusLevel) => {
  switch (level) {
    case 'UNANIMOUS':
      return {
        label: 'Đồng thuận tuyệt đối (100%)',
        badgeClass:
          'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700',
        progressBarClass: 'bg-emerald-500',
        textColor: 'text-emerald-700 dark:text-emerald-300',
      };
    case 'STRONG':
      return {
        label: 'Đồng thuận cao',
        badgeClass:
          'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-700',
        progressBarClass: 'bg-blue-500',
        textColor: 'text-blue-700 dark:text-blue-300',
      };
    case 'MODERATE':
      return {
        label: 'Đồng thuận vừa',
        badgeClass:
          'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700',
        progressBarClass: 'bg-amber-500',
        textColor: 'text-amber-700 dark:text-amber-300',
      };
    case 'DIVIDED':
    default:
      return {
        label: 'Ý kiến trái chiều',
        badgeClass:
          'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-700',
        progressBarClass: 'bg-rose-500',
        textColor: 'text-rose-700 dark:text-rose-300',
      };
  }
};

/**
 * Phân loại khoảng cách năng lực (Gap Analysis: Vượt chuẩn, Đạt chuẩn, Dưới chuẩn) (AC 3)
 */
export const evaluateCompetencyGap = (score: number, targetScore: number): CompetencyGapStatus => {
  const diff = score - targetScore;
  if (diff >= 0.25) {
    return 'EXCEEDS';
  }
  if (diff <= -0.25) {
    return 'BELOW';
  }
  return 'MEETS';
};

export const getGapStatusBadgeConfig = (status: CompetencyGapStatus, gap: number) => {
  const formattedGap = gap >= 0 ? `+${gap.toFixed(2)}` : gap.toFixed(2);
  switch (status) {
    case 'EXCEEDS':
      return {
        label: `Vượt chuẩn (${formattedGap})`,
        shortLabel: 'Vượt chuẩn',
        containerClass:
          'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        dotClass: 'bg-emerald-500',
        iconName: 'TrendingUp',
      };
    case 'MEETS':
      return {
        label: `Đạt chuẩn (${formattedGap})`,
        shortLabel: 'Đạt chuẩn',
        containerClass:
          'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
        dotClass: 'bg-blue-500',
        iconName: 'Check',
      };
    case 'BELOW':
    default:
      return {
        label: `Dưới kỳ vọng (${formattedGap})`,
        shortLabel: 'Cần cải thiện',
        containerClass:
          'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
        dotClass: 'bg-amber-500',
        iconName: 'AlertCircle',
      };
  }
};

/**
 * Tính toán tọa độ biểu đồ mạng nhện SVG (AC 3)
 */
export interface RadarChartPoint {
  x: number;
  y: number;
  name: string;
  score: number;
  targetScore: number;
  angleDeg: number;
}

export const calculateRadarPoints = (
  benchmarks: CompetencyBenchmarkItem[],
  radius: number = 120,
  center: number = 160,
  maxScore: number = 5
): {
  candidatePolygonPoints: string;
  targetPolygonPoints: string;
  axes: Array<{
    x2: number;
    y2: number;
    labelX: number;
    labelY: number;
    benchmark: CompetencyBenchmarkItem;
  }>;
  candidatePoints: RadarChartPoint[];
  targetPoints: RadarChartPoint[];
} => {
  const total = benchmarks.length;
  if (total === 0) {
    return {
      candidatePolygonPoints: '',
      targetPolygonPoints: '',
      axes: [],
      candidatePoints: [],
      targetPoints: [],
    };
  }

  const axes: Array<{
    x2: number;
    y2: number;
    labelX: number;
    labelY: number;
    benchmark: CompetencyBenchmarkItem;
  }> = [];

  const candidatePoints: RadarChartPoint[] = [];
  const targetPoints: RadarChartPoint[] = [];

  benchmarks.forEach((item, index) => {
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2;
    const angleDeg = (angle * 180) / Math.PI;

    // Tọa độ trục ngoài cùng
    const x2 = center + radius * Math.cos(angle);
    const y2 = center + radius * Math.sin(angle);

    // Tọa độ nhãn bên ngoài
    const labelRadius = radius + 32;
    const labelX = center + labelRadius * Math.cos(angle);
    const labelY = center + labelRadius * Math.sin(angle);

    axes.push({ x2, y2, labelX, labelY, benchmark: item });

    // Điểm ứng viên
    const candR = radius * (Math.min(Math.max(item.score, 0), maxScore) / maxScore);
    const candX = center + candR * Math.cos(angle);
    const candY = center + candR * Math.sin(angle);
    candidatePoints.push({
      x: candX,
      y: candY,
      name: item.name,
      score: item.score,
      targetScore: item.targetScore,
      angleDeg,
    });

    // Điểm benchmark chuẩn
    const targetR = radius * (Math.min(Math.max(item.targetScore, 0), maxScore) / maxScore);
    const targetX = center + targetR * Math.cos(angle);
    const targetY = center + targetR * Math.sin(angle);
    targetPoints.push({
      x: targetX,
      y: targetY,
      name: item.name,
      score: item.score,
      targetScore: item.targetScore,
      angleDeg,
    });
  });

  const candidatePolygonPoints = candidatePoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const targetPolygonPoints = targetPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return {
    candidatePolygonPoints,
    targetPolygonPoints,
    axes,
    candidatePoints,
    targetPoints,
  };
};

/**
 * Định dạng tiền tệ VNĐ
 */
export const formatCurrencyVND = (amount?: number): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'Thỏa thuận';
  }
  return `${amount.toLocaleString('vi-VN')} ₫`;
};

/**
 * Cấu hình Badge cho Quyết định tuyển dụng cuối cùng (AC 4)
 */
export const getDecisionStatusBadgeConfig = (status: FinalHiringDecisionStatus) => {
  switch (status) {
    case 'OFFER':
      return {
        label: 'Đã đề xuất Offer',
        containerClass:
          'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700',
        badgeBg: 'bg-emerald-600',
        dotClass: 'bg-emerald-500',
      };
    case 'TALENT_POOL':
      return {
        label: 'Lưu trữ Kho tiềm năng',
        containerClass:
          'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700',
        badgeBg: 'bg-amber-600',
        dotClass: 'bg-amber-500',
      };
    case 'REJECT':
      return {
        label: 'Đã từ chối',
        containerClass:
          'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-700',
        badgeBg: 'bg-rose-600',
        dotClass: 'bg-rose-500',
      };
    case 'PENDING':
    default:
      return {
        label: 'Chờ ra quyết định',
        containerClass:
          'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        badgeBg: 'bg-slate-500',
        dotClass: 'bg-slate-400',
      };
  }
};

/**
 * Validate tính hợp lệ của quyết định tuyển dụng Offer hoặc Từ chối (AC 4 - Task TKNHTTDNB1-486)
 */
export const validateFinalHiringDecision = (
  status: FinalHiringDecisionStatus,
  data: {
    offeredSalary?: number;
    startDate?: string;
    responseDeadline?: string;
    rejectionReason?: string;
    notes?: string;
  }
): { isValid: boolean; errors: DecisionValidationErrors } => {
  const errors: DecisionValidationErrors = {};

  if (status === 'OFFER') {
    if (data.offeredSalary === undefined || data.offeredSalary === null || isNaN(data.offeredSalary) || data.offeredSalary <= 0) {
      errors.offeredSalary = 'Vui lòng nhập mức lương đề xuất hợp lệ (> 0 VNĐ)';
    }

    if (!data.startDate || !data.startDate.trim()) {
      errors.startDate = 'Vui lòng chọn ngày dự kiến gia nhập (Onboarding Date)';
    }

    if (!data.responseDeadline || !data.responseDeadline.trim()) {
      errors.responseDeadline = 'Vui lòng chọn hạn chót phản hồi offer';
    } else if (data.startDate && data.responseDeadline > data.startDate) {
      errors.responseDeadline = 'Hạn chót phản hồi offer phải trước hoặc cùng ngày gia nhập';
    }
  } else if (status === 'REJECT') {
    if (!data.rejectionReason || !data.rejectionReason.trim()) {
      errors.rejectionReason = 'Bắt buộc chọn lý do từ chối chính từ danh mục';
    } else if (data.rejectionReason === 'Lý do khác' && (!data.notes || !data.notes.trim())) {
      errors.notes = 'Vui lòng nhập chi tiết lý do từ chối vào phần ghi chú phản hồi';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

