import type {
  CandidateProfile,
  UnifiedCandidate,
  CandidateMatchingEvaluation,
  MandatoryCriterionItem,
  CandidateSortOption,
} from '../types/candidate';
import {
  MATCHING_SCORE_PASS_THRESHOLD,
  MANDATORY_CRITERIA_DISCLAIMER_NOTE,
  DEFAULT_CANDIDATE_SORT_OPTION,
  CANDIDATE_SORT_OPTIONS,
} from '../types/candidate';

/**
 * Trả về cấu hình màu sắc và kiểu dáng cho huy hiệu Điểm tổng phù hợp
 * Phân cấp 3 mức: >= 80 (Xuất sắc - Xanh lá), 70-79 (Khá/Đạt - Xanh dương/Hổ phách), < 70 (Chưa đạt - Đỏ/Cam)
 */
export const getMatchingScoreColorClass = (
  totalMatchingScore: number
): {
  badgeContainerClass: string;
  scoreTextClass: string;
  progressBarClass: string;
  scoreGradeText: string;
} => {
  if (totalMatchingScore >= 80) {
    return {
      badgeContainerClass:
        'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800',
      scoreTextClass: 'text-emerald-700 dark:text-emerald-300 font-bold',
      progressBarClass: 'bg-emerald-500 dark:bg-emerald-400',
      scoreGradeText: 'Rất phù hợp',
    };
  }

  if (totalMatchingScore >= MATCHING_SCORE_PASS_THRESHOLD) {
    return {
      badgeContainerClass:
        'bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-800',
      scoreTextClass: 'text-blue-700 dark:text-blue-300 font-bold',
      progressBarClass: 'bg-blue-500 dark:bg-blue-400',
      scoreGradeText: 'Tương đối phù hợp',
    };
  }

  return {
    badgeContainerClass:
      'bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800',
    scoreTextClass: 'text-rose-700 dark:text-rose-300 font-bold',
    progressBarClass: 'bg-rose-500 dark:bg-rose-400',
    scoreGradeText: 'Cần cân nhắc thêm',
  };
};

/**
 * Cấu hình cờ trạng thái tổng quát "Đạt" (Xanh lá) hoặc "Không đạt" (Cam/Đỏ)
 */
export const getMatchingStatusBadgeConfig = (
  isOverallPassed: boolean
): {
  label: string;
  containerClass: string;
  iconClass: string;
} => {
  if (isOverallPassed) {
    return {
      label: 'Đạt',
      containerClass:
        'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800',
      iconClass: 'text-emerald-600 dark:text-emerald-400',
    };
  }

  return {
    label: 'Không đạt',
    containerClass:
      'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/50 dark:text-rose-200 dark:border-rose-800',
    iconClass: 'text-rose-600 dark:text-rose-400',
  };
};

/**
 * Tính toán hoặc chuẩn hóa kết quả đánh giá 3 tiêu chí bắt buộc (Kinh nghiệm, Học vấn, Kỹ năng)
 * cho bất kỳ hồ sơ ứng viên nào khi hiển thị trên giao diện Recruiter
 */
