import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import type {
  CandidateProfile,
  CvSuggestedCandidateInfo,
} from '../src/types/candidate';
import { candidateService } from '../src/services/candidateService';
import { CvSuggestionConfirmBox } from '../src/components/Candidate/CvSuggestionConfirmBox';
import { CandidateDetailModal } from '../src/components/Candidate/CandidateDetailModal';

describe('Subtask TKNHTTDNB1-331: Thiết kế giao diện xác nhận dữ liệu gợi ý từ CV (Story TKNHTTDNB1-43)', () => {
  const storageMap = new Map<string, string>();
  const mockLocalStorage = {
    getItem: (storageKey: string) => storageMap.get(storageKey) ?? null,
    setItem: (storageKey: string, storageValue: string) =>
      storageMap.set(storageKey, storageValue),
    removeItem: (storageKey: string) => storageMap.delete(storageKey),
    clear: () => storageMap.clear(),
  };

  const samplePendingCandidate: CandidateProfile = {
    id: 'cand-test-001',
    trackingCode: 'APP-2026-TEST01',
    fullName: 'Nguyen Van A',
    email: 'vana.temp@gmail.com',
    phone: '0912345678',
    appliedJobId: 'jp-demo-306',
    appliedJobTitle: 'Senior Frontend Developer',
    departmentName: 'Khối Công nghệ & Sản phẩm',
    source: 'Website công ty',
    status: 'Mới tiếp nhận',
    cvUrl: '/sample-cv-1.pdf',
    cvFileName: 'CV_NguyenVanAn_SeniorFrontend.pdf',
    cvParsingStatus: 'PENDING_CONFIRMATION',
    cvSuggestedInfo: {
      fullName: 'Nguyễn Văn An',
      email: 'an.nguyen.dev@outlook.com',
      phone: '0988123456',
      confidenceScore: 0.94,
      extractedAt: '2026-10-14T10:00:00.000Z',
      rawSnippet: 'Họ tên: Nguyễn Văn An | Email: an.nguyen.dev@outlook.com | ĐT: 0988123456',
    },
    coverLetter: 'Thư ứng tuyển vị trí Frontend.',
    appliedAt: '2026-10-14T09:30:00.000Z',
    updatedAt: '2026-10-14T10:00:00.000Z',
  };

  beforeEach(() => {
    storageMap.clear();
    vi.stubGlobal('localStorage', mockLocalStorage);
    vi.stubGlobal('window', {
      localStorage: mockLocalStorage,
      dispatchEvent: vi.fn(),
    });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('1. Hiển thị 3 trường thông tin gợi ý đọc từ tệp PDF', () => {
    it('hiển thị đầy đủ Họ tên, Email và Số điện thoại gợi ý đọc từ CV PDF', () => {
      const renderedHtml = renderToString(
        React.createElement(CvSuggestionConfirmBox, {
          candidateProfile: samplePendingCandidate,
          onApplySuggestion: vi.fn(),
          onDismissSuggestion: vi.fn(),
        })
      );

      // 1. Họ tên gợi ý
      expect(renderedHtml).toContain('Họ và tên gợi ý');
      expect(renderedHtml).toContain('value="Nguyễn Văn An"');

      // 2. Email gợi ý
      expect(renderedHtml).toContain('Email gợi ý');
      expect(renderedHtml).toContain('value="an.nguyen.dev@outlook.com"');

      // 3. Số điện thoại gợi ý
      expect(renderedHtml).toContain('Số điện thoại gợi ý');
      expect(renderedHtml).toContain('value="0988123456"');

      // 4. Đoạn trích xuất từ CV
      expect(renderedHtml).toContain('Họ tên: Nguyễn Văn An | Email: an.nguyen.dev@outlook.com');
    });

    it('hiển thị độ tin cậy trích xuất khi có dữ liệu', () => {
      const renderedHtml = renderToString(
        React.createElement(CvSuggestionConfirmBox, {
          candidateProfile: samplePendingCandidate,
          onApplySuggestion: vi.fn(),
          onDismissSuggestion: vi.fn(),
        })
      );

      expect(renderedHtml).toContain('Độ chính xác: 94%');
    });
  });

  describe('2. Thao tác xác nhận hoặc chỉnh sửa của Recruiter', () => {
    it('đặt khu vực gợi ý đối chiếu trực quan với thông tin hiện tại của hồ sơ', () => {
      const renderedHtml = renderToString(
        React.createElement(CvSuggestionConfirmBox, {
          candidateProfile: samplePendingCandidate,
          onApplySuggestion: vi.fn(),
          onDismissSuggestion: vi.fn(),
        })
      );

      // Cột 1: Thông tin hồ sơ hiện tại
      expect(renderedHtml).toContain('Thông tin hồ sơ hiện tại');
      expect(renderedHtml).toContain('id="current-candidate-fullname"');
      expect(renderedHtml).toContain('Nguyen Van A');
      expect(renderedHtml).toContain('id="current-candidate-email"');
      expect(renderedHtml).toContain('vana.temp@gmail.com');
      expect(renderedHtml).toContain('id="current-candidate-phone"');
      expect(renderedHtml).toContain('0912345678');

      // Cột 2: Gợi ý từ CV
      expect(renderedHtml).toContain('Gợi ý từ tệp CV (Có thể chỉnh sửa)');
      expect(renderedHtml).toContain('id="suggested-candidate-fullname-input"');
      expect(renderedHtml).toContain('id="suggested-candidate-email-input"');
      expect(renderedHtml).toContain('id="suggested-candidate-phone-input"');
    });

    it('hiển thị nhãn đánh dấu sự khác biệt khi thông tin gợi ý khác thông tin hiện tại', () => {
      const renderedHtml = renderToString(
        React.createElement(CvSuggestionConfirmBox, {
          candidateProfile: samplePendingCandidate,
          onApplySuggestion: vi.fn(),
          onDismissSuggestion: vi.fn(),
        })
      );

      // Do họ tên ("Nguyễn Văn An" vs "Nguyen Van A"), email và số điện thoại đều khác nhau
      expect(renderedHtml).toContain('Khác hiện tại');
      expect(renderedHtml).toContain('Sẽ cập nhật các trường có sự khác biệt vào hồ sơ ứng viên');
    });

    it('có nút "Xác nhận áp dụng" và nút "Bỏ qua" để Recruiter chủ động thao tác', () => {
      const renderedHtml = renderToString(
        React.createElement(CvSuggestionConfirmBox, {
          candidateProfile: samplePendingCandidate,
          onApplySuggestion: vi.fn(),
          onDismissSuggestion: vi.fn(),
        })
      );

      // Nút xác nhận áp dụng
      expect(renderedHtml).toContain('id="confirm-cv-suggestion-btn"');
      expect(renderedHtml).toContain('Xác nhận áp dụng');

      // Nút bỏ qua
      expect(renderedHtml).toContain('id="dismiss-cv-suggestion-btn"');
      expect(renderedHtml).toContain('Bỏ qua');
    });
  });

  describe('3. Các trạng thái hiển thị đầy đủ theo yêu cầu', () => {
    it('hiển thị trạng thái đang đọc dữ liệu từ PDF (PARSING) với loader/skeleton', () => {
      const parsingCandidate: CandidateProfile = {
        ...samplePendingCandidate,
        cvParsingStatus: 'PARSING',
        cvSuggestedInfo: undefined,
      };

      const renderedHtml = renderToString(
        React.createElement(CvSuggestionConfirmBox, {
          candidateProfile: parsingCandidate,
          onApplySuggestion: vi.fn(),
          onDismissSuggestion: vi.fn(),
        })
      );

      expect(renderedHtml).toContain('Hệ thống đang trích xuất dữ liệu từ CV PDF...');
      expect(renderedHtml).toContain('Đang xử lý');
      expect(renderedHtml).toContain('animate-pulse');
      expect(renderedHtml).toContain('CV_NguyenVanAn_SeniorFrontend.pdf');
    });

    it('hiển thị trạng thái đọc CV bị lỗi (FAILED) nhẹ nhàng, tinh tế và có nút thử lại', () => {
      const failedCandidate: CandidateProfile = {
        ...samplePendingCandidate,
        cvParsingStatus: 'FAILED',
        cvSuggestedInfo: undefined,
        cvParsingErrorMessage:
          'Tệp CV là định dạng ảnh chụp scan, không thể trích xuất tự động văn bản có cấu trúc.',
      };

      const renderedHtml = renderToString(
        React.createElement(CvSuggestionConfirmBox, {
          candidateProfile: failedCandidate,
          onApplySuggestion: vi.fn(),
          onDismissSuggestion: vi.fn(),
          onRetryParsing: vi.fn(),
        })
      );

      // Hiển thị nhẹ nhàng với role="alert" và cảnh báo amber
      expect(renderedHtml).toContain('role="alert"');
      expect(renderedHtml).toContain('Chưa thể tự động đọc dữ liệu từ tệp CV');
      expect(renderedHtml).toContain('Tệp CV là định dạng ảnh chụp scan');
      // Có nút thử đọc lại
      expect(renderedHtml).toContain('id="retry-cv-parsing-btn"');
      expect(renderedHtml).toContain('Thử đọc lại CV');
    });

    it('hiển thị trạng thái đã xác nhận (CONFIRMED)', () => {
      const confirmedCandidate: CandidateProfile = {
        ...samplePendingCandidate,
        cvParsingStatus: 'CONFIRMED',
      };

      const renderedHtml = renderToString(
        React.createElement(CvSuggestionConfirmBox, {
          candidateProfile: confirmedCandidate,
          onApplySuggestion: vi.fn(),
          onDismissSuggestion: vi.fn(),
        })
      );

      expect(renderedHtml).toContain('Đã xác nhận dữ liệu gợi ý từ CV');
      expect(renderedHtml).toContain('Đã đồng bộ');
      expect(renderedHtml).toContain('Thông tin hồ sơ ứng viên đã được đối chiếu');
    });

    it('hiển thị trạng thái đã bỏ qua (DISMISSED)', () => {
      const dismissedCandidate: CandidateProfile = {
        ...samplePendingCandidate,
        cvParsingStatus: 'DISMISSED',
      };

      const renderedHtml = renderToString(
        React.createElement(CvSuggestionConfirmBox, {
          candidateProfile: dismissedCandidate,
          onApplySuggestion: vi.fn(),
          onDismissSuggestion: vi.fn(),
          onRetryParsing: vi.fn(),
        })
      );

      expect(renderedHtml).toContain('Đã bỏ qua dữ liệu gợi ý từ CV');
      expect(renderedHtml).toContain('Hồ sơ đang giữ nguyên thông tin ban đầu');
      expect(renderedHtml).toContain('Xem lại gợi ý từ CV');
    });
  });

  describe('4. Tích hợp trong CandidateDetailModal và candidateService', () => {
    it('CandidateDetailModal nhúng CvSuggestionConfirmBox và hiển thị đầy đủ thông tin ứng viên', () => {
      const renderedHtml = renderToString(
        React.createElement(CandidateDetailModal, {
          isOpen: true,
          candidateProfile: samplePendingCandidate,
          onClose: vi.fn(),
        })
      );

      // Kiểm tra modal hiển thị mã hồ sơ, họ tên và component gợi ý CV
      expect(renderedHtml).toContain('APP-2026-TEST01');
      expect(renderedHtml).toContain('Senior Frontend Developer');
      expect(renderedHtml).toContain('Dữ liệu gợi ý đọc từ tệp CV');
      expect(renderedHtml).toContain('Tệp CV đính kèm của ứng viên');
      expect(renderedHtml).toContain('CV_NguyenVanAn_SeniorFrontend.pdf');
    });

    it('candidateService.confirmCvSuggestion cập nhật đúng 3 trường họ tên, email, phone vào hồ sơ', async () => {
      const confirmedPayload: CvSuggestedCandidateInfo = {
        fullName: 'Nguyễn Văn An (Đã chuẩn hóa)',
        email: 'an.nguyen.official@outlook.com',
        phone: '0988999888',
        confidenceScore: 0.99,
        extractedAt: '2026-10-14T10:30:00.000Z',
      };

      const updatedCandidate = await candidateService.confirmCvSuggestion(
        'cand-001',
        confirmedPayload
      );

      expect(updatedCandidate.id).toBe('cand-001');
      expect(updatedCandidate.fullName).toBe('Nguyễn Văn An (Đã chuẩn hóa)');
      expect(updatedCandidate.email).toBe('an.nguyen.official@outlook.com');
      expect(updatedCandidate.phone).toBe('0988999888');
      expect(updatedCandidate.cvParsingStatus).toBe('CONFIRMED');
    });

    it('candidateService.dismissCvSuggestion đánh dấu trạng thái DISMISSED', async () => {
      const dismissedCandidate = await candidateService.dismissCvSuggestion('cand-001');

      expect(dismissedCandidate.id).toBe('cand-001');
      expect(dismissedCandidate.cvParsingStatus).toBe('DISMISSED');
    });

    it('candidateService.retryCvParsing chuyển trạng thái sang PENDING_CONFIRMATION', async () => {
      const retriedCandidate = await candidateService.retryCvParsing('cand-004');

      expect(retriedCandidate.id).toBe('cand-004');
      expect(retriedCandidate.cvParsingStatus).toBe('PENDING_CONFIRMATION');
      expect(retriedCandidate.cvSuggestedInfo).toBeDefined();
    });

    it('candidateService.getCandidates hỗ trợ lọc theo trạng thái CV và từ khóa tìm kiếm', async () => {
      const allCandidates = await candidateService.getCandidates();
      expect(allCandidates.length).toBeGreaterThan(0);

      const pendingCandidates = await candidateService.getCandidates({
        cvParsingStatus: 'PENDING_CONFIRMATION',
      });
      pendingCandidates.forEach((candidateItem) => {
        expect(candidateItem.cvParsingStatus).toBe('PENDING_CONFIRMATION');
      });

      const keywordMatchedCandidates = await candidateService.getCandidates({
        keyword: 'Trần Thị Bích',
      });
      expect(keywordMatchedCandidates.length).toBe(1);
      expect(keywordMatchedCandidates[0].fullName).toBe('Trần Thị Bích');
    });
  });
});
