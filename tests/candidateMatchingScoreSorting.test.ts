import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import type { CandidateProfile } from '../src/types/candidate';
import {
  DEFAULT_CANDIDATE_SORT_OPTION,
  CANDIDATE_SORT_OPTIONS,
} from '../src/types/candidate';
import {
  extractCandidateMatchingScore,
  sortCandidatesByMatchingScore,
} from '../src/utils/candidateMatchingHelper';
import { candidateService } from '../src/services/candidateService';
import { CandidateManagementPage } from '../src/pages/Candidate/CandidateManagementPage';
import axiosClient from '../src/utils/axiosClient';

describe('Task TKNHTTDNB1-411 / Story TKNHTTDNB1-57: Tích hợp sắp xếp ứng viên theo điểm gợi ý', () => {
  const sampleCandidateHigh: CandidateProfile = {
    id: 'cand-score-90',
    fullName: 'Hoàng Minh Cao',
    email: 'cao.hoang@company.com',
    phone: '0911222333',
    appliedJobTitle: 'Senior Frontend Developer',
    cvParsingStatus: 'CONFIRMED',
    status: 'IN_REVIEW',
    appliedAt: '2026-10-10T10:00:00.000Z',
    matchingEvaluation: {
      totalMatchingScore: 90,
      isOverallPassed: true,
      summaryText: 'Rất phù hợp',
      criteriaList: [],
      evaluatedAt: '2026-10-10T10:00:00.000Z',
    },
  };

  const sampleCandidateMedium: CandidateProfile = {
    id: 'cand-score-75',
    fullName: 'Lê Văn Trung',
    email: 'trung.le@company.com',
    phone: '0922333444',
    appliedJobTitle: 'Frontend Developer',
    cvParsingStatus: 'CONFIRMED',
    status: 'SCREENING',
    appliedAt: '2026-10-12T14:00:00.000Z',
    matchingEvaluation: {
      totalMatchingScore: 75,
      isOverallPassed: true,
      summaryText: 'Tương đối phù hợp',
      criteriaList: [],
      evaluatedAt: '2026-10-12T14:00:00.000Z',
    },
  };

  const sampleCandidateFailed: CandidateProfile = {
    id: 'cand-score-50-failed',
    fullName: 'Nguyễn Văn Kém',
    email: 'kem.nguyen@company.com',
    phone: '0933444555',
    appliedJobTitle: 'Frontend Developer',
    cvParsingStatus: 'CONFIRMED',
    status: 'SCREENING',
    appliedAt: '2026-10-09T08:00:00.000Z',
    matchingEvaluation: {
      totalMatchingScore: 50,
      isOverallPassed: false,
      summaryText: 'Không đạt tiêu chí',
      criteriaList: [],
      evaluatedAt: '2026-10-09T08:00:00.000Z',
    },
  };

  const sampleCandidateZeroScore: CandidateProfile = {
    id: 'cand-score-0',
    fullName: 'Đỗ Hữu Không',
    email: 'khong.do@company.com',
    phone: '0944555666',
    appliedJobTitle: 'Frontend Developer',
    cvParsingStatus: 'CONFIRMED',
    status: 'SCREENING',
    appliedAt: '2026-10-11T09:00:00.000Z',
    matchingEvaluation: {
      totalMatchingScore: 0,
      isOverallPassed: false,
      summaryText: 'Điểm bằng không',
      criteriaList: [],
      evaluatedAt: '2026-10-11T09:00:00.000Z',
    },
  };

  const sampleCandidateNoScore: CandidateProfile = {
    id: 'cand-no-score-parsing',
    fullName: 'Trần Chưa Bóc Tách',
    email: 'chua.tran@company.com',
    phone: '0955666777',
    appliedJobTitle: 'Frontend Developer',
    cvParsingStatus: 'PARSING',
    status: 'NEW',
    appliedAt: '2026-10-13T16:00:00.000Z',
    // Chưa có kết quả đánh giá (undefined)
  };

  const sampleCandidateNullScore: CandidateProfile = {
    id: 'cand-null-score',
    fullName: 'Vũ Điểm Trống',
    email: 'trong.vu@company.com',
    phone: '0966777888',
    appliedJobTitle: 'Frontend Developer',
    cvParsingStatus: 'FAILED',
    status: 'NEW',
    appliedAt: '2026-10-14T07:00:00.000Z',
    matchingEvaluation: {
      totalMatchingScore: null as unknown as number,
      isOverallPassed: false,
      summaryText: 'Chưa có điểm',
      criteriaList: [],
      evaluatedAt: '2026-10-14T07:00:00.000Z',
    },
  };

  describe('1. Hàm extractCandidateMatchingScore', () => {
    it('trích xuất chính xác điểm khi có matchingEvaluation', () => {
      expect(extractCandidateMatchingScore(sampleCandidateHigh)).toBe(90);
      expect(extractCandidateMatchingScore(sampleCandidateMedium)).toBe(75);
      expect(extractCandidateMatchingScore(sampleCandidateZeroScore)).toBe(0);
    });

    it('trả về null khi hồ sơ chưa có kết quả đánh giá hoặc điểm bị null/undefined', () => {
      expect(extractCandidateMatchingScore(sampleCandidateNoScore)).toBeNull();
      expect(extractCandidateMatchingScore(sampleCandidateNullScore)).toBeNull();
    });

    it('hỗ trợ trích xuất thuộc tính matchingScore trực tiếp trên đối tượng (nếu có)', () => {
      const candidateWithDirectScore = {
        id: 'cand-direct-score',
        fullName: 'Phan Điểm Trực Tiếp',
        email: 'phan@test.com',
        phone: '0912345678',
        cvParsingStatus: 'CONFIRMED' as const,
        matchingScore: 82,
      } as CandidateProfile;
      expect(extractCandidateMatchingScore(candidateWithDirectScore)).toBe(82);
    });
  });

  describe('2. Hàm sortCandidatesByMatchingScore (AC 1, AC 2, AC 3)', () => {
    it('sắp xếp SCORE_DESC: đưa điểm cao nhất lên đầu, điểm 0 xếp trước null/undefined, hồ sơ không có điểm xếp cuối', () => {
      const candidateInputList = [
        sampleCandidateNoScore,
        sampleCandidateFailed,
        sampleCandidateHigh,
        sampleCandidateZeroScore,
        sampleCandidateNullScore,
        sampleCandidateMedium,
      ];

      const sortedResultList = sortCandidatesByMatchingScore(
        candidateInputList,
        'SCORE_DESC'
      );

      // Thứ tự kỳ vọng: 90 -> 75 -> 50 -> 0 -> các hồ sơ không có điểm (null/undefined)
      expect(sortedResultList.map((candidateItem) => candidateItem.id)).toEqual([
        'cand-score-90',
        'cand-score-75',
        'cand-score-50-failed',
        'cand-score-0',
        'cand-null-score', // 2026-10-14 mới hơn 2026-10-13
        'cand-no-score-parsing',
      ]);
    });

    it('sắp xếp SCORE_ASC: đưa điểm thấp nhất lên đầu trong số hồ sơ có điểm, các hồ sơ không có điểm VẪN xếp cuối', () => {
      const candidateInputList = [
        sampleCandidateNoScore,
        sampleCandidateHigh,
        sampleCandidateFailed,
        sampleCandidateZeroScore,
        sampleCandidateMedium,
      ];

      const sortedResultList = sortCandidatesByMatchingScore(
        candidateInputList,
        'SCORE_ASC'
      );

      // Thứ tự kỳ vọng: 0 -> 50 -> 75 -> 90 -> hồ sơ không có điểm ở cuối cùng
      expect(sortedResultList.map((candidateItem) => candidateItem.id)).toEqual([
        'cand-score-0',
        'cand-score-50-failed',
        'cand-score-75',
        'cand-score-90',
        'cand-no-score-parsing',
      ]);
    });

    it('sắp xếp APPLIED_AT_DESC: đưa ngày nộp mới nhất lên đầu danh sách', () => {
      const candidateInputList = [
        sampleCandidateFailed, // 2026-10-09
        sampleCandidateHigh, // 2026-10-10
        sampleCandidateMedium, // 2026-10-12
      ];

      const sortedResultList = sortCandidatesByMatchingScore(
        candidateInputList,
        'APPLIED_AT_DESC'
      );

      expect(sortedResultList.map((candidateItem) => candidateItem.id)).toEqual([
        'cand-score-75', // 2026-10-12
        'cand-score-90', // 2026-10-10
        'cand-score-50-failed', // 2026-10-09
      ]);
    });

    it('khi hai hồ sơ có điểm bằng nhau, ưu tiên hồ sơ nộp mới hơn lên trước', () => {
      const candidateScoreEqualOlder: CandidateProfile = {
        ...sampleCandidateHigh,
        id: 'cand-equal-older',
        appliedAt: '2026-10-08T00:00:00.000Z',
      };
      const candidateScoreEqualNewer: CandidateProfile = {
        ...sampleCandidateHigh,
        id: 'cand-equal-newer',
        appliedAt: '2026-10-14T00:00:00.000Z',
      };

      const sortedResultList = sortCandidatesByMatchingScore(
        [candidateScoreEqualOlder, candidateScoreEqualNewer],
        'SCORE_DESC'
      );

      expect(sortedResultList[0].id).toBe('cand-equal-newer');
      expect(sortedResultList[1].id).toBe('cand-equal-older');
    });

    it('AC 3: BẢO TOÀN 100% hồ sơ ứng viên (Không ẩn / Không tự động loại)', () => {
      const fullCandidateList = [
        sampleCandidateHigh,
        sampleCandidateMedium,
        sampleCandidateFailed,
        sampleCandidateZeroScore,
        sampleCandidateNoScore,
        sampleCandidateNullScore,
      ];

      const sortedResultList = sortCandidatesByMatchingScore(
        fullCandidateList,
        'SCORE_DESC'
      );

      // Đảm bảo số lượng phần tử giữ nguyên 100%
      expect(sortedResultList.length).toBe(fullCandidateList.length);

      // Đảm bảo ứng viên điểm 0 và ứng viên cờ Không đạt vẫn có mặt trong kết quả
      expect(sortedResultList.some((item) => item.id === 'cand-score-0')).toBe(true);
      expect(sortedResultList.some((item) => item.id === 'cand-score-50-failed')).toBe(true);

      // Tuyệt đối không thay đổi trạng thái Pipeline của ứng viên sang REJECTED
      const failedCandidate = sortedResultList.find(
        (item) => item.id === 'cand-score-50-failed'
      );
      expect(failedCandidate?.status).toBe('SCREENING');
      expect(failedCandidate?.status).not.toBe('REJECTED');
    });
  });

  describe('3. Tích hợp API candidateService.getCandidates với tham số sắp xếp (AC 2)', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
      if (typeof window !== 'undefined') {
        window.localStorage.clear();
      }
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('gọi getCandidates với sortBy gửi đúng tham số vào axiosClient', async () => {
      const axiosGetSpy = vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: [
          sampleCandidateMedium,
          sampleCandidateHigh,
        ],
      });

      const resultList = await candidateService.getCandidates({
        sortBy: 'SCORE_DESC',
      });

      expect(axiosGetSpy).toHaveBeenCalledWith(
        '/recruitment/candidates',
        expect.objectContaining({
          params: expect.objectContaining({
            sortBy: 'SCORE_DESC',
          }),
        })
      );

      // Đảm bảo kết quả trả về từ API đã được sắp xếp điểm cao lên trước
      expect(resultList[0].id).toBe('cand-score-90');
      expect(resultList[1].id).toBe('cand-score-75');
    });

    it('khi không truyền sortBy, mặc định sắp xếp theo DEFAULT_CANDIDATE_SORT_OPTION (SCORE_DESC)', async () => {
      const candidates = await candidateService.getCandidates();
      expect(candidates.length).toBeGreaterThan(0);

      // Kiểm tra điểm của ứng viên đầu tiên lớn hơn hoặc bằng ứng viên tiếp theo
      const firstCandidateScore =
        candidates[0].matchingEvaluation?.totalMatchingScore ?? 0;
      const secondCandidateScore =
        candidates[1].matchingEvaluation?.totalMatchingScore ?? 0;
      expect(firstCandidateScore).toBeGreaterThanOrEqual(secondCandidateScore);
    });
  });

  describe('4. Giao diện bộ điều khiển sắp xếp trên CandidateManagementPage (AC 1)', () => {
    it('hiển thị đầy đủ bộ chọn dropdown với 3 tùy chọn sắp xếp', () => {
      const htmlOutput = renderToString(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(CandidateManagementPage, {
            initialCandidates: [sampleCandidateHigh, sampleCandidateMedium],
            initialIsLoading: false,
          })
        )
      );

      // 1. Kiểm tra dropdown sắp xếp có mặt
      expect(htmlOutput).toContain('id="candidate-sort-select"');
      expect(htmlOutput).toContain('data-testid="candidate-sort-select"');

      // 2. Kiểm tra 3 tùy chọn sắp xếp
      expect(htmlOutput).toContain('Điểm phù hợp: Cao đến thấp (Gợi ý đọc trước)');
      expect(htmlOutput).toContain('Điểm phù hợp: Thấp đến cao');
      expect(htmlOutput).toContain('Ngày nộp hồ sơ: Mới nhất');
    });

    it('hiển thị nút sắp xếp trên tiêu đề cột Điểm phù hợp & Tiêu chí và cột Thời điểm nộp', () => {
      const htmlOutput = renderToString(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(CandidateManagementPage, {
            initialCandidates: [sampleCandidateHigh, sampleCandidateMedium],
            initialIsLoading: false,
          })
        )
      );

      // Nút sắp xếp trên tiêu đề cột Điểm phù hợp
      expect(htmlOutput).toContain('data-testid="sort-by-score-header-btn"');
      expect(htmlOutput).toContain('Điểm phù hợp &amp; Tiêu chí');

      // Nút sắp xếp trên tiêu đề cột Thời điểm nộp
      expect(htmlOutput).toContain('data-testid="sort-by-date-header-btn"');
      expect(htmlOutput).toContain('Thời điểm nộp');
    });

    it('hiển thị nhãn "Gợi ý đọc trước" khi sắp xếp SCORE_DESC cho ứng viên điểm cao (>= 80)', () => {
      const htmlOutput = renderToString(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(CandidateManagementPage, {
            initialCandidates: [sampleCandidateHigh, sampleCandidateMedium],
            initialIsLoading: false,
          })
        )
      );
      expect(htmlOutput).toContain('Gợi ý đọc trước');
      expect(htmlOutput).toContain('data-testid="badge-read-first-cand-score-90"');
    });

    it('CANDIDATE_SORT_OPTIONS chứa đủ 3 cấu hình chuẩn', () => {
      expect(CANDIDATE_SORT_OPTIONS.length).toBe(3);
      expect(CANDIDATE_SORT_OPTIONS.map((item) => item.value)).toEqual([
        'SCORE_DESC',
        'SCORE_ASC',
        'APPLIED_AT_DESC',
      ]);
      expect(DEFAULT_CANDIDATE_SORT_OPTION).toBe('SCORE_DESC');
    });
  });
});
