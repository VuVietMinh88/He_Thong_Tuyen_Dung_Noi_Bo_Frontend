import type {
  EvaluationCriterionItem,
  CriterionEvaluationRecord,
  InterviewConclusion,
  InterviewEvaluationAccessParams,
  ReopenEvaluationStatus,
} from '../types/interviewEvaluation';
import { tokenService } from '../services/token.service';

/**
 * Danh sách tiêu chí mẫu tiêu chuẩn khi chưa cấu hình khung năng lực đặc thù
 * Đảm bảo tổng trọng số luôn bằng đúng 100%
 */
export const DEFAULT_TECHNICAL_EVALUATION_CRITERIA: EvaluationCriterionItem[] = [
  {
    id: 'crit-tech-01',
    name: 'Kiến thức chuyên môn cốt lõi',
    description: 'Nắm vững kiến thức nền tảng, công nghệ chính và các best practices trong lĩnh vực ứng tuyển',
    weight: 35,
    sortOrder: 1,
  },
  {
    id: 'crit-tech-02',
    name: 'Tư duy logic & Giải quyết vấn đề',
    description: 'Khả năng phân tích bài toán thực tế, tìm nguyên nhân gốc rễ và đưa ra giải pháp tối ưu',
    weight: 25,
    sortOrder: 2,
  },
  {
    id: 'crit-tech-03',
    name: 'Kỹ năng làm việc nhóm & Giao tiếp',
    description: 'Truyền đạt ý tưởng mạch lạc, lắng nghe phản hồi và phối hợp hiệu quả trong tập thể',
    weight: 20,
    sortOrder: 3,
  },
  {
    id: 'crit-tech-04',
    name: 'Độ phù hợp văn hóa & Tinh thần học hỏi',
    description: 'Thái độ chủ động, tinh thần trách nhiệm và mong muốn phát triển lâu dài cùng tổ chức',
    weight: 20,
    sortOrder: 4,
  },
];

/**
 * Lấy danh sách tiêu chí phù hợp với vị trí ứng tuyển nếu chưa có cấu hình từ Backend
 */
export const resolveEvaluationCriteriaForJob = (
  jobTitle?: string,
  configuredCriteria?: EvaluationCriterionItem[],
): EvaluationCriterionItem[] => {
  // Vì nếu đã có cấu hình tiêu chí chính thức từ Backend thì ưu tiên sử dụng
  if (configuredCriteria && configuredCriteria.length > 0) {
    return configuredCriteria;
  }

  const titleLower = (jobTitle || '').toLowerCase();

  // Tiêu chí cho vị trí Quản lý / Tech Lead
  if (titleLower.includes('lead') || titleLower.includes('trưởng') || titleLower.includes('manager')) {
    return [
      {
        id: 'crit-lead-01',
        name: 'Tầm nhìn kỹ thuật & Kiến trúc hệ thống',
        description: 'Định hướng công nghệ, thiết kế kiến trúc và kiểm soát rủi ro kỹ thuật dự án',
        weight: 30,
        sortOrder: 1,
      },
      {
        id: 'crit-lead-02',
        name: 'Năng lực lãnh đạo & Quản lý đội ngũ',
        description: 'Phân công công việc, giải quyết xung đột và thúc đẩy hiệu suất làm việc nhóm',
        weight: 30,
        sortOrder: 2,
      },
      {
        id: 'crit-lead-03',
        name: 'Đào tạo & Phát triển nhân sự',
        description: 'Huấn luyện (mentoring), nâng cao năng lực cho các thành viên trong nhóm',
        weight: 20,
        sortOrder: 3,
      },
      {
        id: 'crit-lead-04',
        name: 'Giao tiếp & Phối hợp liên phòng ban',
        description: 'Làm việc hiệu quả với Product, Quản lý dự án và các bên liên quan',
        weight: 20,
        sortOrder: 4,
      },
    ];
  }

  // Tiêu chí cho vị trí QA / Tester
  if (titleLower.includes('qa') || titleLower.includes('test') || titleLower.includes('kiểm thử')) {
    return [
      {
        id: 'crit-qa-01',
        name: 'Tư duy kiểm thử & Thiết kế kịch bản test',
        description: 'Nắm vững quy trình QA/QC, kỹ thuật phân tích và thiết kế test cases bao phủ',
        weight: 35,
        sortOrder: 1,
      },
      {
        id: 'crit-qa-02',
        name: 'Kỹ năng automation & Công cụ kiểm thử',
        description: 'Khả năng viết test tự động, sử dụng tool kiểm thử API, Performance',
        weight: 25,
        sortOrder: 2,
      },
      {
        id: 'crit-qa-03',
        name: 'Sự tỉ mỉ & Tư duy chất lượng sản phẩm',
        description: 'Phát hiện lỗi tiềm ẩn, chú trọng trải nghiệm người dùng cuối',
        weight: 20,
        sortOrder: 3,
      },
      {
        id: 'crit-qa-04',
        name: 'Kỹ năng phối hợp & Báo cáo lỗi',
        description: 'Báo cáo lỗi rõ ràng, phối hợp chặt chẽ với Developer để sửa lỗi nhanh',
        weight: 20,
        sortOrder: 4,
      },
    ];
  }

  // Tiêu chí mặc định tiêu chuẩn
  return DEFAULT_TECHNICAL_EVALUATION_CRITERIA;
};

