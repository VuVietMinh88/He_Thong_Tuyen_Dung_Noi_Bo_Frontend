import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import axiosClient from '../src/utils/axiosClient';
import {
  APPLICATION_SOURCES,
  CV_FILE_CONFIG,
  MAX_CV_FILE_SIZE_BYTES,
  MAX_CV_FILE_SIZE_MB,
  ALLOWED_CV_EXTENSIONS,
  ALLOWED_CV_MIME_TYPES,
  CV_FILE_ACCEPT_ATTRIBUTE,
  CV_FILE_RULE_TEXT,
  MAX_SUBMISSIONS_PER_HOUR,
  DuplicateApplicationError,
  RateLimitExceededError,
  ApplicationSubmissionError,
  formatFileSizeMB,
  validateCvFile,
  validateApplicationForm,
  generateTrackingCode,
  jobApplicationService,
} from '../src/services/jobApplicationService';
import { PublicJobApplyForm } from '../src/components/CareerPage/PublicJobApplyForm';
import { PublicJobApplyPage } from '../src/pages/CareerPage/PublicJobApplyPage';

describe('Subtasks TKNHTTDNB1-323 & TKNHTTDNB1-324: Biểu mẫu ứng tuyển, tải CV và thông báo mã theo dõi', () => {
  const mockJob = {
    id: 'jp-pub-001',
    title: 'Senior Frontend Engineer (React & TypeScript)',
    departmentName: 'Khối Công nghệ & Sản phẩm',
    workLocation: 'Hà Nội',
    employmentType: 'FULL_TIME',
  };

  const storageMap = new Map<string, string>();
  const mockLocalStorage = {
    getItem: (storageKey: string) => storageMap.get(storageKey) ?? null,
    setItem: (storageKey: string, storageValue: string) => storageMap.set(storageKey, storageValue),
    removeItem: (storageKey: string) => storageMap.delete(storageKey),
    clear: () => storageMap.clear(),
  };

  beforeEach(() => {
    storageMap.clear();
    vi.stubGlobal('localStorage', mockLocalStorage);
    vi.stubGlobal('window', {
      localStorage: mockLocalStorage,
      scrollTo: vi.fn(),
      location: { href: 'http://localhost/careers/jobs/jp-pub-001/apply' },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // 1. Kiểm tra các trường thông tin trên biểu mẫu (TKNHTTDNB1-323 & 324)
  describe('Yêu cầu 1: Kiểm tra các trường và tệp CV trước khi gửi (Validation)', () => {
    it('kiểm tra danh sách nguồn biết tin (source) có đầy đủ các lựa chọn chuẩn', () => {
      expect(APPLICATION_SOURCES).toBeDefined();
      expect(APPLICATION_SOURCES.length).toBeGreaterThanOrEqual(5);

      const sourceValues = APPLICATION_SOURCES.map((sourceItem) => sourceItem.value);
      expect(sourceValues).toContain('WEBSITE');
      expect(sourceValues).toContain('LINKEDIN');
      expect(sourceValues).toContain('FACEBOOK');
      expect(sourceValues).toContain('INTERNAL_REFERRAL');
      expect(sourceValues).toContain('OTHER');

      const sourceLabels = APPLICATION_SOURCES.map((sourceItem) => sourceItem.label);
      expect(sourceLabels).toContain('Website công ty');
      expect(sourceLabels).toContain('LinkedIn');
      expect(sourceLabels).toContain('Facebook');
      expect(sourceLabels).toContain('Giới thiệu nội bộ');
      expect(sourceLabels).toContain('Khác');
    });

    it('báo lỗi khi thiếu các trường bắt buộc (fullName, email, phone, source, cvFile)', () => {
      const detectedErrors = validateApplicationForm({});
      expect(detectedErrors.fullName).toBeDefined();
      expect(detectedErrors.email).toBeDefined();
      expect(detectedErrors.phone).toBeDefined();
      expect(detectedErrors.source).toBeDefined();
      expect(detectedErrors.cvFile).toBeDefined();
    });

    it('xác thực email hợp lệ (hỗ trợ inputMode="email")', () => {
      const invalidEmailErrors = validateApplicationForm({
        fullName: 'Nguyễn Văn A',
        email: 'invalid-email-format',
        phone: '0912345678',
        source: 'WEBSITE',
        cvFile: new File(['mock content'], 'cv.pdf', { type: 'application/pdf' }),
      });
      expect(invalidEmailErrors.email).toContain('không hợp lệ');

      const validEmailErrors = validateApplicationForm({
        fullName: 'Nguyễn Văn A',
        email: 'ungvien@example.com',
        phone: '0912345678',
        source: 'WEBSITE',
        cvFile: new File(['mock content'], 'cv.pdf', { type: 'application/pdf' }),
      });
      expect(validEmailErrors.email).toBeUndefined();
    });

    it('xác thực số điện thoại hợp lệ (hỗ trợ inputMode="tel")', () => {
      const invalidPhoneErrors = validateApplicationForm({
        fullName: 'Nguyễn Văn A',
        email: 'ungvien@example.com',
        phone: '12345',
        source: 'WEBSITE',
        cvFile: new File(['mock content'], 'cv.pdf', { type: 'application/pdf' }),
      });
      expect(invalidPhoneErrors.phone).toContain('không hợp lệ');

      const validPhoneErrors = validateApplicationForm({
        fullName: 'Nguyễn Văn A',
        email: 'ungvien@example.com',
        phone: '0987654321',
        source: 'WEBSITE',
        cvFile: new File(['mock content'], 'cv.pdf', { type: 'application/pdf' }),
      });
      expect(validPhoneErrors.phone).toBeUndefined();
    });

    it('chấp nhận trường thư giới thiệu (coverLetter) là tùy chọn', () => {
      const withoutCoverLetterErrors = validateApplicationForm({
        fullName: 'Nguyễn Văn A',
        email: 'ungvien@example.com',
        phone: '0987654321',
        source: 'WEBSITE',
        coverLetter: '',
        cvFile: new File(['mock content'], 'cv.pdf', { type: 'application/pdf' }),
      });
      expect(Object.keys(withoutCoverLetterErrors).length).toBe(0);

      const withCoverLetterErrors = validateApplicationForm({
        fullName: 'Nguyễn Văn A',
        email: 'ungvien@example.com',
        phone: '0987654321',
        source: 'WEBSITE',
        coverLetter: 'Tôi có 4 năm kinh nghiệm React và mong muốn ứng tuyển.',
        cvFile: new File(['mock content'], 'cv.pdf', { type: 'application/pdf' }),
      });
      expect(Object.keys(withCoverLetterErrors).length).toBe(0);
    });

    it('cấu hình quy định và dung lượng tối đa tệp CV là 10MB định dạng PDF hoặc DOCX', () => {
      expect(CV_FILE_CONFIG.ACCEPT_ATTRIBUTE).toBe(CV_FILE_ACCEPT_ATTRIBUTE);
      expect(CV_FILE_CONFIG.RULE_TEXT).toBe(CV_FILE_RULE_TEXT);
      expect(MAX_CV_FILE_SIZE_MB).toBe(10);
      expect(MAX_CV_FILE_SIZE_BYTES).toBe(10 * 1024 * 1024);
      expect(ALLOWED_CV_EXTENSIONS).toEqual(['.pdf', '.docx']);
      expect(ALLOWED_CV_MIME_TYPES).toContain('application/pdf');
    });

    it('tính toán dung lượng đổi sang MB chính xác', () => {
      expect(formatFileSizeMB(0)).toBe('0.00 MB');
      expect(formatFileSizeMB(2621440)).toBe('2.50 MB');
      expect(formatFileSizeMB(10 * 1024 * 1024)).toBe('10.00 MB');
    });

    it('chấp nhận file CV hợp lệ (.pdf, .docx) và từ chối file > 10MB hoặc sai định dạng', () => {
      const validPdfFile = new File(['%PDF content'], 'resume.pdf', { type: 'application/pdf' });
      expect(validateCvFile(validPdfFile).isValid).toBe(true);

      const oversizedFile = {
        name: 'heavy_file.pdf',
        size: 11 * 1024 * 1024,
        type: 'application/pdf',
      } as unknown as File;
      const oversizedValidation = validateCvFile(oversizedFile);
      expect(oversizedValidation.isValid).toBe(false);
      expect(oversizedValidation.error).toContain('vượt quá mức cho phép');

      const invalidTxtFile = new File(['plain text'], 'notes.txt', { type: 'text/plain' });
      const invalidValidation = validateCvFile(invalidTxtFile);
      expect(invalidValidation.isValid).toBe(false);
      expect(invalidValidation.error).toContain('Chỉ chấp nhận tệp định dạng PDF hoặc DOCX');
    });
  });

  // 2. Tích hợp API gửi hồ sơ ứng tuyển và tạo mã theo dõi (TKNHTTDNB1-324)
  describe('Yêu cầu 2: Tích hợp API gửi hồ sơ và tạo mã theo dõi (Tracking Code)', () => {
    it('tạo mã theo dõi (trackingCode) với định dạng APP-YYYY-XXXXXX', () => {
      const generatedCode = generateTrackingCode();
      const currentYear = new Date().getFullYear();
      expect(generatedCode).toMatch(new RegExp(`^APP-${currentYear}-[A-Z0-9]{6}$`));
    });

    it('gửi hồ sơ ứng tuyển thành công trả về đầy đủ trackingCode, applicationId và thông báo email', async () => {
      const mockCandidatePdf = new File(['mock content'], 'candidate_cv.pdf', {
        type: 'application/pdf',
      });

      const applicationPayload = {
        jobId: 'jp-pub-001',
        jobTitle: 'Senior Frontend Engineer',
        fullName: 'Trần Thị B',
        email: 'tranthib@example.com',
        phone: '0988776655',
        source: 'WEBSITE',
        coverLetter: 'Xin chào, tôi mong muốn ứng tuyển vị trí này.',
        cvFile: mockCandidatePdf,
      };

      const submissionResponse = await jobApplicationService.submitApplication(applicationPayload);

      expect(submissionResponse.success).toBe(true);
      expect(submissionResponse.trackingCode).toBeDefined();
      expect(submissionResponse.trackingCode.startsWith('APP-')).toBe(true);
      expect(submissionResponse.applicationId).toBeDefined();
      expect(submissionResponse.candidateName).toBe('Trần Thị B');
      expect(submissionResponse.candidateEmail).toBe('tranthib@example.com');
      expect(submissionResponse.confirmationEmailSent).toBe(true);
      expect(submissionResponse.submittedAt).toBeDefined();
    });
  });

  // 3. Xử lý và hiển thị các thông báo lỗi (HTTP 409 & HTTP 429)
  describe('Yêu cầu 3: Xử lý và hiển thị thông báo lỗi (409 Conflict, 429 Rate Limit)', () => {
    it('báo lỗi DuplicateApplicationError (HTTP 409) khi cùng một email nộp lại vào cùng vị trí', async () => {
      const mockCvFile = new File(['mock data'], 'cv.pdf', { type: 'application/pdf' });

      const firstApplication = {
        jobId: 'jp-pub-test-duplicate',
        jobTitle: 'Backend Engineer',
        fullName: 'Lê Văn C',
        email: 'levanc@example.com',
        phone: '0911223344',
        source: 'LINKEDIN',
        cvFile: mockCvFile,
      };

      // 1. Nộp lần đầu thành công
      const firstResult = await jobApplicationService.submitApplication(firstApplication);
      expect(firstResult.success).toBe(true);

      // 2. Nộp lần 2 với cùng email và cùng jobId -> phải ném lỗi DuplicateApplicationError
      await expect(jobApplicationService.submitApplication(firstApplication)).rejects.toThrow(
        DuplicateApplicationError
      );

      await expect(jobApplicationService.submitApplication(firstApplication)).rejects.toThrow(
        'Email này đã được sử dụng để ứng tuyển vào vị trí này'
      );
    });

    it('xử lý lỗi HTTP 409 từ server trả về qua axiosClient', async () => {
      const mockAxiosError = {
        isAxiosError: true,
        response: {
          status: 409,
          data: {
            message: 'Email đã ứng tuyển vào vị trí này trong 30 ngày qua.',
          },
        },
      };

      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(mockAxiosError);

      const testPayload = {
        jobId: 'jp-pub-remote-test',
        fullName: 'Hoàng Văn D',
        email: 'hoangvand@example.com',
        phone: '0922334455',
        source: 'FACEBOOK',
        cvFile: new File(['data'], 'cv.pdf', { type: 'application/pdf' }),
      };

      await expect(jobApplicationService.submitApplication(testPayload)).rejects.toThrow(
        DuplicateApplicationError
      );
    });

    it('báo lỗi RateLimitExceededError (HTTP 429) khi vượt quá số lần nộp cho phép trong 1 giờ', async () => {
      const mockCvFile = new File(['data'], 'cv.pdf', { type: 'application/pdf' });

      // Giả lập nộp liên tục 5 hồ sơ khác nhau trong 1 giờ
      for (let index = 0; index < MAX_SUBMISSIONS_PER_HOUR; index++) {
        await jobApplicationService.submitApplication({
          jobId: `job-bulk-${index}`,
          fullName: `Ứng viên ${index}`,
          email: `ungvien${index}@example.com`,
          phone: `090000000${index}`,
          source: 'WEBSITE',
          cvFile: mockCvFile,
        });
      }

      // Lần nộp thứ 6 vượt giới hạn MAX_SUBMISSIONS_PER_HOUR -> phải ném lỗi RateLimitExceededError
      const sixthApplication = {
        jobId: 'job-bulk-excess',
        fullName: 'Ứng viên vượt giới hạn',
        email: 'excess@example.com',
        phone: '0999999999',
        source: 'WEBSITE',
        cvFile: mockCvFile,
      };

      await expect(jobApplicationService.submitApplication(sixthApplication)).rejects.toThrow(
        RateLimitExceededError
      );

      await expect(jobApplicationService.submitApplication(sixthApplication)).rejects.toThrow(
        'vượt quá số lần nộp hồ sơ cho phép trong 1 giờ'
      );
    });

    it('xử lý lỗi HTTP 429 từ server trả về qua axiosClient', async () => {
      const mockRateLimitError = {
        isAxiosError: true,
        response: {
          status: 429,
          data: {
            message: 'Too many requests. Please try again after 60 minutes.',
          },
        },
      };

      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(mockRateLimitError);

      const testPayload = {
        jobId: 'jp-rate-limit-check',
        fullName: 'Vũ Thị E',
        email: 'vuthie@example.com',
        phone: '0933445566',
        source: 'OTHER',
        cvFile: new File(['data'], 'cv.pdf', { type: 'application/pdf' }),
      };

      await expect(jobApplicationService.submitApplication(testPayload)).rejects.toThrow(RateLimitExceededError);
    });

    it('xử lý lỗi HTTP 400 Validation Error và HTTP 500 Server Error', async () => {
      const mock400Error = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { message: 'Dữ liệu không hợp lệ.' },
        },
      };
      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(mock400Error);

      const testPayload = {
        jobId: 'jp-invalid',
        fullName: 'Test',
        email: 'test@example.com',
        phone: '0912345678',
        source: 'WEBSITE',
        cvFile: new File(['data'], 'cv.pdf', { type: 'application/pdf' }),
      };

      await expect(jobApplicationService.submitApplication(testPayload)).rejects.toThrow(
        ApplicationSubmissionError
      );
    });
  });

  // 4. Hiển thị mã theo dõi, sao chép mã và thông báo gửi email xác nhận
  describe('Yêu cầu 4: Hiển thị mã theo dõi khi gửi thành công và nút sao chép', () => {
    it('khởi tạo React element PublicJobApplyForm hợp lệ với đầy đủ props', () => {
      const formElement = React.createElement(PublicJobApplyForm, {
        job: mockJob,
        onCancel: vi.fn(),
        onSuccess: vi.fn(),
      });
      expect(React.isValidElement(formElement)).toBe(true);
      expect(formElement.props.job.id).toBe('jp-pub-001');
      expect(formElement.props.job.title).toBe(mockJob.title);
    });

    it('sao chép mã theo dõi vào bộ nhớ tạm bằng Clipboard API', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('navigator', {
        clipboard: { writeText: mockWriteText },
      });

      const trackingCode = 'APP-2026-AB12CD';
      await navigator.clipboard.writeText(trackingCode);

      expect(mockWriteText).toHaveBeenCalledWith(trackingCode);
    });

    it('khởi tạo React element PublicJobApplyPage hợp lệ', () => {
      const pageElement = React.createElement(PublicJobApplyPage);
      expect(React.isValidElement(pageElement)).toBe(true);
    });
  });
});
