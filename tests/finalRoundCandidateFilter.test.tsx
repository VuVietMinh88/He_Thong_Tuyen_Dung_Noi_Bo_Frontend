import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { FinalRoundCandidateFilterPanel } from '../src/components/Candidate/FinalRoundCandidateFilterPanel';
import { CandidateComparisonMatrix } from '../src/components/Candidate/CandidateComparisonMatrix';
import {
  candidateComparisonService,
  DEFAULT_FINAL_ROUND_CANDIDATES,
} from '../src/services/candidateComparisonService';
import {
  isCandidateFullyEvaluated,
  getEvaluationProgressBadgeConfig,
} from '../src/utils/candidateComparisonHelper';
import type { ComparisonCandidate } from '../src/types/candidateComparison';

describe('FinalRoundCandidateFilterPanel & Evaluation Check (Task Jira: TKNHTTDNB1-471 / User Story S7-01)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('AC 1: Bộ lọc trạng thái đánh giá (Evaluation Status Filter) & Huy hiệu tiến độ', () => {
    it('hiển thị đầy đủ 3 tùy chọn bộ lọc trạng thái: Đã đủ đánh giá, Chờ đánh giá, Tất cả ứng viên', () => {
      const html = renderToString(
        <FinalRoundCandidateFilterPanel onOpenComparison={vi.fn()} />
      );

      // Bộ lọc trạng thái
      expect(html).toContain('data-testid="filter-status-completed"');
      expect(html).toContain('Đã đủ đánh giá (Ready for Comparison)');

      expect(html).toContain('data-testid="filter-status-pending"');
      expect(html).toContain('Chờ đánh giá (Pending)');

      expect(html).toContain('data-testid="filter-status-all"');
      expect(html).toContain('Tất cả ứng viên vòng cuối');

      // Ô tìm kiếm nhanh
      expect(html).toContain('data-testid="input-search-final-candidate"');
    });

    it('tính toán huy hiệu tiến độ chính xác cho ứng viên đã đủ phiếu (3/3 Đã đánh giá - Xanh lá)', () => {
      const readyCandidate = DEFAULT_FINAL_ROUND_CANDIDATES[0]; // Nguyễn Văn An: 3/3
      expect(readyCandidate.evaluationProgress?.isFullyEvaluated).toBe(true);

      const badgeCfg = getEvaluationProgressBadgeConfig(readyCandidate.evaluationProgress);
      expect(badgeCfg.label).toBe('3/3 Đã đánh giá');
      expect(badgeCfg.isReady).toBe(true);
      expect(badgeCfg.containerClass).toContain('bg-emerald-50');
      expect(badgeCfg.containerClass).toContain('text-emerald-700');
    });

    it('tính toán huy hiệu tiến độ chính xác cho ứng viên đang chờ đánh giá (1/3 hoặc 2/3 Đang chờ - Vàng cam)', () => {
      const pendingCandidate = DEFAULT_FINAL_ROUND_CANDIDATES[3]; // Phạm Minh Đức: 1/3
      expect(pendingCandidate.evaluationProgress?.isFullyEvaluated).toBe(false);

      const badgeCfg = getEvaluationProgressBadgeConfig(pendingCandidate.evaluationProgress);
      expect(badgeCfg.label).toBe('1/3 Đang chờ');
      expect(badgeCfg.isReady).toBe(false);
      expect(badgeCfg.containerClass).toContain('bg-amber-50');
      expect(badgeCfg.containerClass).toContain('text-amber-700');
      expect(badgeCfg.tooltip).toContain('Lê Thu Hương');
    });
  });

  describe('AC 2: Kiểm tra điều kiện chọn ứng viên để so sánh', () => {
    it('kiểm tra hàm helper isCandidateFullyEvaluated nhận diện đúng trạng thái hoàn tất đánh giá', () => {
      const cand1 = DEFAULT_FINAL_ROUND_CANDIDATES[0]; // 3/3
      const cand3 = DEFAULT_FINAL_ROUND_CANDIDATES[2]; // 2/3
      const cand4 = DEFAULT_FINAL_ROUND_CANDIDATES[3]; // 1/3

      expect(isCandidateFullyEvaluated(cand1)).toBe(true);
      expect(isCandidateFullyEvaluated(cand3)).toBe(false);
      expect(isCandidateFullyEvaluated(cand4)).toBe(false);
    });

    it('bảng ma trận so sánh disable nút Thêm với ứng viên chưa đủ đánh giá và kèm tooltip giải thích', () => {
      const html = renderToString(
        <CandidateComparisonMatrix
          candidates={DEFAULT_FINAL_ROUND_CANDIDATES.slice(0, 2)}
          allAvailableCandidates={DEFAULT_FINAL_ROUND_CANDIDATES}
        />
      );

      // Render bảng so sánh
      expect(html).toContain('data-testid="candidate-comparison-matrix"');
      expect(html).toContain('data-testid="btn-add-candidate-to-compare"');
    });

    it('nút Mở bảng so sánh hiển thị số lượng ứng viên và gợi ý khi chưa đủ điều kiện', () => {
      const html = renderToString(
        <FinalRoundCandidateFilterPanel
          selectedCandidateIds={[]} // Chưa chọn ứng viên nào
          onOpenComparison={vi.fn()}
        />
      );

      expect(html).toContain('data-testid="btn-open-comparison-matrix"');
      expect(html).toContain('Mở bảng so sánh');
    });
  });

  describe('AC 3: Kết nối API & Xử lý bất đồng bộ trong candidateComparisonService', () => {
    it('getFinalCandidatesWithEvaluations lọc đúng danh sách khi status = COMPLETED', async () => {
      const completedCandidates = await candidateComparisonService.getFinalCandidatesWithEvaluations(
        undefined,
        'COMPLETED'
      );

      expect(completedCandidates.length).toBeGreaterThan(0);
      // Toàn bộ ứng viên trả về phải có isFullyEvaluated === true
      completedCandidates.forEach((c) => {
        expect(c.evaluationProgress?.isFullyEvaluated).toBe(true);
      });
    });

    it('getFinalCandidatesWithEvaluations lọc đúng danh sách khi status = PENDING', async () => {
      const pendingCandidates = await candidateComparisonService.getFinalCandidatesWithEvaluations(
        undefined,
        'PENDING'
      );

      expect(pendingCandidates.length).toBeGreaterThan(0);
      // Toàn bộ ứng viên trả về phải có isFullyEvaluated === false
      pendingCandidates.forEach((c) => {
        expect(c.evaluationProgress?.isFullyEvaluated).toBe(false);
      });
    });

    it('getFinalCandidatesWithEvaluations trả về toàn bộ ứng viên khi status = ALL', async () => {
      const allCandidates = await candidateComparisonService.getFinalCandidatesWithEvaluations(
        undefined,
        'ALL'
      );

      expect(allCandidates.length).toBe(5);
      const completedCount = allCandidates.filter((c) => c.evaluationProgress?.isFullyEvaluated).length;
      const pendingCount = allCandidates.filter((c) => !c.evaluationProgress?.isFullyEvaluated).length;
      expect(completedCount).toBe(3);
      expect(pendingCount).toBe(2);
    });

    it('lọc ứng viên theo jobId khi được truyền vào', async () => {
      const jobCandidates = await candidateComparisonService.getFinalCandidatesWithEvaluations(
        'jp-demo-306',
        'ALL'
      );

      expect(jobCandidates.length).toBe(5);
      jobCandidates.forEach((c) => {
        expect(c.appliedJobId).toBe('jp-demo-306');
      });

      const nonExistent = await candidateComparisonService.getFinalCandidatesWithEvaluations(
        'job-not-found',
        'ALL'
      );
      expect(nonExistent.length).toBe(0);
    });
  });

  describe('Tích hợp kiểm tra điều kiện đánh giá và điều hướng', () => {
    it('helper getEvaluationProgressBadgeConfig xử lý trường hợp không có dữ liệu tiến độ (fallback an toàn)', () => {
      const fallbackBadge = getEvaluationProgressBadgeConfig(undefined);
      expect(fallbackBadge.isReady).toBe(false);
      expect(fallbackBadge.label).toBe('Chưa có thông tin');
    });

    it('helper isCandidateFullyEvaluated fallback dựa vào số lượng phiếu nộp nếu không có trường evaluationProgress', () => {
      const candidateNoProgress: ComparisonCandidate = {
        ...DEFAULT_FINAL_ROUND_CANDIDATES[0],
        evaluationProgress: undefined,
        interviewerFeedbacks: [
          {
            interviewerId: 'i-1',
            interviewerName: 'Quang',
            interviewerRole: 'Lead',
            conclusion: 'RECOMMENDED',
            comment: 'Tốt',
          },
          {
            interviewerId: 'i-2',
            interviewerName: 'Hương',
            interviewerRole: 'HR',
            conclusion: 'RECOMMENDED',
            comment: 'Tốt',
          },
        ],
      };

      expect(isCandidateFullyEvaluated(candidateNoProgress)).toBe(true);

      const candidateSingleFeedback: ComparisonCandidate = {
        ...candidateNoProgress,
        interviewerFeedbacks: [candidateNoProgress.interviewerFeedbacks[0]],
      };
      expect(isCandidateFullyEvaluated(candidateSingleFeedback)).toBe(false);
    });
  });
});