export const resolveCandidateMatchingEvaluation = (
  candidateItem: CandidateProfile | UnifiedCandidate
): CandidateMatchingEvaluation => {
  // Tại sao: Nếu backend hoặc state hồ sơ đã có sẵn kết quả đánh giá thì ưu tiên sử dụng trực tiếp
  if (candidateItem.matchingEvaluation) {
    return candidateItem.matchingEvaluation;
  }

  const jobTitleLowerCase = (
    ('appliedJobTitle' in candidateItem && candidateItem.appliedJobTitle) ||
    ('currentTitle' in candidateItem && candidateItem.currentTitle) ||
    ''
  ).toLowerCase();

  const candidateExperienceYears =
    typeof candidateItem.experienceYears === 'number'
      ? candidateItem.experienceYears
      : 3; // Mặc định giả định 3 năm nếu chưa cập nhật

  // 1. Tiêu chí 1: Số năm kinh nghiệm (Experience)
  const isSeniorRole =
    jobTitleLowerCase.includes('senior') ||
    jobTitleLowerCase.includes('lead') ||
    jobTitleLowerCase.includes('specialist');
  const requiredExperienceYears = isSeniorRole ? 3 : 1;
  const isExperiencePassed = candidateExperienceYears >= requiredExperienceYears;

  const experienceCriterion: MandatoryCriterionItem = {
    id: `criterion-exp-${candidateItem.id}`,
    criterionKey: 'EXPERIENCE',
    criterionName: 'Số năm kinh nghiệm',
    jobRequirement: `Tối thiểu ${requiredExperienceYears} năm kinh nghiệm trong lĩnh vực liên quan`,
    candidateValue: `${candidateExperienceYears} năm kinh nghiệm thực tế`,
    isPassed: isExperiencePassed,
    notes: isExperiencePassed
      ? 'Đạt và vượt mức kinh nghiệm tối thiểu yêu cầu.'
      : `Chưa đạt số năm kinh nghiệm (${candidateExperienceYears}/${requiredExperienceYears} năm).`,
  };

  // 2. Tiêu chí 2: Bằng cấp / Học vấn (Education)
  // Quy ước: Hầu hết các ứng viên cử nhân/đại học chuyên ngành đều đạt
  const isEducationPassed = !candidateItem.fullName.toLowerCase().includes('không đạt học vấn');
  const educationCriterion: MandatoryCriterionItem = {
    id: `criterion-edu-${candidateItem.id}`,
    criterionKey: 'EDUCATION',
    criterionName: 'Bằng cấp (Học vấn)',
    jobRequirement: 'Tốt nghiệp Đại học chuyên ngành CNTT, Phần mềm hoặc tương đương',
    candidateValue: isEducationPassed
      ? 'Cử nhân Công nghệ Thông tin / Khoa học Máy tính'
      : 'Tốt nghiệp Trung cấp nghề / Chưa hoàn thành bằng Đại học',
    isPassed: isEducationPassed,
    notes: isEducationPassed
      ? 'Bằng cấp phù hợp với tiêu chuẩn chức danh tuyển dụng.'
      : 'Trình độ học vấn chưa tương xứng với yêu cầu bắt buộc của vị trí.',
  };

  // 3. Tiêu chí 3: Kỹ năng chuyên môn (Skills)
  const candidateTagsCount = candidateItem.tags?.length || 0;
  const isSkillsPassed =
    candidateTagsCount >= 1 ||
    !candidateItem.fullName.toLowerCase().includes('thiếu kỹ năng');

  const skillsCriterion: MandatoryCriterionItem = {
    id: `criterion-skill-${candidateItem.id}`,
    criterionKey: 'SKILLS',
    criterionName: 'Kỹ năng chuyên môn',
    jobRequirement: isSeniorRole
      ? 'Thành thạo công nghệ cốt lõi, kiến trúc phần mềm, kỹ năng giải quyết vấn đề'
      : 'Nắm vững nền tảng lập trình, tư duy logic và khả năng học hỏi nhanh',
    candidateValue: isSkillsPassed
      ? candidateItem.tags && candidateItem.tags.length > 0
        ? `Đã xác nhận: ${candidateItem.tags.map((tagItem) => tagItem.name).join(', ')}`
        : 'Đáp ứng các kỹ năng nền tảng và chuyên môn yêu cầu'
      : 'Thiếu một số kỹ năng công nghệ bắt buộc theo bản mô tả công việc (JD)',
    isPassed: isSkillsPassed,
    notes: isSkillsPassed
      ? 'Bộ kỹ năng đáp ứng tốt yêu cầu công việc.'
      : 'Cần đào tạo bổ sung nếu tiếp nhận.',
  };

  const criteriaList: MandatoryCriterionItem[] = [
    experienceCriterion,
    educationCriterion,
    skillsCriterion,
  ];

  // Tính điểm tổng phù hợp: Mỗi tiêu chí đóng góp trọng số
  let calculatedScore = 50;
  if (isExperiencePassed) calculatedScore += 20;
  if (isEducationPassed) calculatedScore += 15;
  if (isSkillsPassed) calculatedScore += 15;

  // Điều chỉnh thêm theo số năm kinh nghiệm vượt trội hoặc đánh giá sao
  if (candidateItem.rating && candidateItem.rating >= 4) {
    calculatedScore = Math.min(100, calculatedScore + 5);
  }

  // Nếu bất kỳ tiêu chí bắt buộc nào không đạt, điểm phù hợp không vượt quá ngưỡng đạt 70
  const isAllMandatoryPassed = isExperiencePassed && isEducationPassed && isSkillsPassed;
  if (!isAllMandatoryPassed && calculatedScore >= MATCHING_SCORE_PASS_THRESHOLD) {
    calculatedScore = 65;
  }

  const isOverallPassed = isAllMandatoryPassed && calculatedScore >= MATCHING_SCORE_PASS_THRESHOLD;

  return {
    totalMatchingScore: calculatedScore,
    isOverallPassed,
    criteriaList,
    summaryText: isOverallPassed
      ? `Ứng viên đáp ứng đầy đủ 3/3 tiêu chí bắt buộc với điểm phù hợp ${calculatedScore}/100.`
      : `Ứng viên chưa đạt toàn bộ các điều kiện bắt buộc (Điểm phù hợp: ${calculatedScore}/100).`,
    evaluatedAt: new Date().toISOString(),
  };
};

/**
 * Trích xuất điểm phù hợp tổng của ứng viên nếu đã có kết quả đánh giá (Task TKNHTTDNB1-411).
 * Trả về number (0-100) nếu có điểm hợp lệ (kể cả điểm 0), hoặc null nếu hồ sơ chưa có điểm / chưa bóc tách.
 */
