import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import type {
  CandidateProfile,
  CvSuggestedCandidateInfo,
} from '../src/types/candidate';
import { candidateService } from '../src/services/candidateService';
import { CandidateDetailModal } from '../src/components/Candidate/CandidateDetailModal';
import { CvSuggestionConfirmBox } from '../src/components/Candidate/CvSuggestionConfirmBox';
import axiosClient from '../src/utils/axiosClient';

describe('Subtask TKNHTTDNB1-332: Tích hợp trích CV mà không ghi đè dữ liệu đã nhập (Story TKNHTTDNB1-43)', () => {
  const storageMap = new Map<string, string>();
  const mockLocalStorage = {
    getItem: (storageKey: string) => storageMap.get(storageKey) ?? null,
    setItem: (storageKey: string, storageValue: string) =>
      storageMap.set(storageKey, storageValue),
    removeItem: (storageKey: string) => storageMap.delete(storageKey),
    clear: () => storageMap.clear(),
  };

  const initialCandidateProfile: CandidateProfile = {
    id: 'cand-extract-001',
    trackingCode: 'APP-2026-EXTRACT01',
    fullName: 'Lê Hoàng Nam',
    email: 'nam.le.ai@gmail.com',
    phone: '0933221100',
    appliedJobId: 'jp-demo-308',
    appliedJobTitle: 'AI & Machine Learning Specialist',
    departmentName: 'Trung tâm Nghiên cứu AI & Dữ liệu',
    source: 'Website công ty',
    status: 'Mới tiếp nhận',
    cvUrl: '/sample-cv-ai.pdf',
    cvFileName: 'LeHoangNam_CV_AI_Specialist.pdf',
    cvParsingStatus: 'PARSING',
    appliedAt: '2026-10-14T08:00:00.000Z',
    updatedAt: '2026-10-14T08:00:00.000Z',
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

  describe('1. Tích hợp API trích xuất thông tin gợi ý từ CV PDF', () => {
    it('gọi API fetchCvParsedSuggestion và trả về 3 trường Họ tên, Email, Số điện thoại từ CV PDF', async () => {
      const mockExtractedPayload: CvSuggestedCandidateInfo = {
        fullName: 'Lê Hoàng Nam (Thạc sĩ AI)',
        email: 'nam.le.official@outlook.com',
        phone: '0988665544',
        confidenceScore: 0.96,
        extractedAt: '2026-10-14T08:15:00.000Z',
        rawSnippet: 'Lê Hoàng Nam | Email: nam.le.official@outlook.com | ĐT: 0988665544',
      };

      vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: mockExtractedPayload,
      });

      const extractedResult = await candidateService.fetchCvParsedSuggestion(
        'cand-extract-001'
      );

      expect(axiosClient.get).toHaveBeenCalledWith(
        '/recruitment/candidates/cand-extract-001/cv-suggestion'
      );
      expect(extractedResult.fullName).toBe('Lê Hoàng Nam (Thạc sĩ AI)');
      expect(extractedResult.email).toBe('nam.le.official@outlook.com');
      expect(extractedResult.phone).toBe('0988665544');
      expect(extractedResult.confidenceScore).toBe(0.96);
    });

    it('fallback lấy dữ liệu trích xuất thành công khi backend chưa sẵn sàng', async () => {
      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(
        new Error('Network error fallback to simulated data')
      );

      const extractedResult = await candidateService.fetchCvParsedSuggestion('cand-001');

      expect(extractedResult).toBeDefined();
      expect(extractedResult.fullName).toBe('Nguyễn Văn An');
      expect(extractedResult.email).toBe('an.nguyen.dev@outlook.com');
      expect(extractedResult.phone).toBe('0988123456');
      expect(extractedResult.confidenceScore).toBe(0.94);
    });
  });

  describe('2. Đảm bảo KHÔNG tự động ghi đè dữ liệu đã nhập của ứng viên', () => {
    it('khi API trích xuất CV thành công, dữ liệu hồ sơ gốc (fullName, email, phone) giữ nguyên 100%', async () => {
      // Lưu hồ sơ ban đầu vào storage
      mockLocalStorage.setItem(
        'smart_recruit_candidate_profiles',
        JSON.stringify([initialCandidateProfile])
      );

      // Giả lập API bóc tách trả về họ tên, email, phone KHÁC với hồ sơ đã nhập
      const mockDifferentCvData: CvSuggestedCandidateInfo = {
        fullName: 'Lê Hoàng Nam Khác Hoàn Toàn',
        email: 'nam.different@company.com',
        phone: '0999888777',
        confidenceScore: 0.95,
      };

      vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: mockDifferentCvData,
      });

      // Gọi trích xuất CV
      const suggestionResult = await candidateService.fetchCvParsedSuggestion(
        'cand-extract-001'
      );

      // Kiểm tra kết quả trả về đúng dữ liệu gợi ý
      expect(suggestionResult.fullName).toBe('Lê Hoàng Nam Khác Hoàn Toàn');

      // Tại sao: Kiểm tra hồ sơ trong storage để đảm bảo fetchCvParsedSuggestion KHÔNG tự ý ghi đè dữ liệu gốc
      const candidateList = JSON.parse(
        mockLocalStorage.getItem('smart_recruit_candidate_profiles') || '[]'
      ) as CandidateProfile[];
      const profileAfterExtraction = candidateList.find(
        (candidateItem) => candidateItem.id === 'cand-extract-001'
      );

      expect(profileAfterExtraction).toBeDefined();
      expect(profileAfterExtraction?.fullName).toBe('Lê Hoàng Nam'); // Giữ nguyên họ tên cũ
      expect(profileAfterExtraction?.email).toBe('nam.le.ai@gmail.com'); // Giữ nguyên email cũ
      expect(profileAfterExtraction?.phone).toBe('0933221100'); // Giữ nguyên số điện thoại cũ
    });

    it('giao diện đối chiếu hiển thị nhãn "Không tự động ghi đè" để thông báo minh bạch cho Recruiter', () => {
      const pendingProfile: CandidateProfile = {
        ...initialCandidateProfile,
        cvParsingStatus: 'PENDING_CONFIRMATION',
        cvSuggestedInfo: {
          fullName: 'Lê Hoàng Nam (Từ PDF)',
          email: 'nam.pdf@gmail.com',
          phone: '0988776655',
        },
      };

      const renderedHtml = renderToString(
        React.createElement(CvSuggestionConfirmBox, {
          candidateProfile: pendingProfile,
          onApplySuggestion: vi.fn(),
          onDismissSuggestion: vi.fn(),
        })
      );

      expect(renderedHtml).toContain('Không tự động ghi đè');
      expect(renderedHtml).toContain('Dữ liệu gốc được bảo vệ an toàn');
    });

    it('chỉ khi Recruiter chủ động bấm "Xác nhận áp dụng", dữ liệu mới được ghi đè vào hồ sơ ứng viên', async () => {
      mockLocalStorage.setItem(
        'smart_recruit_candidate_profiles',
        JSON.stringify([initialCandidateProfile])
      );

      const confirmedData: CvSuggestedCandidateInfo = {
        fullName: 'Lê Hoàng Nam (Chính thức)',
        email: 'nam.le.official@gmail.com',
        phone: '0988112233',
        confidenceScore: 0.98,
      };

      vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
        data: {
          ...initialCandidateProfile,
          ...confirmedData,
          cvParsingStatus: 'CONFIRMED',
        },
      });

      const updatedProfile = await candidateService.applyConfirmedCandidateInfo(
        'cand-extract-001',
        confirmedData
      );

      // Dữ liệu chỉ được cập nhật sau khi Recruiter xác nhận áp dụng
      expect(updatedProfile.fullName).toBe('Lê Hoàng Nam (Chính thức)');
      expect(updatedProfile.email).toBe('nam.le.official@gmail.com');
      expect(updatedProfile.phone).toBe('0988112233');
      expect(updatedProfile.cvParsingStatus).toBe('CONFIRMED');
    });

    it('khi Recruiter bấm "Bỏ qua", trạng thái chuyển sang DISMISSED và dữ liệu hồ sơ gốc giữ nguyên', async () => {
      mockLocalStorage.setItem(
        'smart_recruit_candidate_profiles',
        JSON.stringify([initialCandidateProfile])
      );

      const dismissedProfile = await candidateService.dismissCvSuggestion(
        'cand-extract-001'
      );

      expect(dismissedProfile.cvParsingStatus).toBe('DISMISSED');
      expect(dismissedProfile.fullName).toBe('Lê Hoàng Nam');
      expect(dismissedProfile.email).toBe('nam.le.ai@gmail.com');
      expect(dismissedProfile.phone).toBe('0933221100');
    });
  });

  describe('3. Tách lỗi đọc CV khỏi luồng hồ sơ (Isolated Error Handling)', () => {
    it('khi việc bóc tách CV bị lỗi (HTTP 500 hoặc file scan), hồ sơ vẫn load bình thường không bị crash', async () => {
      const mockApiError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: {
            message: 'Tệp CV không thể đọc văn bản do định dạng scan hình ảnh.',
          },
        },
      };

      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(mockApiError);

      // Thử gọi fetchCvParsedSuggestion khi file lỗi
      const failedCandidate = {
        ...initialCandidateProfile,
        id: 'cand-failed-999',
        cvParsingStatus: 'FAILED' as const,
        cvParsingErrorMessage: 'Tệp CV không thể đọc văn bản do định dạng scan hình ảnh.',
      };

      mockLocalStorage.setItem(
        'smart_recruit_candidate_profiles',
        JSON.stringify([failedCandidate])
      );

      await expect(
        candidateService.fetchCvParsedSuggestion('cand-failed-999')
      ).rejects.toThrow('Tệp CV không thể đọc văn bản');

      // Tại sao: Xác nhận rằng mặc dù bóc tách CV bị lỗi, thông tin hồ sơ ứng viên vẫn lấy được đầy đủ
      const foundProfile = await candidateService.getCandidateProfileById(
        'cand-failed-999'
      );
      expect(foundProfile).toBeDefined();
      expect(foundProfile?.fullName).toBe('Lê Hoàng Nam');
      expect(foundProfile?.email).toBe('nam.le.ai@gmail.com');
      expect(foundProfile?.appliedJobTitle).toBe('AI & Machine Learning Specialist');
    });

    it('CandidateDetailModal xử lý lỗi đọc CV một cách tinh tế và không làm vỡ giao diện hồ sơ', () => {
      const failedCandidate: CandidateProfile = {
        ...initialCandidateProfile,
        cvParsingStatus: 'FAILED',
        cvParsingErrorMessage: 'Định dạng PDF không chứa văn bản trích xuất được.',
      };

      const renderedHtml = renderToString(
        React.createElement(CandidateDetailModal, {
          isOpen: true,
          candidateProfile: failedCandidate,
          onClose: vi.fn(),
        })
      );

      // Modal vẫn hiển thị đầy đủ thông tin ứng viên
      expect(renderedHtml).toContain('APP-2026-EXTRACT01');
      expect(renderedHtml).toContain('Lê Hoàng Nam');
      expect(renderedHtml).toContain('AI &amp; Machine Learning Specialist');

      // Khối thông báo lỗi đọc CV hiển thị nhẹ nhàng với role="alert"
      expect(renderedHtml).toContain('role="alert"');
      expect(renderedHtml).toContain('Chưa thể tự động đọc dữ liệu từ tệp CV');
      expect(renderedHtml).toContain('Định dạng PDF không chứa văn bản trích xuất được.');

      // Có nút thử đọc lại mà không chặn màn hình
      expect(renderedHtml).toContain('Thử đọc lại CV');
      expect(renderedHtml).toContain('Trích xuất lại từ CV');
    });

    it('cho phép Recruiter thử đọc lại CV qua retryCvParsing khi gặp sự cố', async () => {
      const failedCandidate: CandidateProfile = {
        ...initialCandidateProfile,
        cvParsingStatus: 'FAILED',
        cvParsingErrorMessage: 'Lỗi gián đoạn đường truyền mạng khi đọc PDF.',
      };

      mockLocalStorage.setItem(
        'smart_recruit_candidate_profiles',
        JSON.stringify([failedCandidate])
      );

      const retriedProfile = await candidateService.retryCvParsing(
        'cand-extract-001'
      );

      expect(retriedProfile.cvParsingStatus).toBe('PENDING_CONFIRMATION');
      expect(retriedProfile.cvParsingErrorMessage).toBeUndefined();
      expect(retriedProfile.cvSuggestedInfo).toBeDefined();
    });
  });

  describe('4. Recruiter chỉnh sửa trực tiếp dữ liệu gợi ý trước khi áp dụng', () => {
    it('áp dụng thành công dữ liệu đã qua chỉnh sửa thủ công của Recruiter', async () => {
      mockLocalStorage.setItem(
        'smart_recruit_candidate_profiles',
        JSON.stringify([initialCandidateProfile])
      );

      // Recruiter nhận gợi ý nhưng tự tay sửa lại số điện thoại trước khi bấm "Xác nhận áp dụng"
      const manuallyEditedSuggestion: CvSuggestedCandidateInfo = {
        fullName: 'Lê Hoàng Nam (Đã hiệu chỉnh)',
        email: 'nam.le.edited@gmail.com',
        phone: '0977112233', // Recruiter đã sửa số điện thoại
        confidenceScore: 0.95,
      };

      const updatedProfile = await candidateService.applyConfirmedCandidateInfo(
        'cand-extract-001',
        manuallyEditedSuggestion
      );

      // Hồ sơ được cập nhật chính xác với dữ liệu mà Recruiter đã chỉnh sửa
      expect(updatedProfile.fullName).toBe('Lê Hoàng Nam (Đã hiệu chỉnh)');
      expect(updatedProfile.email).toBe('nam.le.edited@gmail.com');
      expect(updatedProfile.phone).toBe('0977112233');
      expect(updatedProfile.cvParsingStatus).toBe('CONFIRMED');
    });
  });
});
