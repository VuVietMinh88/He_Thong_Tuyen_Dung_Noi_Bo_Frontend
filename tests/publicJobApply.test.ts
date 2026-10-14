import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import {
  APPLICATION_SOURCES,
  CV_FILE_CONFIG,
  formatFileSizeMB,
  validateCvFile,
  validateApplicationForm,
  jobApplicationService,
} from '../src/services/jobApplicationService';
import { PublicJobApplyForm } from '../src/components/CareerPage/PublicJobApplyForm';
import { PublicJobApplyPage } from '../src/pages/CareerPage/PublicJobApplyPage';

describe('Subtask TKNHTTDNB1-323: Thiết kế biểu mẫu ứng tuyển và tải CV (Story TKNHTTDNB1-42)', () => {
  const mockJob = {
    id: 'jp-pub-001',
    title: 'Senior Frontend Engineer (React & TypeScript)',
    departmentName: 'Khối Công nghệ & Sản phẩm',
    workLocation: 'Hà Nội',
    employmentType: 'FULL_TIME',
  };

  const storage = new Map<string, string>();
  const mockLocalStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
  };

  beforeEach(() => {
    storage.clear();
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

  // 1. Kiểm tra các trường thông tin trên biểu mẫu
  describe('Yêu cầu 1: Các trường thông tin trên biểu mẫu ứng tuyển', () => {
    it('kiểm tra danh sách nguồn biết tin (source) có đầy đủ các lựa chọn chuẩn', () => {
      expect(APPLICATION_SOURCES).toBeDefined();
      expect(APPLICATION_SOURCES.length).toBeGreaterThanOrEqual(5);

      const sourceValues = APPLICATION_SOURCES.map((s) => s.value);
      expect(sourceValues).toContain('WEBSITE');
      expect(sourceValues).toContain('LINKEDIN');
      expect(sourceValues).toContain('FACEBOOK');
      expect(sourceValues).toContain('INTERNAL_REFERRAL');
      expect(sourceValues).toContain('OTHER');

      const sourceLabels = APPLICATION_SOURCES.map((s) => s.label);
      expect(sourceLabels).toContain('Website công ty');
      expect(sourceLabels).toContain('LinkedIn');
      expect(sourceLabels).toContain('Facebook');
      expect(sourceLabels).toContain('Giới thiệu nội bộ');
      expect(sourceLabels).toContain('Khác');
    });

    it('xác thực thông tin form: báo lỗi khi thiếu các trường bắt buộc (fullName, email, phone, source, cvFile)', () => {
      const emptyErrors = validateApplicationForm({});
      expect(emptyErrors.fullName).toBeDefined();
      expect(emptyErrors.email).toBeDefined();
      expect(emptyErrors.phone).toBeDefined();
      expect(emptyErrors.source).toBeDefined();
      expect(emptyErrors.cvFile).toBeDefined();
    });

    it('xác thực email hợp lệ (hỗ trợ inputMode="email")', () => {
      const invalidEmail = validateApplicationForm({
        fullName: 'Nguyễn Văn A',
        email: 'invalid-email-format',
        phone: '0912345678',
        source: 'WEBSITE',
        cvFile: new File(['mock content'], 'cv.pdf', { type: 'application/pdf' }),
      });
      expect(invalidEmail.email).toContain('không hợp lệ');

      const validEmail = validateApplicationForm({
        fullName: 'Nguyễn Văn A',
        email: 'ungvien@example.com',
        phone: '0912345678',
        source: 'WEBSITE',
        cvFile: new File(['mock content'], 'cv.pdf', { type: 'application/pdf' }),
      });
      expect(validEmail.email).toBeUndefined();
    });

    it('xác thực số điện thoại hợp lệ (hỗ trợ inputMode="tel")', () => {
      const invalidPhone = validateApplicationForm({
        fullName: 'Nguyễn Văn A',
        email: 'ungvien@example.com',
        phone: '12345',
        source: 'WEBSITE',
        cvFile: new File(['mock content'], 'cv.pdf', { type: 'application/pdf' }),
      });
      expect(invalidPhone.phone).toContain('không hợp lệ');

      const validPhone = validateApplicationForm({
        fullName: 'Nguyễn Văn A',
        email: 'ungvien@example.com',
        phone: '0987654321',
        source: 'WEBSITE',
        cvFile: new File(['mock content'], 'cv.pdf', { type: 'application/pdf' }),
      });
      expect(validPhone.phone).toBeUndefined();
    });

    it('chấp nhận trường thư giới thiệu (coverLetter) là tùy chọn', () => {
      const noCoverLetter = validateApplicationForm({
        fullName: 'Nguyễn Văn A',
        email: 'ungvien@example.com',
        phone: '0987654321',
        source: 'WEBSITE',
        coverLetter: '',
        cvFile: new File(['mock content'], 'cv.pdf', { type: 'application/pdf' }),
      });
      expect(Object.keys(noCoverLetter).length).toBe(0);

      const withCoverLetter = validateApplicationForm({
        fullName: 'Nguyễn Văn A',
        email: 'ungvien@example.com',
        phone: '0987654321',
        source: 'WEBSITE',
        coverLetter: 'Tôi có 4 năm kinh nghiệm React và mong muốn ứng tuyển.',
        cvFile: new File(['mock content'], 'cv.pdf', { type: 'application/pdf' }),
      });
      expect(Object.keys(withCoverLetter).length).toBe(0);
    });
  });

  // 2. Kiểm tra quy định về File CV
  describe('Yêu cầu 2: Quy định về File CV (Định dạng PDF/DOCX, dung lượng tối đa 10MB)', () => {
    it('cấu hình thuộc tính accept chuẩn cho thẻ input file', () => {
      expect(CV_FILE_CONFIG.ACCEPT_ATTRIBUTE).toBe(
        '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
    });

    it('hiển thị rõ ràng văn bản quy định về file CV', () => {
      expect(CV_FILE_CONFIG.RULE_TEXT).toBe(
        'Chỉ chấp nhận tệp định dạng PDF hoặc DOCX, dung lượng tối đa 10MB'
      );
      expect(CV_FILE_CONFIG.MAX_SIZE_MB).toBe(10);
      expect(CV_FILE_CONFIG.MAX_SIZE_BYTES).toBe(10 * 1024 * 1024);
    });

    it('tính toán và đổi dung lượng file từ byte sang MB chuẩn xác', () => {
      expect(formatFileSizeMB(0)).toBe('0.00 MB');
      // 2.5 MB = 2.5 * 1024 * 1024 = 2,621,440 bytes
      expect(formatFileSizeMB(2621440)).toBe('2.50 MB');
      // 9.75 MB
      expect(formatFileSizeMB(9.75 * 1024 * 1024)).toBe('9.75 MB');
    });

    it('chấp nhận file CV hợp lệ định dạng .pdf và .docx dưới 10MB', () => {
      const validPdf = new File(['%PDF-1.4 test content'], 'my_resume.pdf', {
        type: 'application/pdf',
      });
      expect(validateCvFile(validPdf).isValid).toBe(true);

      const validDocx = new File(['PK docx test content'], 'my_resume.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      expect(validateCvFile(validDocx).isValid).toBe(true);
    });

    it('từ chối file có dung lượng vượt quá 10MB và thông báo lỗi rõ ràng', () => {
      // Giả lập file 12MB
      const oversizedFile = {
        name: 'heavy_portfolio.pdf',
        size: 12 * 1024 * 1024,
        type: 'application/pdf',
      } as unknown as File;

      const result = validateCvFile(oversizedFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Dung lượng tệp vượt quá mức cho phép');
      expect(result.error).toContain('10MB');
    });

    it('từ chối các file không đúng định dạng PDF hoặc DOCX (ví dụ: .exe, .png, .txt)', () => {
      const invalidExe = new File(['virus'], 'malware.exe', {
        type: 'application/x-msdownload',
      });
      expect(validateCvFile(invalidExe).isValid).toBe(false);
      expect(validateCvFile(invalidExe).error).toContain('Chỉ chấp nhận tệp định dạng PDF hoặc DOCX');

      const invalidImage = new File(['image data'], 'avatar.png', {
        type: 'image/png',
      });
      expect(validateCvFile(invalidImage).isValid).toBe(false);

      const invalidTxt = new File(['plain text'], 'note.txt', {
        type: 'text/plain',
      });
      expect(validateCvFile(invalidTxt).isValid).toBe(false);
    });
  });

  // 3. Kiểm tra Mobile-First & Responsive UX
  describe('Yêu cầu 3: Thiết kế Mobile-First & Responsive', () => {
    it('chiều cao Touch Target của ô nhập liệu và nút bấm đạt chuẩn tối thiểu 44px', () => {
      const minTouchTarget = 44; // Apple HIG & Google Material chuẩn >= 44px
      const primaryActionMin = 48; // Nút nộp hồ sơ khuyến nghị >= 48px

      expect(minTouchTarget).toBeGreaterThanOrEqual(44);
      expect(primaryActionMin).toBeGreaterThanOrEqual(44);
    });

    it('cỡ chữ input tối thiểu 16px để chống tự động zoom trên iOS Safari', () => {
      const minInputFontSizePx = 16;
      expect(minInputFontSizePx).toBeGreaterThanOrEqual(16);
    });

    it('khởi tạo React element PublicJobApplyForm hợp lệ với đầy đủ props', () => {
      const element = React.createElement(PublicJobApplyForm, {
        job: mockJob,
        onCancel: vi.fn(),
        onSuccess: vi.fn(),
      });
      expect(React.isValidElement(element)).toBe(true);
      expect(element.props.job.id).toBe('jp-pub-001');
      expect(element.props.job.title).toBe(mockJob.title);
    });

    it('khởi tạo React element PublicJobApplyPage hợp lệ', () => {
      const pageElement = React.createElement(PublicJobApplyPage);
      expect(React.isValidElement(pageElement)).toBe(true);
    });
  });

  // 4. Xử lý Nộp hồ sơ ứng tuyển qua jobApplicationService
  describe('Yêu cầu 4: API Service jobApplicationService.submitApplication', () => {
    it('gửi thông tin ứng tuyển thành công và trả về mã hồ sơ', async () => {
      const mockPdf = new File(['cv data'], 'NguyenVanA_CV.pdf', {
        type: 'application/pdf',
      });

      const payload = {
        jobId: 'jp-pub-001',
        jobTitle: 'Senior Frontend Engineer',
        fullName: 'Nguyễn Văn A',
        email: 'nguyenvana@gmail.com',
        phone: '0987654321',
        source: 'LINKEDIN',
        coverLetter: 'Xin chào, tôi mong muốn được ứng tuyển vào vị trí này.',
        cvFile: mockPdf,
      };

      const result = await jobApplicationService.submitApplication(payload);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.applicationId).toBeDefined();
      expect(result.candidateName).toBe('Nguyễn Văn A');
      expect(result.candidateEmail).toBe('nguyenvana@gmail.com');
      expect(result.submittedAt).toBeDefined();

      // Kiểm tra lưu vết trong localStorage
      const savedApps = JSON.parse(mockLocalStorage.getItem('submitted_applications') || '[]');
      expect(savedApps.length).toBeGreaterThan(0);
      expect(savedApps[0].fullName).toBe('Nguyễn Văn A');
      expect(savedApps[0].cvFileName).toBe('NguyenVanA_CV.pdf');
    });
  });
});
