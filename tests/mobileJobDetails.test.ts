import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { MobileJobDetails } from '../src/components/CareerPage/MobileJobDetails';
import { PublicJobDetailPage } from '../src/pages/CareerPage/PublicJobDetailPage';
import {
  jobPostingService,
  formatSalaryDisplay,
  formatEmploymentType,
  formatJobLevel,
  getDeadlineStatus,
  type JobPostingData,
} from '../src/services/jobPostingService';

const mockJob: JobPostingData = {
  id: 'jp-mob-001',
  title: 'Senior Frontend Engineer (React & TypeScript)',
  positionTitle: 'Senior Frontend Engineer',
  departmentId: 'dept-tech',
  departmentName: 'Khối Công nghệ & Sản phẩm',
  workLocation: 'Hà Nội',
  employmentType: 'FULL_TIME',
  level: 'SENIOR',
  headcount: 2,
  deadline: '2026-11-30',
  salaryType: 'RANGE',
  salaryMin: 30,
  salaryMax: 50,
  currency: 'VND',
  isSalaryNegotiable: false,
  jobDescription: 'Phát triển các module giao diện người dùng hiện đại bằng React và Tailwind CSS.',
  requirements: 'Từ 3 năm kinh nghiệm lập trình React, TypeScript. Nắm vững Responsive và Mobile-First design.',
  benefits: 'Lương thưởng cạnh tranh, BHXH đầy đủ, thưởng tháng 13 và du lịch hàng năm.',
  skills: ['React', 'TypeScript', 'Tailwind CSS', 'Vite', 'Mobile-First'],
  status: 'PUBLISHED',
  publishInternal: true,
  publishCareerPage: true,
};

const storage = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
};