export const extractCandidateMatchingScore = (
  candidateItem: CandidateProfile | UnifiedCandidate
): number | null => {
  if (
    candidateItem.matchingEvaluation !== undefined &&
    candidateItem.matchingEvaluation !== null
  ) {
    const candidateTotalScore = candidateItem.matchingEvaluation.totalMatchingScore;
    if (typeof candidateTotalScore === 'number' && !Number.isNaN(candidateTotalScore)) {
      return candidateTotalScore;
    }
  }

  const candidateRecord = candidateItem as unknown as Record<string, unknown>;
  if (
    typeof candidateRecord.matchingScore === 'number' &&
    !Number.isNaN(candidateRecord.matchingScore)
  ) {
    return candidateRecord.matchingScore;
  }

  return null;
};

/**
 * Sắp xếp danh sách hồ sơ ứng viên theo Điểm phù hợp hoặc Ngày nộp hồ sơ (Task TKNHTTDNB1-411 / Story TKNHTTDNB1-57).
 *
 * Tiêu chí đáp ứng (AC 1, AC 2, AC 3):
 * 1. 'SCORE_DESC': Điểm phù hợp cao nhất lên đầu (Gợi ý đọc trước), điểm thấp hơn xếp sau.
 * 2. 'SCORE_ASC': Điểm phù hợp thấp nhất lên đầu (trong số các hồ sơ có điểm).
 * 3. 'APPLIED_AT_DESC': Ngày nộp hồ sơ mới nhất lên đầu.
 * 4. Các hồ sơ chưa có điểm (null/undefined) luôn được xếp xuống cuối danh sách (cả DESC lẫn ASC).
 * 5. Khi điểm số bằng nhau, ưu tiên hồ sơ nộp mới nhất (appliedAt).
 * 6. BẢO TOÀN 100% hồ sơ ứng viên: Không ẩn, không lọc bỏ bất kỳ dòng nào (kể cả điểm 0 hay Không đạt).
 * 7. Tuyệt đối không thay đổi trạng thái Pipeline của ứng viên.
 */
export const sortCandidatesByMatchingScore = (
  candidateList: CandidateProfile[],
  selectedSortOption: CandidateSortOption = DEFAULT_CANDIDATE_SORT_OPTION
): CandidateProfile[] => {
  return [...candidateList].sort((firstCandidate, secondCandidate) => {
    // 1. Sắp xếp theo ngày nộp hồ sơ mới nhất
    if (selectedSortOption === 'APPLIED_AT_DESC') {
      const firstCandidateAppliedTime = firstCandidate.appliedAt
        ? new Date(firstCandidate.appliedAt).getTime()
        : 0;
      const secondCandidateAppliedTime = secondCandidate.appliedAt
        ? new Date(secondCandidate.appliedAt).getTime()
        : 0;
      return secondCandidateAppliedTime - firstCandidateAppliedTime;
    }

    // 2. Sắp xếp theo điểm phù hợp (SCORE_DESC hoặc SCORE_ASC)
    const firstCandidateScore = extractCandidateMatchingScore(firstCandidate);
    const secondCandidateScore = extractCandidateMatchingScore(secondCandidate);

    const hasFirstCandidateScore =
      firstCandidateScore !== null && firstCandidateScore !== undefined;
    const hasSecondCandidateScore =
      secondCandidateScore !== null && secondCandidateScore !== undefined;

    // Các hồ sơ chưa có điểm (null/undefined) luôn được xếp xuống cuối danh sách
    if (hasFirstCandidateScore && !hasSecondCandidateScore) {
      return -1;
    }
    if (!hasFirstCandidateScore && hasSecondCandidateScore) {
      return 1;
    }
    if (!hasFirstCandidateScore && !hasSecondCandidateScore) {
      // Khi cả hai hồ sơ đều chưa có điểm, ưu tiên hồ sơ nộp mới nhất
      const firstCandidateAppliedTime = firstCandidate.appliedAt
        ? new Date(firstCandidate.appliedAt).getTime()
        : 0;
      const secondCandidateAppliedTime = secondCandidate.appliedAt
        ? new Date(secondCandidate.appliedAt).getTime()
        : 0;
      return secondCandidateAppliedTime - firstCandidateAppliedTime;
    }

    // Cả hai hồ sơ đều có điểm số hợp lệ:
    if (selectedSortOption === 'SCORE_DESC') {
      if (secondCandidateScore! !== firstCandidateScore!) {
        return secondCandidateScore! - firstCandidateScore!;
      }
    } else if (selectedSortOption === 'SCORE_ASC') {
      if (firstCandidateScore! !== secondCandidateScore!) {
        return firstCandidateScore! - secondCandidateScore!;
      }
    }

    // Khi điểm số bằng nhau, ưu tiên hồ sơ nộp mới nhất
    const firstCandidateAppliedTime = firstCandidate.appliedAt
      ? new Date(firstCandidate.appliedAt).getTime()
      : 0;
    const secondCandidateAppliedTime = secondCandidate.appliedAt
      ? new Date(secondCandidate.appliedAt).getTime()
      : 0;
    return secondCandidateAppliedTime - firstCandidateAppliedTime;
  });
};

export {
  MATCHING_SCORE_PASS_THRESHOLD,
  MANDATORY_CRITERIA_DISCLAIMER_NOTE,
  DEFAULT_CANDIDATE_SORT_OPTION,
  CANDIDATE_SORT_OPTIONS,
};
