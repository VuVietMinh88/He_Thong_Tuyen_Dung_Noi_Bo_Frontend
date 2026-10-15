import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { CandidateEvaluationSummaryView } from '../src/components/Candidate/EvaluationSummary/CandidateEvaluationSummaryView';
import { ConsensusGaugeCard } from '../src/components/Candidate/EvaluationSummary/ConsensusGaugeCard';
import { CompetencyRadarChart } from '../src/components/Candidate/EvaluationSummary/CompetencyRadarChart';
import { CompetencyBarChart } from '../src/components/Candidate/EvaluationSummary/CompetencyBarChart';
import { RoundEvaluationAccordion } from '../src/components/Candidate/EvaluationSummary/RoundEvaluationAccordion';
import { HiringDecisionModal } from '../src/components/Candidate/EvaluationSummary/HiringDecisionModal';
import { CandidateEvaluationSummaryModal } from '../src/components/Candidate/EvaluationSummary/CandidateEvaluationSummaryModal';
import {
  candidateEvaluationSummaryService,
  MOCK_EVALUATION_SUMMARY_DATA,
} from '../src/services/candidateEvaluationSummaryService';
import {
  calculateConsensusSummary,
  calculateRadarPoints,
  evaluateCompetencyGap,
  getRecommendationBadgeConfig,
  getConsensusLevelBadgeConfig,
  getGapStatusBadgeConfig,
  formatCurrencyVND,
} from '../src/utils/candidateEvaluationSummaryHelper';
import type { EvaluationRoundItem } from '../src/types/candidateEvaluationSummary';