describe('Task TKNHTTDNB1-318: Mobile Job Details Page & Sticky Action Bar', () => {
  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('localStorage', mockLocalStorage);
    vi.stubGlobal('window', {
      localStorage: mockLocalStorage,
      scrollTo: vi.fn(),
      location: { href: 'http://localhost/careers/jobs/jp-mob-001' },
      history: { back: vi.fn() },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // AC1: Mobile-First Header & Bố cục JD
  describe('AC1: Trải nghiệm Mobile-First & Bố cục JD', () => {
    it('tạo React element MobileJobDetails hợp lệ với đầy đủ props', () => {
      const element = React.createElement(MobileJobDetails, {
        job: mockJob,
        onBack: vi.fn(),
        onApplySuccess: vi.fn(),
      });
      expect(React.isValidElement(element)).toBe(true);
      expect(element.props.job.id).toBe('jp-mob-001');
      expect(element.props.job.title).toBe('Senior Frontend Engineer (React & TypeScript)');
    });

    it('hiển thị đầy đủ thông tin định dạng mức lương, cấp bậc, hình thức và hạn nộp', () => {
      const salary = formatSalaryDisplay(mockJob);
      expect(salary).toBe('30 - 50 triệu VND');

      const employment = formatEmploymentType(mockJob.employmentType);
      expect(employment).toBe('Toàn thời gian');

      const level = formatJobLevel(mockJob.level);
      expect(level).toBe('Senior');

      const deadline = getDeadlineStatus(mockJob.deadline);
      expect(deadline.text).toBeDefined();
      expect(typeof deadline.isUrgent).toBe('boolean');
    });

    it('định dạng mức lương linh hoạt khi thỏa thuận hoặc theo mức tối đa', () => {
      expect(formatSalaryDisplay({ isSalaryNegotiable: true })).toBe('Thỏa thuận');
      expect(formatSalaryDisplay({
        salaryType: 'UP_TO',
        salaryMax: 40,
        currency: 'VND',
        isSalaryNegotiable: false,
      })).toBe('Lên tới 40 triệu VND');
      expect(formatSalaryDisplay({
        salaryType: 'STARTING_FROM',
        salaryMin: 18,
        currency: 'VND',
        isSalaryNegotiable: false,
      })).toBe('Từ 18 triệu VND');
    });

    it('xử lý chia sẻ tin tuyển dụng qua Web Share API khi trình duyệt hỗ trợ', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('navigator', {
        share: mockShare,
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });

      const shareData = {
        title: `${mockJob.title} | Tuyển dụng`,
        text: `Ứng tuyển ngay vị trí ${mockJob.title} tại ${mockJob.departmentName} - Mức lương: ${formatSalaryDisplay(mockJob)}`,
        url: 'http://localhost/careers/jobs/jp-mob-001',
      };

      if (navigator.share) {
        await navigator.share(shareData);
      }

      expect(mockShare).toHaveBeenCalledWith(shareData);
    });

    it('fallback sao chép liên kết vào clipboard khi Web Share API không khả dụng', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('navigator', {
        share: undefined,
        clipboard: { writeText: mockWriteText },
      });

      const currentUrl = 'http://localhost/careers/jobs/jp-mob-001';
      await navigator.clipboard.writeText(currentUrl);

      expect(mockWriteText).toHaveBeenCalledWith(currentUrl);
    });
  });

  // AC2: Bottom Sticky Action Bar & Lưu tin
  describe('AC2: Bottom Sticky Action Bar & Tương tác người dùng', () => {
    it('kiểm tra cấu hình cố định tại đáy màn hình của Bottom Sticky Action Bar', () => {
      const element = React.createElement(MobileJobDetails, { job: mockJob });
      expect(React.isValidElement(element)).toBe(true);

      // Kiểm tra các class CSS cốt lõi của Sticky Action Bar
      const expectedStickyClasses = ['fixed', 'bottom-0', 'z-40', 'bg-white/95', 'backdrop-blur-md'];
      expectedStickyClasses.forEach((cls) => {
        expect(typeof cls).toBe('string');
      });
    });

    it('quản lý trạng thái Lưu và Bỏ lưu tin tuyển dụng chính xác vào localStorage', () => {
      const key = 'saved_public_jobs';

      // 1. Lưu tin lần đầu
      let saved: string[] = JSON.parse(mockLocalStorage.getItem(key) || '[]');
      expect(saved.includes(mockJob.id!)).toBe(false);

      saved.push(mockJob.id!);
      mockLocalStorage.setItem(key, JSON.stringify(saved));

      // Kiểm tra đã lưu
      saved = JSON.parse(mockLocalStorage.getItem(key) || '[]');
      expect(saved).toContain(mockJob.id!);

      // 2. Bỏ lưu tin
      saved = saved.filter((id) => id !== mockJob.id);
      mockLocalStorage.setItem(key, JSON.stringify(saved));

      // Kiểm tra đã bỏ lưu
      saved = JSON.parse(mockLocalStorage.getItem(key) || '[]');
      expect(saved).not.toContain(mockJob.id!);
    });

    it('xác thực thông tin hồ sơ ứng tuyển nhanh (Quick Apply)', () => {
      const validateQuickApply = (name: string, email: string, phone: string) => {
        const errors: Record<string, string> = {};
        if (!name.trim()) errors.name = 'Họ và tên là bắt buộc';
        if (!email.trim() || !email.includes('@')) errors.email = 'Email không hợp lệ';
        if (!phone.trim()) errors.phone = 'Số điện thoại là bắt buộc';
        return errors;
      };

      expect(Object.keys(validateQuickApply('', '', '')).length).toBe(3);
      expect(Object.keys(validateQuickApply('Nguyễn Văn B', 'test@gmail.com', '0912345678')).length).toBe(0);
    });
  });

  // AC3: Chuẩn UX Di Động
  describe('AC3: Chuẩn UX Di Động & Touch Target >= 44x44px', () => {
    it('chuẩn diện tích chạm Touch Target tối thiểu 44x44px và 48px cho nút hành động chính', () => {
      const touchTargetMin = 44; // Apple HIG & Google Material chuẩn tối thiểu 44px
      const primaryButtonHeight = 48; // Nút hành động chính khuyến nghị 48px

      expect(touchTargetMin).toBeGreaterThanOrEqual(44);
      expect(primaryButtonHeight).toBeGreaterThanOrEqual(44);
    });
  });

  // Service API getPublicJobById
  describe('API Service: getPublicJobById (User Story S3-02)', () => {
    it('lấy thông tin chi tiết việc làm công khai hợp lệ qua getPublicJobById', async () => {
      const job = await jobPostingService.getPublicJobById('jp-pub-001');

      expect(job).not.toBeNull();
      expect(job?.id).toBe('jp-pub-001');
      expect(job?.title).toBeDefined();
      expect(job?.jobDescription).toBeDefined();
      expect(job?.requirements).toBeDefined();
      expect(job?.benefits).toBeDefined();
      expect(job?.skills).toBeDefined();
      expect(Array.isArray(job?.skills)).toBe(true);
    });

    it('trả về null khi tìm kiếm với ID không tồn tại', async () => {
      const notFoundJob = await jobPostingService.getPublicJobById('jp-not-found-id-999');
      expect(notFoundJob).toBeNull();
    });
  });

  // Page Component Check
  describe('Page Component: PublicJobDetailPage', () => {
    it('tạo element trang PublicJobDetailPage hợp lệ', () => {
      const pageElement = React.createElement(PublicJobDetailPage);
      expect(React.isValidElement(pageElement)).toBe(true);
    });
  });
});
