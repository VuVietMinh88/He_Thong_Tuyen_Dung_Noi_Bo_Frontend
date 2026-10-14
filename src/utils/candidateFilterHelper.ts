import type {
  CandidateProfile,
  CandidateCombinedFilterState,
  ExperienceFilterOption,
  EducationFilterOption,
  StageFilterOption,
} from '../types/candidate';

export interface ActiveFilterBadge {
  id: string;
  type:
    | 'keyword'
    | 'job'
    | 'department'
    | 'experience'
    | 'education'
    | 'stage'
    | 'skill'
    | 'status';
  label: string;
  displayValue: string;
  colorClass: string;
}

/**
 * Trích xuất số năm kinh nghiệm từ hồ sơ ứng viên
 */
export function extractCandidateExperienceYears(candidate: CandidateProfile): number {
  if (typeof candidate.experienceYears === 'number' && !Number.isNaN(candidate.experienceYears)) {
    return candidate.experienceYears;
  }

  // Dự phòng: Tìm từ kết quả đánh giá tiêu chí kinh nghiệm (nếu có)
  const expCriterion = candidate.matchingEvaluation?.criteriaList?.find(
    (item) => item.criterionKey === 'EXPERIENCE'
  );
  if (expCriterion?.candidateValue) {
    const match = expCriterion.candidateValue.match(/(\d+(?:\.\d+)?)\s*năm/i);
    if (match) {
      const parsed = parseFloat(match[1]);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }

  return 0;
}

/**
 * Phân loại trình độ học vấn của ứng viên
 */
export function classifyCandidateEducation(candidate: CandidateProfile): EducationFilterOption {
  if (candidate.educationLevel) {
    const norm = candidate.educationLevel.toLowerCase();
    if (norm.includes('thạc') || norm.includes('tiến') || norm.includes('master') || norm.includes('phd')) {
      return 'MASTER_PLUS';
    }
    if (norm.includes('đại học') || norm.includes('cử nhân') || norm.includes('kỹ sư') || norm.includes('bachelor')) {
      return 'BACHELOR';
    }
    if (norm.includes('cao đẳng') || norm.includes('college')) {
      return 'COLLEGE';
    }
    return 'OTHER';
  }

  const eduCriterion = candidate.matchingEvaluation?.criteriaList?.find(
    (item) => item.criterionKey === 'EDUCATION'
  );

  const textToCheck = `${eduCriterion?.candidateValue || ''} ${candidate.coverLetter || ''}`.toLowerCase();

  if (textToCheck.includes('thạc') || textToCheck.includes('tiến') || textToCheck.includes('master') || textToCheck.includes('phd')) {
    return 'MASTER_PLUS';
  }
  if (textToCheck.includes('đại học') || textToCheck.includes('cử nhân') || textToCheck.includes('kỹ sư') || textToCheck.includes('bachelor')) {
    return 'BACHELOR';
  }
  if (textToCheck.includes('cao đẳng') || textToCheck.includes('college')) {
    return 'COLLEGE';
  }
  if (textToCheck.includes('trung cấp') || textToCheck.includes('nghề') || textToCheck.includes('chưa hoàn thành')) {
    return 'OTHER';
  }

  // Mặc định cử nhân/đại học nếu đạt tiêu chí học vấn
  if (eduCriterion?.isPassed) {
    return 'BACHELOR';
  }

  return 'OTHER';
}

/**
 * Kiểm tra trạng thái hồ sơ có khớp bộ lọc hay không
 */
export function matchesCandidateStage(candidate: CandidateProfile, stageFilter: StageFilterOption): boolean {
  if (stageFilter === 'ALL') return true;

  const rawStatus = (candidate.status || '').toUpperCase();

  switch (stageFilter) {
    case 'NEW':
      // Hồ sơ mới / Sơ loại / Chờ duyệt
      return (
        rawStatus === 'NEW' ||
        rawStatus === 'SCREENING' ||
        rawStatus.includes('MỚI') ||
        rawStatus.includes('CHỜ') ||
        rawStatus.includes('TIẾP NHẬN') ||
        candidate.cvParsingStatus === 'PENDING_CONFIRMATION'
      );
    case 'INTERVIEWING':
      // Đang trong quy trình phỏng vấn
      return (
        rawStatus === 'INTERVIEWING' ||
        rawStatus === 'INTERVIEW' ||
        rawStatus.includes('PHỎNG VẤN') ||
        rawStatus.includes('ĐÁNH GIÁ')
      );
    case 'OFFER_HIRED':
      // Đạt offer hoặc đã trúng tuyển nhận việc
      return (
        rawStatus === 'OFFER' ||
        rawStatus === 'HIRED' ||
        rawStatus.includes('OFFER') ||
        rawStatus.includes('NHẬN VIỆC') ||
        rawStatus.includes('TRÚNG TUYỂN') ||
        rawStatus.includes('ĐỀ XUẤT')
      );
    case 'REJECTED':
      // Hồ sơ bị loại hoặc không đạt
      return (
        rawStatus === 'REJECTED' ||
        rawStatus.includes('LOẠI') ||
        rawStatus.includes('TỪ CHỐI') ||
        rawStatus.includes('KHÔNG ĐẠT')
      );
    default:
      return true;
  }
}

/**
 * Kiểm tra kỹ năng ứng viên có khớp với danh sách tags/chips được chọn
 */
export function matchesCandidateSkills(candidate: CandidateProfile, selectedSkills: string[]): boolean {
  if (!selectedSkills || selectedSkills.length === 0) return true;

  // Tập hợp toàn bộ từ khóa kỹ năng từ hồ sơ
  const candidateSkillPool = new Set<string>();

  if (candidate.skills && Array.isArray(candidate.skills)) {
    candidate.skills.forEach((s) => candidateSkillPool.add(s.toLowerCase()));
  }

  if (candidate.tags && Array.isArray(candidate.tags)) {
    candidate.tags.forEach((tag) => candidateSkillPool.add(tag.name.toLowerCase()));
  }

  const skillCriterion = candidate.matchingEvaluation?.criteriaList?.find(
    (item) => item.criterionKey === 'SKILLS'
  );
  if (skillCriterion?.candidateValue) {
    candidateSkillPool.add(skillCriterion.candidateValue.toLowerCase());
  }

  const candidateAllText = [
    candidate.currentTitle || '',
    candidate.appliedJobTitle || '',
    candidate.coverLetter || '',
    Array.from(candidateSkillPool).join(' '),
  ]
    .join(' ')
    .toLowerCase();

  // Khớp tất cả các kỹ năng đã chọn (hoặc có trong text)
  return selectedSkills.every((skill) => {
    const normalizedSkill = skill.trim().toLowerCase();
    return candidateAllText.includes(normalizedSkill);
  });
}

/**
 * Tìm kiếm theo từ khóa toàn diện: Họ tên, Email, Số điện thoại, Kỹ năng chuyên môn (AC 1)
 */
export function matchesCandidateKeyword(candidate: CandidateProfile, keyword: string): boolean {
  if (!keyword || !keyword.trim()) return true;

  const normalizedKeyword = keyword.trim().toLowerCase();

  const nameMatch = candidate.fullName.toLowerCase().includes(normalizedKeyword);
  const emailMatch = candidate.email.toLowerCase().includes(normalizedKeyword);
  const phoneMatch = candidate.phone.includes(normalizedKeyword);
  const jobMatch = (candidate.appliedJobTitle || '').toLowerCase().includes(normalizedKeyword);
  const titleMatch = (candidate.currentTitle || '').toLowerCase().includes(normalizedKeyword);
  const departmentMatch = (candidate.departmentName || '').toLowerCase().includes(normalizedKeyword);
  const trackingCodeMatch = (candidate.trackingCode || '').toLowerCase().includes(normalizedKeyword);

  // Kỹ năng từ tags
  const tagsMatch =
    candidate.tags?.some((tag) => tag.name.toLowerCase().includes(normalizedKeyword)) || false;

  // Kỹ năng từ danh sách skills
  const skillsMatch =
    candidate.skills?.some((skill) => skill.toLowerCase().includes(normalizedKeyword)) || false;

  // Kỹ năng từ matching evaluation
  const skillCriterion = candidate.matchingEvaluation?.criteriaList?.find(
    (item) => item.criterionKey === 'SKILLS'
  );
  const skillCriterionMatch =
    skillCriterion?.candidateValue?.toLowerCase().includes(normalizedKeyword) || false;

  return (
    nameMatch ||
    emailMatch ||
    phoneMatch ||
    jobMatch ||
    titleMatch ||
    departmentMatch ||
    trackingCodeMatch ||
    tagsMatch ||
    skillsMatch ||
    skillCriterionMatch
  );
}

/**
 * Hàm lọc ứng viên kết hợp đa tiêu chí (Task Jira TKNHTTDNB1-390 / User Story S5-03)
 */
export function filterCandidatesCombined(
  candidates: CandidateProfile[],
  filters: CandidateCombinedFilterState
): CandidateProfile[] {
  if (!candidates || candidates.length === 0) return [];

  return candidates.filter((candidate) => {
    // 1. Tìm kiếm theo từ khóa chính (Họ tên, Email, SĐT, Kỹ năng) - AC 1
    if (!matchesCandidateKeyword(candidate, filters.keyword)) {
      return false;
    }

    // 2. Lọc theo vị trí ứng tuyển - AC 2
    if (filters.jobId && filters.jobId !== 'ALL') {
      if (candidate.appliedJobId !== filters.jobId) {
        return false;
      }
    }

    // 3. Lọc theo phòng ban - AC 2
    if (filters.department && filters.department !== 'ALL') {
      const candidateDept = (candidate.departmentName || '').toLowerCase();
      if (!candidateDept.includes(filters.department.toLowerCase())) {
        return false;
      }
    }

    // 4. Lọc theo số năm kinh nghiệm - AC 2
    if (filters.experienceLevel && filters.experienceLevel !== 'ALL') {
      const expYears = extractCandidateExperienceYears(candidate);

      switch (filters.experienceLevel) {
        case 'LT_1':
          if (expYears >= 1) return false;
          break;
        case '1_TO_3':
          if (expYears < 1 || expYears > 3) return false;
          break;
        case '3_TO_5':
          if (expYears < 3 || expYears > 5) return false;
          break;
        case 'GT_5':
          if (expYears <= 5) return false;
          break;
        case 'CUSTOM':
          if (
            filters.minExperienceYears !== undefined &&
            expYears < filters.minExperienceYears
          ) {
            return false;
          }
          if (
            filters.maxExperienceYears !== undefined &&
            expYears > filters.maxExperienceYears
          ) {
            return false;
          }
          break;
      }
    }

    // 5. Lọc theo trình độ học vấn - AC 2
    if (filters.educationLevel && filters.educationLevel !== 'ALL') {
      const eduCategory = classifyCandidateEducation(candidate);
      if (eduCategory !== filters.educationLevel) {
        return false;
      }
    }

    // 6. Lọc theo trạng thái hồ sơ / vòng tuyển dụng - AC 2
    if (filters.stageStatus && filters.stageStatus !== 'ALL') {
      if (!matchesCandidateStage(candidate, filters.stageStatus)) {
        return false;
      }
    }

    // 7. Lọc theo thẻ kỹ năng (Tags/Chips) - AC 2
    if (filters.skills && filters.skills.length > 0) {
      if (!matchesCandidateSkills(candidate, filters.skills)) {
        return false;
      }
    }

    // 8. Lọc theo trạng thái đọc CV (nếu có yêu cầu từ giao diện gốc)
    if (filters.cvParsingStatus && filters.cvParsingStatus !== 'ALL') {
      if (candidate.cvParsingStatus !== filters.cvParsingStatus) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Đếm số lượng điều kiện lọc đang kích hoạt (không tính giá trị mặc định)
 */
export function countActiveFilters(filters: CandidateCombinedFilterState): number {
  let count = 0;
  if (filters.keyword.trim().length > 0) count++;
  if (filters.jobId && filters.jobId !== 'ALL') count++;
  if (filters.department && filters.department !== 'ALL') count++;
  if (filters.experienceLevel && filters.experienceLevel !== 'ALL') count++;
  if (filters.educationLevel && filters.educationLevel !== 'ALL') count++;
  if (filters.stageStatus && filters.stageStatus !== 'ALL') count++;
  if (filters.skills && filters.skills.length > 0) count += filters.skills.length;
  if (filters.cvParsingStatus && filters.cvParsingStatus !== 'ALL') count++;
  return count;
}

export const EXPERIENCE_LABELS: Record<ExperienceFilterOption, string> = {
  ALL: 'Tất cả kinh nghiệm',
  LT_1: 'Dưới 1 năm (< 1 năm)',
  '1_TO_3': '1 - 3 năm',
  '3_TO_5': '3 - 5 năm',
  GT_5: 'Trên 5 năm (> 5 năm)',
  CUSTOM: 'Tùy chỉnh khoảng năm',
};

export const EDUCATION_LABELS: Record<EducationFilterOption, string> = {
  ALL: 'Tất cả trình độ',
  BACHELOR: 'Đại học / Cử nhân',
  MASTER_PLUS: 'Thạc sĩ / Tiến sĩ',
  COLLEGE: 'Cao đẳng',
  OTHER: 'Trung cấp / Khác',
};

export const STAGE_LABELS: Record<StageFilterOption, string> = {
  ALL: 'Tất cả trạng thái',
  NEW: 'Chờ duyệt / Mới tiếp nhận',
  INTERVIEWING: 'Phỏng vấn',
  OFFER_HIRED: 'Trúng tuyển',
  REJECTED: 'Loại hồ sơ',
};

/**
 * Trả về danh sách Active Filter Badges để hiển thị tag đang kích hoạt kèm nút bấm tắt nhanh (AC 3)
 */
export function getActiveFilterBadges(
  filters: CandidateCombinedFilterState,
  options?: {
    jobOptions?: Array<{ id: string; title: string }>;
  }
): ActiveFilterBadge[] {
  const badges: ActiveFilterBadge[] = [];

  // 1. Keyword badge
  if (filters.keyword.trim()) {
    badges.push({
      id: 'filter-keyword',
      type: 'keyword',
      label: 'Từ khóa',
      displayValue: `"${filters.keyword.trim()}"`,
      colorClass: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20',
    });
  }

  // 2. Job title badge
  if (filters.jobId && filters.jobId !== 'ALL') {
    const jobTitle =
      options?.jobOptions?.find((j) => j.id === filters.jobId)?.title || filters.jobId;
    badges.push({
      id: 'filter-job',
      type: 'job',
      label: 'Vị trí',
      displayValue: jobTitle,
      colorClass: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/20',
    });
  }

  // 3. Department badge
  if (filters.department && filters.department !== 'ALL') {
    badges.push({
      id: 'filter-department',
      type: 'department',
      label: 'Phòng ban',
      displayValue: filters.department,
      colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/20',
    });
  }

  // 4. Experience badge
  if (filters.experienceLevel && filters.experienceLevel !== 'ALL') {
    let expLabel = EXPERIENCE_LABELS[filters.experienceLevel];
    if (filters.experienceLevel === 'CUSTOM') {
      const min = filters.minExperienceYears ?? 0;
      const max = filters.maxExperienceYears ? `${filters.maxExperienceYears} năm` : 'trở lên';
      expLabel = `${min} - ${max}`;
    }
    badges.push({
      id: 'filter-experience',
      type: 'experience',
      label: 'Kinh nghiệm',
      displayValue: expLabel,
      colorClass: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20',
    });
  }

  // 5. Education badge
  if (filters.educationLevel && filters.educationLevel !== 'ALL') {
    badges.push({
      id: 'filter-education',
      type: 'education',
      label: 'Học vấn',
      displayValue: EDUCATION_LABELS[filters.educationLevel],
      colorClass: 'bg-teal-50 text-teal-700 border-teal-200 ring-teal-500/20',
    });
  }

  // 6. Stage status badge
  if (filters.stageStatus && filters.stageStatus !== 'ALL') {
    badges.push({
      id: 'filter-stage',
      type: 'stage',
      label: 'Trạng thái',
      displayValue: STAGE_LABELS[filters.stageStatus],
      colorClass: 'bg-sky-50 text-sky-700 border-sky-200 ring-sky-500/20',
    });
  }

  // 7. Skills badges (Mỗi skill có 1 badge độc lập để tắt nhanh từng skill)
  if (filters.skills && filters.skills.length > 0) {
    filters.skills.forEach((skill) => {
      badges.push({
        id: `filter-skill-${skill.toLowerCase().replace(/\s+/g, '-')}`,
        type: 'skill',
        label: 'Kỹ năng',
        displayValue: skill,
        colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
      });
    });
  }

  // 8. CV Status badge (nếu khác ALL)
  if (filters.cvParsingStatus && filters.cvParsingStatus !== 'ALL') {
    const statusTextMap: Record<string, string> = {
      PENDING_CONFIRMATION: 'Chờ xác nhận gợi ý',
      CONFIRMED: 'Đã xác nhận',
      PARSING: 'Đang đọc CV PDF',
      FAILED: 'Lỗi đọc CV',
      DISMISSED: 'Đã bỏ qua',
    };
    badges.push({
      id: 'filter-cv-status',
      type: 'status',
      label: 'Trạng thái CV',
      displayValue: statusTextMap[filters.cvParsingStatus] || filters.cvParsingStatus,
      colorClass: 'bg-slate-100 text-slate-700 border-slate-300 ring-slate-400/20',
    });
  }

  return badges;
}
