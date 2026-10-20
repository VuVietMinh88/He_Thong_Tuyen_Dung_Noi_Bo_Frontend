import { describe, it, expect } from 'vitest';
import {
  calculateComparisonHighlights,
  isCandidateTopInCriterion,
  formatCurrencyVND,
  getRecommendationBadgeConfig,
  getDecisionBadgeConfig,
  getScoreColorClass,
  getScorePercentage,
} from '../src/utils/candidateComparisonHelper';
import type { ComparisonCandidate } from '../src/types/candidateComparison';

describe('candidateComparisonHelper (Task TKNHTTDNB1-470)', () => {
  const mockCandidates: ComparisonCandidate[] = [
    {
      id: 'cand-1',
      candidateCode: 'CAN-001',
      fullName: 'Nguyễn Văn An',
      email: 'an@gmail.com',
      phone: '0988111222',
      currentTitle: 'Senior Frontend',
      currentCompany: 'FPT',
      experienceYears: 6,
      educationLevel: 'Thạc sĩ',
      appliedJobId: 'job-1',
      appliedJobTitle: 'Frontend Lead',
      matchingScore: 94,
      rating: 5,
      interviewRound: 'Vòng 3',
      competencyScores: {
        technical: 4.8,
        attitude: 4.5,
        language: 4.7,
        cultureFit: 4.3,
        softSkills: 4.6,
        overall: 4.58,
      },
      interviewerFeedbacks: [],
      summaryStrengths: ['React sâu'],
      summaryConcerns: [],
      compensation: {
        expectedSalary: 38000000,
        expectedSalaryFormatted: '38.000.000 ₫',
        salaryNegotiable: true,
        noticePeriodDays: 30,
        availabilityText: 'Sau 30 ngày',
        workModePreference: 'HYBRID',
      },
    },
    {
      id: 'cand-2',
      candidateCode: 'CAN-002',
      fullName: 'Trần Thị Bích',
      email: 'bich@gmail.com',
      phone: '0988333444',
      currentTitle: 'Frontend Lead',
      currentCompany: 'VNG',
      experienceYears: 5,
      educationLevel: 'Cử nhân',
      appliedJobId: 'job-1',
      appliedJobTitle: 'Frontend Lead',
      matchingScore: 90,
      rating: 5,
      interviewRound: 'Vòng 3',
      competencyScores: {
        technical: 4.4,
        attitude: 4.9,
        language: 4.2,
        cultureFit: 4.9,
        softSkills: 4.8,
        overall: 4.64,
      },
      interviewerFeedbacks: [],
      summaryStrengths: ['Văn hóa tốt'],
      summaryConcerns: [],
      compensation: {
        expectedSalary: 35000000,
        expectedSalaryFormatted: '35.000.000 ₫',
        salaryNegotiable: true,
        noticePeriodDays: 0,
        availabilityText: 'Onboard ngay',
        workModePreference: 'HYBRID',
      },
    },
    {
      id: 'cand-3',
      candidateCode: 'CAN-003',
      fullName: 'Lê Hoàng Nam',
      email: 'nam@gmail.com',
      phone: '0988555666',
      currentTitle: 'Senior UI Engineer',
      currentCompany: 'Tiki',
      experienceYears: 8,
      educationLevel: 'Kỹ sư',
      appliedJobId: 'job-1',
      appliedJobTitle: 'Frontend Lead',
      matchingScore: 88,
      rating: 4,
      interviewRound: 'Vòng 3',
      competencyScores: {
        technical: 4.6,
        attitude: 4.3,
        language: 4.7, // Bằng điểm cand-1 để test tie
        cultureFit: 4.2,
        softSkills: 4.4,
        overall: 4.44,
      },
      interviewerFeedbacks: [],
      summaryStrengths: ['8 năm kinh nghiệm'],
      summaryConcerns: [],
      compensation: {
        expectedSalary: 42000000,
        expectedSalaryFormatted: '42.000.000 ₫',
        salaryNegotiable: false,
        noticePeriodDays: 15,
        availabilityText: 'Sau 15 ngày',
        workModePreference: 'REMOTE',
      },
    },
  ];

  describe('calculateComparisonHighlights & isCandidateTopInCriterion', () => {
    it('tính toán chính xác ứng viên có điểm Chuyên môn kỹ thuật cao nhất (technical)', () => {
      const highlights = calculateComparisonHighlights(mockCandidates);
      expect(highlights.technical?.bestValue).toBe(4.8);
      expect(highlights.technical?.candidateIds).toEqual(['cand-1']);
      expect(isCandidateTopInCriterion(highlights, 'technical', 'cand-1')).toBe(true);
      expect(isCandidateTopInCriterion(highlights, 'technical', 'cand-2')).toBe(false);
    });

    it('tính toán chính xác ứng viên có điểm Thái độ (attitude) và Văn hóa (cultureFit) cao nhất', () => {
      const highlights = calculateComparisonHighlights(mockCandidates);
      expect(highlights.attitude?.bestValue).toBe(4.9);
      expect(highlights.attitude?.candidateIds).toEqual(['cand-2']);
      expect(isCandidateTopInCriterion(highlights, 'attitude', 'cand-2')).toBe(true);

      expect(highlights.cultureFit?.bestValue).toBe(4.9);
      expect(highlights.cultureFit?.candidateIds).toEqual(['cand-2']);
      expect(isCandidateTopInCriterion(highlights, 'cultureFit', 'cand-2')).toBe(true);
    });

    it('xử lý chính xác trường hợp đồng điểm cao nhất (tie) cho Ngoại ngữ (language)', () => {
      const highlights = calculateComparisonHighlights(mockCandidates);
      expect(highlights.language?.bestValue).toBe(4.7);
      expect(highlights.language?.candidateIds).toContain('cand-1');
      expect(highlights.language?.candidateIds).toContain('cand-3');
      expect(highlights.language?.isTie).toBe(true);
      expect(isCandidateTopInCriterion(highlights, 'language', 'cand-1')).toBe(true);
      expect(isCandidateTopInCriterion(highlights, 'language', 'cand-3')).toBe(true);
      expect(isCandidateTopInCriterion(highlights, 'language', 'cand-2')).toBe(false);
    });

    it('tính toán chính xác ứng viên có số năm kinh nghiệm cao nhất', () => {
      const highlights = calculateComparisonHighlights(mockCandidates);
      expect(highlights.experienceYears?.bestValue).toBe(8);
      expect(highlights.experienceYears?.candidateIds).toEqual(['cand-3']);
      expect(isCandidateTopInCriterion(highlights, 'experienceYears', 'cand-3')).toBe(true);
      expect(isCandidateTopInCriterion(highlights, 'experienceYears', 'cand-1')).toBe(false);
    });

    it('tính toán chính xác điểm trung bình tổng hợp (overall)', () => {
      const highlights = calculateComparisonHighlights(mockCandidates);
      expect(highlights.overall?.bestValue).toBe(4.64);
      expect(highlights.overall?.candidateIds).toEqual(['cand-2']);
      expect(isCandidateTopInCriterion(highlights, 'overall', 'cand-2')).toBe(true);
    });

    it('trả về đối tượng rỗng khi danh sách ứng viên rỗng', () => {
      const highlights = calculateComparisonHighlights([]);
      expect(highlights).toEqual({});
      expect(isCandidateTopInCriterion(highlights, 'technical', 'cand-1')).toBe(false);
    });
  });

  describe('formatCurrencyVND', () => {
    it('định dạng đúng số tiền sang tiền tệ Việt Nam Đồng', () => {
      expect(formatCurrencyVND(35000000)).toMatch(/35[.,]000[.,]000\s?₫/);
      expect(formatCurrencyVND(0)).toMatch(/0\s?₫/);
    });

    it('trả về "Thỏa thuận" khi giá trị undefined hoặc NaN', () => {
      expect(formatCurrencyVND(undefined)).toBe('Thỏa thuận');
      expect(formatCurrencyVND(NaN)).toBe('Thỏa thuận');
    });
  });

  describe('getRecommendationBadgeConfig', () => {
    it('trả về cấu hình màu sắc tương ứng cho RECOMMENDED', () => {
      const cfg = getRecommendationBadgeConfig('RECOMMENDED');
      expect(cfg.label).toBe('Nên tuyển');
      expect(cfg.containerClass).toContain('emerald');
    });

    it('trả về cấu hình màu sắc tương ứng cho CONSIDER', () => {
      const cfg = getRecommendationBadgeConfig('CONSIDER');
      expect(cfg.label).toBe('Cân nhắc');
      expect(cfg.containerClass).toContain('amber');
    });

    it('trả về cấu hình màu sắc tương ứng cho NOT_RECOMMENDED', () => {
      const cfg = getRecommendationBadgeConfig('NOT_RECOMMENDED');
      expect(cfg.label).toBe('Không nên tuyển');
      expect(cfg.containerClass).toContain('rose');
    });
  });

  describe('getDecisionBadgeConfig', () => {
    it('trả về nhãn và class cho OFFER', () => {
      const cfg = getDecisionBadgeConfig('OFFER');
      expect(cfg.label).toBe('Đề xuất Offer');
      expect(cfg.containerClass).toContain('emerald');
    });

    it('trả về nhãn và class cho BACKUP', () => {
      const cfg = getDecisionBadgeConfig('BACKUP');
      expect(cfg.label).toBe('Dự phòng (Talent Pool)');
      expect(cfg.containerClass).toContain('amber');
    });

    it('trả về nhãn và class cho REJECT', () => {
      const cfg = getDecisionBadgeConfig('REJECT');
      expect(cfg.label).toBe('Chưa phù hợp');
      expect(cfg.containerClass).toContain('rose');
    });

    it('trả về nhãn và class mặc định cho PENDING', () => {
      const cfg = getDecisionBadgeConfig('PENDING');
      expect(cfg.label).toBe('Chờ quyết định');
    });
  });

  describe('getScoreColorClass & getScorePercentage', () => {
    it('phân loại màu sắc theo thang điểm 1 - 5', () => {
      expect(getScoreColorClass(4.8).text).toContain('emerald');
      expect(getScoreColorClass(4.2).text).toContain('blue');
      expect(getScoreColorClass(3.5).text).toContain('amber');
      expect(getScoreColorClass(2.5).text).toContain('rose');
    });

    it('tính phần trăm chính xác trên thang điểm 5.0', () => {
      expect(getScorePercentage(5.0)).toBe(100);
      expect(getScorePercentage(2.5)).toBe(50);
      expect(getScorePercentage(0)).toBe(0);
    });
  });
});