/**
 * Tính điểm tổng theo trọng số theo đúng công thức: Tổng các (Điểm * Trọng số)
 * (Subtask TKNHTTDNB1-458 / AC 1)
 *
 * Vì trọng số của tiêu chí trong hệ thống thường lưu dạng phần trăm (1 - 100%),
 * hàm sẽ quy đổi về tỷ lệ thập phân (criteriaWeight / 100) để điểm tổng luôn phản ánh đúng
 * trên thang điểm đánh giá 5.0. Nếu trọng số đã ở dạng thập phân (<= 1), giữ nguyên.
 */
export const calculateWeightedScore = (
  criteriaList: EvaluationCriterionItem[],
  evaluations: Record<string, { score: number | null }>,
): number | null => {
  if (!criteriaList || criteriaList.length === 0) return null;

  // Tính tổng trọng số khai báo để xác định dạng phần trăm (> 1.5) hay dạng thập phân (<= 1)
  const totalRawWeight = criteriaList.reduce((accumulatedSum, criterionItem) => {
    return accumulatedSum + (criterionItem.weight || 0);
  }, 0);
  const isPercentageWeight = totalRawWeight > 1.5;

  let totalWeightedScore = 0;
  let scoredCriteriaCount = 0;

  for (const criterionItem of criteriaList) {
    const evaluationRecord = evaluations[criterionItem.id];
    const scoreValue = evaluationRecord?.score;

    if (scoreValue !== null && scoreValue !== undefined && !isNaN(scoreValue)) {
      scoredCriteriaCount += 1;
      const criteriaWeight = criterionItem.weight || 0;
      const normalizedWeight = isPercentageWeight ? criteriaWeight / 100 : criteriaWeight;

      // Công thức: Điểm * Trọng số
      totalWeightedScore += scoreValue * normalizedWeight;
    }
  }

  // Nếu người phỏng vấn chưa nhập bất kỳ điểm số nào, trả về null để UI hiển thị dạng placeholder '--'
  if (scoredCriteriaCount === 0) return null;

  // Làm tròn chuẩn xác 2 chữ số thập phân
  return Math.round(totalWeightedScore * 100) / 100;
};

/**
 * Tính phần đóng góp điểm số của 1 tiêu chí đơn lẻ: (Điểm * Trọng số)
 */
export const calculateCriterionWeightedContribution = (
  scoreValue: number | null | undefined,
  criteriaWeight: number,
): number | null => {
  if (scoreValue === null || scoreValue === undefined || isNaN(scoreValue)) {
    return null;
  }
  const isPercentage = criteriaWeight > 1.5;
  const normalizedWeight = isPercentage ? criteriaWeight / 100 : criteriaWeight;
  return Math.round(scoreValue * normalizedWeight * 100) / 100;
};

/**
 * Kiểm tra tính hợp lệ của điểm số cho từng tiêu chí đánh giá (AC 2)
 * Báo lỗi màu đỏ nếu điểm bị bỏ trống hoặc nằm ngoài khoảng 1–5
 */
export const validateCriterionScore = (
  scoreValue: number | null | undefined,
): string | null => {
  // Điểm bị bỏ trống
  if (scoreValue === null || scoreValue === undefined) {
    return 'Vui lòng chọn điểm đánh giá cho tiêu chí này (từ 1 đến 5).';
  }

  // Điểm không phải số hoặc nằm ngoài khoảng 1 - 5
  if (typeof scoreValue !== 'number' || isNaN(scoreValue) || scoreValue < 1 || scoreValue > 5) {
    return 'Điểm đánh giá không hợp lệ. Vui lòng chọn điểm trong khoảng từ 1 đến 5.';
  }

  return null;
};