describe('Candidate Evaluation Summary Screen (Task Jira: TKNHTTDNB1-485 / User Story S7-02)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('AC 1: Thông tin đầu trang & Tỷ lệ đồng thuận (Header & Consensus Summary)', () => {
    it('render đầy đủ thông tin ứng viên, vị trí ứng tuyển và điểm năng lực tổng thể', () => {
      const html = renderToString(
        <CandidateEvaluationSummaryView initialData={MOCK_EVALUATION_SUMMARY_DATA} />
      );

      // Thông tin ứng viên
      expect(html).toContain('Nguyễn Văn An');
      expect(html).toContain('CAN-2026-0891');
      expect(html).toContain('Senior Frontend Developer (React, TypeScript &amp; Tailwind CSS)');
      expect(html).toContain('FPT Software (6 năm KN)');
      expect(html).toContain('an.nguyen.dev@outlook.com');

      // Điểm tổng thể
      expect(html).toContain('data-testid="header-overall-score"');
      expect(html).toContain('4.68');
      expect(html).toContain('94%');
    });

    it('render thẻ ConsensusGaugeCard với tỷ lệ đồng thuận và phân bổ các mức khuyến nghị', () => {
      const html = renderToString(
        <ConsensusGaugeCard
          consensus={MOCK_EVALUATION_SUMMARY_DATA.consensus}
          overallScore={MOCK_EVALUATION_SUMMARY_DATA.overallScore}
        />
      );

      expect(html).toContain('data-testid="consensus-gauge-card"');
      expect(html).toContain('data-testid="consensus-headline"');
      expect(html).toContain('3/3 Hội đồng đồng thuận tuyệt đối (Tuyển dụng)');
      expect(html).toContain('100%');

      // 4 mức khuyến nghị
      expect(html).toContain('data-testid="count-strong-hire"');
      expect(html).toContain('data-testid="count-hire"');
      expect(html).toContain('data-testid="count-consider"');
      expect(html).toContain('data-testid="count-do-not-hire"');
    });

    it('tính toán chính xác các cấp độ đồng thuận trong calculateConsensusSummary', () => {
      // Test 1: 100% Đồng thuận
      const unanimousRounds: EvaluationRoundItem[] = [
        {
          roundId: 'r1',
          roundOrder: 1,
          roundType: 'TECHNICAL',
          roundName: 'Vòng Kỹ thuật',
          averageScore: 4.8,
          interviewers: [
            {
              interviewerId: 'i1',
              interviewerName: 'Quang',
              interviewerRole: 'Lead',
              overallScore: 4.8,
              recommendation: 'STRONG_HIRE',
              comment: 'Tốt',
              strengths: [],
              concerns: [],
              submittedAt: '2026-10-01',
            },
            {
              interviewerId: 'i2',
              interviewerName: 'Hương',
              interviewerRole: 'HR',
              overallScore: 4.6,
              recommendation: 'HIRE',
              comment: 'Tốt',
              strengths: [],
              concerns: [],
              submittedAt: '2026-10-01',
            },
          ],
        },
      ];
      const consensus1 = calculateConsensusSummary(unanimousRounds);
      expect(consensus1.totalInterviewers).toBe(2);
      expect(consensus1.consensusPercentage).toBe(100);
      expect(consensus1.consensusLevel).toBe('UNANIMOUS');

      // Test 2: Có ý kiến không tuyển dụng
      const dividedRounds: EvaluationRoundItem[] = [
        {
          roundId: 'r2',
          roundOrder: 2,
          roundType: 'TECHNICAL',
          roundName: 'Vòng Kỹ thuật',
          averageScore: 3.5,
          interviewers: [
            {
              interviewerId: 'i3',
              interviewerName: 'A',
              interviewerRole: 'Dev',
              overallScore: 3.0,
              recommendation: 'DO_NOT_HIRE',
              comment: 'Chưa đạt',
              strengths: [],
              concerns: [],
              submittedAt: '2026-10-01',
            },
            {
              interviewerId: 'i4',
              interviewerName: 'B',
              interviewerRole: 'Dev',
              overallScore: 3.2,
              recommendation: 'CONSIDER',
              comment: 'Cân nhắc',
              strengths: [],
              concerns: [],
              submittedAt: '2026-10-01',
            },
          ],
        },
      ];
      const consensus2 = calculateConsensusSummary(dividedRounds);
      expect(consensus2.consensusPercentage).toBe(0);
      expect(consensus2.consensusLevel).toBe('DIVIDED');
    });
  });

  describe('AC 2: Bảng tổng hợp chi tiết theo từng vòng (Evaluation Breakdown)', () => {
    it('render đầy đủ các vòng phỏng vấn và thông tin từng interviewer', () => {
      const html = renderToString(
        <RoundEvaluationAccordion rounds={MOCK_EVALUATION_SUMMARY_DATA.evaluationRounds} />
      );

      // Tên các vòng
      expect(html).toContain('Vòng 1: Lọc hồ sơ sơ bộ &amp; Đánh giá CV');
      expect(html).toContain('Vòng 2: Phỏng vấn Chuyên môn &amp; Kiến trúc Kỹ thuật');
      expect(html).toContain('Vòng 3: Phỏng vấn Hội đồng Tuyển dụng &amp; Ban Lãnh Đạo');

      // Tên các interviewer
      expect(html).toContain('Lê Thu Hương');
      expect(html).toContain('Trần Minh Quang');
      expect(html).toContain('Hoàng Hải Đăng');

      // Điểm mạnh và Điểm cần lưu ý
      expect(html).toContain('Điểm mạnh nổi bật (Strengths)');
      expect(html).toContain('Điểm cần lưu ý / Rủi ro (Concerns)');
      expect(html).toContain('Kiến trúc Frontend quy mô lớn');
      expect(html).toContain('Cần bổ sung thêm kỹ năng viết kiểm thử tự động E2E với Playwright');
    });

    it('hiển thị badge khuyến nghị cá nhân chính xác cho từng interviewer', () => {
      const strongHireBadge = getRecommendationBadgeConfig('STRONG_HIRE');
      expect(strongHireBadge.label).toBe('Tuyển dụng xuất sắc');
      expect(strongHireBadge.shortLabel).toBe('Strong Hire');

      const hireBadge = getRecommendationBadgeConfig('HIRE');
      expect(hireBadge.label).toBe('Khuyến nghị tuyển');

      const considerBadge = getRecommendationBadgeConfig('CONSIDER');
      expect(considerBadge.label).toBe('Cân nhắc / Dự phòng');

      const doNotHireBadge = getRecommendationBadgeConfig('DO_NOT_HIRE');
      expect(doNotHireBadge.label).toBe('Không tuyển dụng');
    });
  });

  describe('AC 3: Biểu đồ mạng nhện & Thanh năng lực (Competency Radar/Bar Chart)', () => {
    it('CompetencyRadarChart render đầy đủ đa giác ứng viên và đa giác chuẩn vị trí', () => {
      const html = renderToString(
        <CompetencyRadarChart
          benchmarks={MOCK_EVALUATION_SUMMARY_DATA.competencyBenchmarks}
          candidateName="Nguyễn Văn An"
        />
      );

      expect(html).toContain('data-testid="competency-radar-chart-container"');
      expect(html).toContain('data-testid="target-benchmark-polygon"');
      expect(html).toContain('data-testid="candidate-achievement-polygon"');
      expect(html).toContain('Nguyễn Văn An (Điểm đạt được)');
      expect(html).toContain('Điểm chuẩn kỳ vọng vị trí');
    });

    it('calculateRadarPoints tính toán tọa độ SVG chính xác cho 6 trục năng lực', () => {
      const result = calculateRadarPoints(MOCK_EVALUATION_SUMMARY_DATA.competencyBenchmarks, 120, 160, 5);

      expect(result.axes.length).toBe(6);
      expect(result.candidatePoints.length).toBe(6);
      expect(result.targetPoints.length).toBe(6);
      expect(result.candidatePolygonPoints.length).toBeGreaterThan(0);
      expect(result.targetPolygonPoints.length).toBeGreaterThan(0);
    });

    it('CompetencyBarChart hiển thị thanh so sánh kèm phân tích khoảng cách Gap Analysis', () => {
      const html = renderToString(
        <CompetencyBarChart benchmarks={MOCK_EVALUATION_SUMMARY_DATA.competencyBenchmarks} />
      );

      expect(html).toContain('data-testid="competency-bar-chart-container"');
      expect(html).toContain('Chuyên môn kỹ thuật (React &amp; TypeScript)');
      expect(html).toContain('Vượt chuẩn (+0.60)');
      expect(html).toContain('data-testid="target-marker-comp-1"');
    });

    it('evaluateCompetencyGap phân loại chính xác khoảng cách năng lực', () => {
      expect(evaluateCompetencyGap(4.8, 4.2)).toBe('EXCEEDS'); // +0.6
      expect(evaluateCompetencyGap(4.5, 4.5)).toBe('MEETS'); // 0.0
      expect(evaluateCompetencyGap(3.5, 4.2)).toBe('BELOW'); // -0.7
    });

    it('CandidateEvaluationSummaryView hỗ trợ chuyển đổi chế độ xem Radar và Bar Chart', () => {
      const html = renderToString(
        <CandidateEvaluationSummaryView initialData={MOCK_EVALUATION_SUMMARY_DATA} />
      );

      expect(html).toContain('data-testid="btn-mode-radar"');
      expect(html).toContain('data-testid="btn-mode-bar"');
      expect(html).toContain('Biểu đồ mạng nhện');
      expect(html).toContain('Thanh so sánh');
    });
  });

  describe('AC 4: Khu vực thao tác ra quyết định (Action CTA Section)', () => {
    it('render thanh Sticky Action Bar với 3 nút quyết định nổi bật', () => {
      const html = renderToString(
        <CandidateEvaluationSummaryView initialData={MOCK_EVALUATION_SUMMARY_DATA} />
      );

      expect(html).toContain('data-testid="decision-action-cta-section"');
      expect(html).toContain('data-testid="btn-decision-make-offer"');
      expect(html).toContain('data-testid="btn-decision-talent-pool"');
      expect(html).toContain('data-testid="btn-decision-reject"');
      expect(html).toContain('Gửi đề nghị tuyển dụng (Make Offer)');
      expect(html).toContain('Lưu trữ vào kho tiềm năng');
      expect(html).toContain('Từ chối hồ sơ (Reject)');
    });

    it('HiringDecisionModal render các trường nhập liệu tương ứng khi quyết định OFFER', () => {
      const html = renderToString(
        <HiringDecisionModal
          isOpen={true}
          decisionType="OFFER"
          candidateSummary={MOCK_EVALUATION_SUMMARY_DATA}
          onClose={vi.fn()}
          onSubmitDecision={vi.fn()}
        />
      );

      expect(html).toContain('data-testid="hiring-decision-modal"');
      expect(html).toContain('Gửi đề nghị tuyển dụng (Make Offer)');
      expect(html).toContain('Mức lương đề xuất chính thức (VNĐ/tháng)');
      expect(html).toContain('Ngày bắt đầu dự kiến');
      expect(html).toContain('Thời gian thử việc');
      expect(html).toContain('data-testid="btn-submit-decision"');
    });

    it('HiringDecisionModal render các trường tương ứng khi quyết định TALENT_POOL hoặc REJECT', () => {
      const talentPoolHtml = renderToString(
        <HiringDecisionModal
          isOpen={true}
          decisionType="TALENT_POOL"
          candidateSummary={MOCK_EVALUATION_SUMMARY_DATA}
          onClose={vi.fn()}
          onSubmitDecision={vi.fn()}
        />
      );
      expect(talentPoolHtml).toContain('Lưu trữ vào kho tiềm năng (Talent Pool)');
      expect(talentPoolHtml).toContain('Phân nhóm lưu trữ nhân tài');

      const rejectHtml = renderToString(
        <HiringDecisionModal
          isOpen={true}
          decisionType="REJECT"
          candidateSummary={MOCK_EVALUATION_SUMMARY_DATA}
          onClose={vi.fn()}
          onSubmitDecision={vi.fn()}
        />
      );
      expect(rejectHtml).toContain('Từ chối hồ sơ ứng viên (Reject)');
      expect(rejectHtml).toContain('Lý do từ chối chính');
      expect(rejectHtml).toContain('Gửi email cảm ơn và thông báo từ chối lịch sự');
    });

    it('CandidateEvaluationSummaryModal hiển thị và đóng mở dạng popup', () => {
      const html = renderToString(
        <CandidateEvaluationSummaryModal
          isOpen={true}
          onClose={vi.fn()}
          candidateId="cand-final-001"
        />
      );

      expect(html).toContain('data-testid="candidate-evaluation-summary-modal"');
      expect(html).toContain('data-testid="btn-close-eval-summary-modal"');
    });

    it('candidateEvaluationSummaryService submit quyết định và lưu trữ dữ liệu', async () => {
      const updated = await candidateEvaluationSummaryService.submitHiringDecision('cand-final-001', {
        status: 'OFFER',
        offeredSalary: 38000000,
        offeredSalaryFormatted: '38.000.000 ₫',
        startDate: '2026-11-01',
        probationMonths: 2,
        notes: 'Đã thống nhất khung lương',
      });

      expect(updated.hiringDecision.status).toBe('OFFER');
      expect(updated.hiringDecision.offeredSalary).toBe(38000000);
      expect(updated.hiringDecision.decidedBy).toBeDefined();
    });
  });

  describe('Định dạng tiền tệ và nhãn phụ trợ', () => {
    it('formatCurrencyVND định dạng chuẩn xác tiền tệ Việt Nam Đồng', () => {
      expect(formatCurrencyVND(38000000)).toContain('38.000.000');
      expect(formatCurrencyVND(undefined)).toBe('Thỏa thuận');
    });

    it('getConsensusLevelBadgeConfig và getGapStatusBadgeConfig trả về cấu hình class hợp lệ', () => {
      const consensusBadge = getConsensusLevelBadgeConfig('UNANIMOUS');
      expect(consensusBadge.label).toContain('Đồng thuận tuyệt đối');

      const gapBadge = getGapStatusBadgeConfig('EXCEEDS', 0.6);
      expect(gapBadge.label).toContain('Vượt chuẩn');
    });
  });
});
