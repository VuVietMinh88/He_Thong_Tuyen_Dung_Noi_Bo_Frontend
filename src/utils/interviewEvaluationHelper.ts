import type {
  EvaluationCriterionItem,
  CriterionEvaluationRecord,
} from '../types/interviewEvaluation';

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
 * Tính toán điểm tổng trọng số từ các tiêu chí đã chấm
 * Trả về null nếu chưa có tiêu chí nào được cho điểm
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