/**
 * Kiểm tra toàn diện danh sách tiêu chí khi thực hiện lưu hoặc gửi đánh giá (AC 2)
 */
export const validateAllCriteriaEvaluations = (
  criteriaList: EvaluationCriterionItem[],
  evaluations: Record<string, { score: number | null }>,
): {
  isValid: boolean;
  errors: Record<string, string>;
  firstInvalidCriterionId?: string;
} => {
  const errors: Record<string, string> = {};
  let firstInvalidCriterionId: string | undefined;

  for (const criterionItem of criteriaList) {
    const evaluationRecord = evaluations[criterionItem.id];
    const validationError = validateCriterionScore(evaluationRecord?.score);

    if (validationError) {
      errors[criterionItem.id] = validationError;
      if (!firstInvalidCriterionId) {
        firstInvalidCriterionId = criterionItem.id;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    firstInvalidCriterionId,
  };
};

/**
 * Tính toán điểm tổng trọng số từ các tiêu chí đã chấm (tương thích ngược phiên bản cũ)
 */
export const calculateEvaluationWeightedTotal = (
  evaluations: Record<string, Pick<CriterionEvaluationRecord, 'score' | 'weight'>>,
): number | null => {
  const records = Object.values(evaluations);
  if (records.length === 0) return null;

  let totalWeighted = 0;
  let totalWeight = 0;
  let scoredCount = 0;

  records.forEach((recordItem) => {
    if (recordItem.score !== null && recordItem.score !== undefined) {
      scoredCount += 1;
      totalWeighted += recordItem.score * (recordItem.weight / 100);
      totalWeight += recordItem.weight;
    }
  });

  if (scoredCount === 0 || totalWeight <= 0) return null;

  // Chuẩn hóa theo tỷ lệ phần trăm trọng số đã chấm
  const finalScore = totalWeighted / (totalWeight / 100);
  return Math.round(finalScore * 100) / 100;
};

/**
 * Kiểm tra tính bắt buộc của kết luận phỏng vấn trước khi nộp phiếu (AC 2 - TKNHTTDNB1-464)
 * Người phỏng vấn bắt buộc phải chọn 1 trong 3 kết luận: Nên tuyển, Cân nhắc hoặc Không nên tuyển
 */
export const validateInterviewConclusion = (
  conclusionValue: InterviewConclusion | null | undefined,
): string | null => {
  if (!conclusionValue) {
    return 'Vui lòng chọn kết luận phỏng vấn (Nên tuyển, Cân nhắc hoặc Không nên tuyển) trước khi nộp phiếu.';
  }

  const validConclusions: InterviewConclusion[] = [
    'RECOMMENDED',
    'CONSIDER',
    'NOT_RECOMMENDED',
  ];

  if (!validConclusions.includes(conclusionValue)) {
    return 'Kết luận phỏng vấn không hợp lệ.';
  }

  return null;
};

/**
 * Kiểm tra phân quyền truy cập phiếu đánh giá phỏng vấn (AC 1 - TKNHTTDNB1-464)
 * Chỉ người được mời phỏng vấn mới có quyền xem và điền phiếu này.
 */
export const checkInterviewEvaluationAccess = (
  accessParams: InterviewEvaluationAccessParams,
): boolean => {
  // Nếu có prop isAuthorized được truyền tường minh, ưu tiên giá trị này
  if (typeof accessParams.isAuthorized === 'boolean') {
    return accessParams.isAuthorized;
  }

  // Danh sách ID người phỏng vấn được mời
  const assignedInterviewerIds: string[] = [
    ...(accessParams.interviewerIds || []),
    ...(accessParams.interviewers?.map((interviewer) => interviewer.id).filter(Boolean) as string[] || []),
  ];

  // Danh sách email người phỏng vấn được mời
  const assignedInterviewerEmails: string[] = [
    ...(accessParams.interviewerEmails || []),
    ...(accessParams.interviewers?.map((interviewer) => interviewer.email).filter(Boolean) as string[] || []),
  ].map((emailAddress) => emailAddress.toLowerCase().trim());

  // Nếu không chỉ định bất kỳ danh sách người phỏng vấn nào,
  // cho phép truy cập để tương thích với các màn hình trước đó chưa truyền danh sách ID
  if (assignedInterviewerIds.length === 0 && assignedInterviewerEmails.length === 0) {
    return true;
  }

  // Lấy thông tin tài khoản người dùng hiện tại
  let currentUserId = accessParams.currentUserId;
  let currentUserEmail = accessParams.currentUserEmail;

  if (!currentUserId || !currentUserEmail) {
    const loggedInUserData = tokenService.getUserData();
    if (loggedInUserData) {
      if (!currentUserId && loggedInUserData.id) {
        currentUserId = loggedInUserData.id;
      }
      if (!currentUserEmail && loggedInUserData.email) {
        currentUserEmail = loggedInUserData.email;
      }
    }
  }

  const normalizedUserEmail = currentUserEmail ? currentUserEmail.toLowerCase().trim() : '';

  // Khớp theo ID tài khoản
  const hasMatchedId = Boolean(
    currentUserId && assignedInterviewerIds.includes(currentUserId),
  );

  // Khớp theo địa chỉ Email
  const hasMatchedEmail = Boolean(
    normalizedUserEmail && assignedInterviewerEmails.includes(normalizedUserEmail),
  );

  return hasMatchedId || hasMatchedEmail;
};

export const REOPEN_EVALUATION_WINDOW_HOURS = 24;
export const REOPEN_EVALUATION_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Tính toán thời gian còn lại cho phép Recruiter mở lại phiếu đã nộp (AC 1 - TKNHTTDNB1-465)
 * Giới hạn mở lại: 24 giờ kể từ thời điểm nộp (submittedAt). Quá 24 giờ thì hết hạn.
 */
export const calculateRemainingReopenTime = (
  submittedAt?: string | null,
  currentTimestamp: number = Date.now(),
): ReopenEvaluationStatus => {
  if (!submittedAt) {
    return {
      canReopen: false,
      isExpired: false,
      timeRemainingFormatted: 'Chưa có thông tin nộp phiếu',
      remainingMs: 0,
      hoursRemaining: 0,
      minutesRemaining: 0,
    };
  }

  const submittedTime = new Date(submittedAt).getTime();
  if (isNaN(submittedTime)) {
    return {
      canReopen: false,
      isExpired: true,
      timeRemainingFormatted: 'Thời điểm nộp không hợp lệ',
      remainingMs: 0,
      hoursRemaining: 0,
      minutesRemaining: 0,
    };
  }

  const deadline = submittedTime + REOPEN_EVALUATION_WINDOW_MS;
  const remainingMs = deadline - currentTimestamp;

  if (remainingMs <= 0) {
    return {
      canReopen: false,
      isExpired: true,
      timeRemainingFormatted: 'Đã hết hạn mở lại (quá 24 giờ)',
      remainingMs: 0,
      hoursRemaining: 0,
      minutesRemaining: 0,
      deadlineTimestamp: new Date(deadline).toISOString(),
    };
  }

  const totalMinutes = Math.floor(remainingMs / (1000 * 60));
  const hoursRemaining = Math.floor(totalMinutes / 60);
  const minutesRemaining = totalMinutes % 60;

  const timeRemainingFormatted =
    hoursRemaining > 0
      ? `Còn ${hoursRemaining} giờ ${minutesRemaining} phút`
      : `Còn ${minutesRemaining} phút`;

  return {
    canReopen: true,
    isExpired: false,
    timeRemainingFormatted,
    remainingMs,
    hoursRemaining,
    minutesRemaining,
    deadlineTimestamp: new Date(deadline).toISOString(),
  };
};

/**
 * Kiểm tra xem người dùng hiện tại có quyền mở lại phiếu phỏng vấn không (AC 1 - TKNHTTDNB1-465)
 * Chỉ dành cho người dùng có role RECRUITER (hoặc ADMIN / HR_MANAGER).
 */
export const checkIsRecruiterRole = (
  userRoles?: string[] | null,
  isRecruiterExplicit?: boolean,
): boolean => {
  if (typeof isRecruiterExplicit === 'boolean') {
    return isRecruiterExplicit;
  }

  const activeRoles: string[] = userRoles || tokenService.getUserData()?.roles || [];
  const normalizedRoles = activeRoles.map((role) => role.toUpperCase().trim());

  return (
    normalizedRoles.includes('RECRUITER') ||
    normalizedRoles.includes('ADMIN') ||
    normalizedRoles.includes('HR_MANAGER')
  );
};

/**
 * Kiểm tra điều kiện xem đánh giá chéo của các Interviewer khác (AC 2 - TKNHTTDNB1-465)
 * Chỉ hiển thị khi người dùng hiện tại đã hoàn tất và nộp phiếu của chính mình.
 */
export const isPeerReviewVisible = (hasSubmittedOwnEvaluation: boolean): boolean => {
  return Boolean(hasSubmittedOwnEvaluation);
};


