import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import type {
  CandidateProfile,
  CandidateMatchingEvaluation,
} from '../src/types/candidate';
import {
  MATCHING_SCORE_PASS_THRESHOLD,
  MANDATORY_CRITERIA_DISCLAIMER_NOTE,
} from '../src/types/candidate';
import {
  getMatchingScoreColorClass,
  getMatchingStatusBadgeConfig,
  resolveCandidateMatchingEvaluation,
} from '../src/utils/candidateMatchingHelper';
import { MatchingScoreBadge } from '../src/components/Candidate/MatchingScoreBadge';
import { CriteriaQuickSummaryPopover } from '../src/components/Candidate/CriteriaQuickSummaryPopover';
import { CandidateCriteriaEvaluationCard } from '../src/components/Candidate/CandidateCriteriaEvaluationCard';
import { KanbanCard } from '../src/components/Candidate/KanbanCard';
import { CandidateDetailModal } from '../src/components/Candidate/CandidateDetailModal';

describe('Task TKNHTTDNB1-410 / Story TKNHTTDNB1-57: Hiển thị điểm phù hợp và tiêu chí đạt/không đạt', () => {
  const sampleHighMatchingEvaluation: CandidateMatchingEvaluation = {
    totalMatchingScore: 88,
    isOverallPassed: true,
    summaryText: 'Ứng viên đáp ứng đầy đủ 3/3 tiêu chí bắt buộc với điểm phù hợp 88/100.',
    criteriaList: [
      {
        id: 'criterion-1',
        criterionKey: 'EXPERIENCE',
        criterionName: 'Số năm kinh nghiệm',
        jobRequirement: 'Tối thiểu 3 năm kinh nghiệm React/TypeScript',
        candidateValue: '5 năm kinh nghiệm thực tế',
        isPassed: true,
        notes: 'Vượt yêu cầu kinh nghiệm.',
      },
      {
        id: 'criterion-2',
        criterionKey: 'EDUCATION',
        criterionName: 'Bằng cấp (Học vấn)',
        jobRequirement: 'Tốt nghiệp Đại học chuyên ngành CNTT hoặc tương đương',
        candidateValue: 'Cử nhân Khoa học Máy tính - ĐH Bách Khoa',
        isPassed: true,
        notes: 'Bằng cấp hoàn toàn phù hợp.',
      },
      {
        id: 'criterion-3',
        criterionKey: 'SKILLS',
        criterionName: 'Kỹ năng chuyên môn',
        jobRequirement: 'React, TypeScript, Tailwind CSS, RESTful API',
        candidateValue: 'Thành thạo React, TypeScript, Tailwind CSS',
        isPassed: true,
        notes: 'Kỹ năng đáp ứng chuẩn vị trí.',
      },
    ],
    evaluatedAt: '2026-10-14T08:00:00.000Z',
  };

  const sampleFailedMatchingEvaluation: CandidateMatchingEvaluation = {
    totalMatchingScore: 62,
    isOverallPassed: false,
    summaryText: 'Ứng viên chưa đạt toàn bộ các điều kiện bắt buộc (Điểm phù hợp: 62/100).',
    criteriaList: [
      {
        id: 'criterion-f1',
        criterionKey: 'EXPERIENCE',
        criterionName: 'Số năm kinh nghiệm',
        jobRequirement: 'Tối thiểu 3 năm kinh nghiệm Senior',
        candidateValue: '1 năm kinh nghiệm Junior',
        isPassed: false,
        notes: 'Chưa đủ số năm kinh nghiệm theo yêu cầu.',
      },
      {
        id: 'criterion-f2',
        criterionKey: 'EDUCATION',
        criterionName: 'Bằng cấp (Học vấn)',
        jobRequirement: 'Đại học chuyên ngành CNTT hoặc tương đương',
        candidateValue: 'Cử nhân Công nghệ Thông tin',
        isPassed: true,
      },
      {
        id: 'criterion-f3',
        criterionKey: 'SKILLS',
        criterionName: 'Kỹ năng chuyên môn',
        jobRequirement: 'Java, Spring Boot, Microservices',
        candidateValue: 'Mới làm quen Spring Boot cơ bản',
        isPassed: false,
      },
    ],
    evaluatedAt: '2026-10-14T08:00:00.000Z',
  };

  const sampleCandidateProfile: CandidateProfile = {
    id: 'candidate-matching-001',
    trackingCode: 'APP-2026-MATCH01',
    fullName: 'Lê Minh Hoàng',
    email: 'hoang.le@example.com',
    phone: '0912345678',
    appliedJobId: 'job-fe-01',
    appliedJobTitle: 'Senior React Developer',
    departmentName: 'Phòng Phát triển Ứng dụng',
    source: 'Website công ty',
    status: 'Mới tiếp nhận',
    cvUrl: '/sample-cv.pdf',
    cvFileName: 'CV_LeMinhHoang.pdf',
    cvParsingStatus: 'CONFIRMED',
    experienceYears: 5,
    rating: 4,
    tags: [
      { id: 'tag-react', name: 'React', colorClass: 'bg-indigo-50 text-indigo-700' },
      { id: 'tag-ts', name: 'TypeScript', colorClass: 'bg-blue-50 text-blue-700' },
    ],
    matchingEvaluation: sampleHighMatchingEvaluation,
    appliedAt: '2026-10-14T08:00:00.000Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Cấu hình màu sắc, ngưỡng điểm và logic chuẩn hóa (Helpers & Constants)', () => {
    it('đảm bảo hằng số ngưỡng điểm đạt là 70 và chú thích nghiệp vụ chuẩn xác', () => {
      // Tại sao: Ngưỡng 70% là quy ước chuẩn để phân loại Đạt / Không đạt sơ tuyển
      expect(MATCHING_SCORE_PASS_THRESHOLD).toBe(70);
      expect(MANDATORY_CRITERIA_DISCLAIMER_NOTE).toContain(
        'Điểm phù hợp và cờ Đạt/Không đạt chỉ dùng để gợi ý thứ tự ưu tiên đọc hồ sơ'
      );
      expect(MANDATORY_CRITERIA_DISCLAIMER_NOTE).toContain(
        'hệ thống không tự động loại ứng viên'
      );
    });

    it('phân cấp màu sắc trực quan theo điểm số: >= 80 (Xanh lá), 70-79 (Xanh dương), < 70 (Đỏ)', () => {
      // Điểm cao (>= 80): Xanh lá
      const highGrade = getMatchingScoreColorClass(85);
      expect(highGrade.badgeContainerClass).toContain('emerald');
      expect(highGrade.scoreGradeText).toBe('Rất phù hợp');

      // Điểm khá (70-79): Xanh dương
      const midGrade = getMatchingScoreColorClass(75);
      expect(midGrade.badgeContainerClass).toContain('blue');
      expect(midGrade.scoreGradeText).toBe('Tương đối phù hợp');

      // Điểm chưa đạt (< 70): Đỏ/Hồng
      const lowGrade = getMatchingScoreColorClass(60);
      expect(lowGrade.badgeContainerClass).toContain('rose');
      expect(lowGrade.scoreGradeText).toBe('Cần cân nhắc thêm');
    });

    it('cung cấp cấu hình cờ trạng thái tổng quát "Đạt" và "Không đạt"', () => {
      const passedBadge = getMatchingStatusBadgeConfig(true);
      expect(passedBadge.label).toBe('Đạt');
      expect(passedBadge.containerClass).toContain('emerald');

      const failedBadge = getMatchingStatusBadgeConfig(false);
      expect(failedBadge.label).toBe('Không đạt');
      expect(failedBadge.containerClass).toContain('rose');
    });

    it('tính toán suy luận chuẩn xác 3 tiêu chí bắt buộc khi ứng viên chưa có matchingEvaluation', () => {
      const candidateWithoutEval: CandidateProfile = {
        id: 'candidate-auto-calc',
        fullName: 'Trần Văn Thiện',
        email: 'thien.tran@example.com',
        phone: '0988776655',
        appliedJobTitle: 'Senior Frontend Engineer',
        experienceYears: 4,
        cvParsingStatus: 'CONFIRMED',
      };

      const resolvedEvaluation = resolveCandidateMatchingEvaluation(candidateWithoutEval);
      expect(resolvedEvaluation.totalMatchingScore).toBeGreaterThanOrEqual(70);
      expect(resolvedEvaluation.isOverallPassed).toBe(true);
      expect(resolvedEvaluation.criteriaList).toHaveLength(3);

      const experienceCriterion = resolvedEvaluation.criteriaList.find(
        (criterionItem) => criterionItem.criterionKey === 'EXPERIENCE'
      );
      expect(experienceCriterion?.isPassed).toBe(true);
      expect(experienceCriterion?.candidateValue).toContain('4 năm kinh nghiệm');
    });
  });

  describe('2. Hiển thị tại trang Danh sách hồ sơ ứng viên (CandidateListPage - AC 1)', () => {
    it('kết xuất MatchingScoreBadge hiển thị điểm tổng phù hợp dạng X/100 kèm cờ Đạt', () => {
      const renderedHtml = renderToString(
        React.createElement(MatchingScoreBadge, {
          totalMatchingScore: 88,
          isOverallPassed: true,
          variant: 'standard',
        })
      );

      // Điểm tổng phù hợp
      expect(renderedHtml).toContain('88/100');
      // Cờ trạng thái Đạt (Xanh lá)
      expect(renderedHtml).toContain('Đạt');
      expect(renderedHtml).toContain('bg-emerald-100');
    });

    it('kết xuất MatchingScoreBadge hiển thị điểm tổng phù hợp dạng % kèm cờ Không đạt', () => {
      const renderedHtml = renderToString(
        React.createElement(MatchingScoreBadge, {
          totalMatchingScore: 62,
          isOverallPassed: false,
          variant: 'compact',
        })
      );

      // Điểm số dạng % cho variant compact
      expect(renderedHtml).toContain('62%');
      // Cờ trạng thái Không đạt (Đỏ)
      expect(renderedHtml).toContain('Không đạt');
      expect(renderedHtml).toContain('bg-rose-100');
    });

    it('kết xuất CriteriaQuickSummaryPopover hiển thị tóm tắt trạng thái của 3 tiêu chí bắt buộc', () => {
      const renderedHtml = renderToString(
        React.createElement(CriteriaQuickSummaryPopover, {
          criteriaList: sampleHighMatchingEvaluation.criteriaList,
        })
      );

      // Phải có đủ 3 tiêu chí: Kinh nghiệm, Học vấn, Kỹ năng
      expect(renderedHtml).toContain('Kinh nghiệm');
      expect(renderedHtml).toContain('Học vấn');
      expect(renderedHtml).toContain('Kỹ năng');
      expect(renderedHtml).toContain('Chi tiết 3 tiêu chí bắt buộc');
    });

    it('kết xuất điểm phù hợp và tóm tắt tiêu chí trên thẻ KanbanCard', () => {
      const renderedHtml = renderToString(
        React.createElement(KanbanCard, {
          candidate: sampleCandidateProfile,
          stage: 'SCREENING',
          onClick: vi.fn(),
        })
      );

      expect(renderedHtml).toContain('88%');
      expect(renderedHtml).toContain('Đạt');
      expect(renderedHtml).toContain('Kinh nghiệm');
      expect(renderedHtml).toContain('Học vấn');
      expect(renderedHtml).toContain('Kỹ năng');
    });
  });

  describe('3. Hiển thị tại trang Chi tiết hồ sơ ứng viên (CandidateDetailPage - AC 2)', () => {
    it('kết xuất đầy đủ thẻ "Đánh giá tiêu chí bắt buộc & Điểm phù hợp"', () => {
      const renderedHtml = renderToString(
        React.createElement(CandidateCriteriaEvaluationCard, {
          evaluation: sampleHighMatchingEvaluation,
        })
      );

      // Tiêu đề bắt buộc
      expect(renderedHtml).toContain('Đánh giá tiêu chí bắt buộc');
      expect(renderedHtml).toContain('Điểm phù hợp');
      // Điểm tổng phù hợp
      expect(renderedHtml).toContain('88');
      expect(renderedHtml).toContain('/ 100');
      // Cờ tổng quát Đạt
      expect(renderedHtml).toContain('Tổng quát: Đạt');
      // Tóm tắt số tiêu chí đạt
      expect(renderedHtml).toContain('Đạt 3 / 3 tiêu chí bắt buộc');
    });

    it('hiển thị bảng đối chiếu chi tiết 3 điều kiện bắt buộc: Kinh nghiệm, Học vấn, Kỹ năng kèm badge kết quả', () => {
      const renderedHtml = renderToString(
        React.createElement(CandidateCriteriaEvaluationCard, {
          evaluation: sampleHighMatchingEvaluation,
        })
      );

      // Tiêu chí 1: Kinh nghiệm
      expect(renderedHtml).toContain('Số năm kinh nghiệm');
      expect(renderedHtml).toContain('Tối thiểu 3 năm kinh nghiệm React/TypeScript');
      expect(renderedHtml).toContain('5 năm kinh nghiệm thực tế');

      // Tiêu chí 2: Bằng cấp / Học vấn
      expect(renderedHtml).toContain('Bằng cấp (Học vấn)');
      expect(renderedHtml).toContain('Tốt nghiệp Đại học chuyên ngành CNTT hoặc tương đương');
      expect(renderedHtml).toContain('Cử nhân Khoa học Máy tính - ĐH Bách Khoa');

      // Tiêu chí 3: Kỹ năng
      expect(renderedHtml).toContain('Kỹ năng chuyên môn');
      expect(renderedHtml).toContain('React, TypeScript, Tailwind CSS, RESTful API');
      expect(renderedHtml).toContain('Thành thạo React, TypeScript, Tailwind CSS');

      // Các badge Đạt
      expect(renderedHtml).toContain('Đạt');
    });

    it('hiển thị chính xác badge "Không đạt" cho các tiêu chí không thỏa mãn', () => {
      const renderedHtml = renderToString(
        React.createElement(CandidateCriteriaEvaluationCard, {
          evaluation: sampleFailedMatchingEvaluation,
        })
      );

      // Tổng quát: Không đạt
      expect(renderedHtml).toContain('Tổng quát: Không đạt');
      expect(renderedHtml).toContain('1 năm kinh nghiệm Junior');
      // Ít nhất 1 badge Không đạt
      expect(renderedHtml).toContain('Không đạt');
    });

    it('bắt buộc hiển thị dòng chú thích nghiệp vụ hệ thống không tự động loại ứng viên', () => {
      const renderedHtml = renderToString(
        React.createElement(CandidateCriteriaEvaluationCard, {
          evaluation: sampleHighMatchingEvaluation,
        })
      );

      // AC 2: Dòng chú thích bắt buộc
      expect(renderedHtml).toContain(
        'Lưu ý: Điểm phù hợp và cờ Đạt/Không đạt chỉ dùng để gợi ý thứ tự ưu tiên đọc hồ sơ, hệ thống không tự động loại ứng viên.'
      );
    });

    it('kết xuất CandidateCriteriaEvaluationCard trong CandidateDetailModal khi mở hồ sơ', () => {
      const renderedHtml = renderToString(
        React.createElement(CandidateDetailModal, {
          isOpen: true,
          candidateProfile: sampleCandidateProfile,
          onClose: vi.fn(),
        })
      );

      // Kiểm tra modal có chứa thẻ đánh giá tiêu chí bắt buộc
      expect(renderedHtml).toContain('Đánh giá tiêu chí bắt buộc');
      expect(renderedHtml).toContain('Điểm phù hợp');
      expect(renderedHtml).toContain('88');
      expect(renderedHtml).toContain(
        'Lưu ý: Điểm phù hợp và cờ Đạt/Không đạt chỉ dùng để gợi ý thứ tự ưu tiên đọc hồ sơ, hệ thống không tự động loại ứng viên.'
      );
    });
  });
});
