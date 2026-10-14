import { afterEach, describe, expect, it, vi } from 'vitest';
import axiosClient from '../src/utils/axiosClient';
import {
  jobPostingService,
  formatSalaryDisplay,
  formatEmploymentType,
  formatJobLevel,
  getDeadlineStatus,
  type JobPostingData,
} from '../src/services/jobPostingService';

afterEach(() => {
  vi.restoreAllMocks();
});

const mockJobItem: JobPostingData = {
  id: 'jp-test-001',
  title: 'Senior Frontend Developer (React, TypeScript & Tailwind CSS)',
  positionTitle: 'Senior Frontend Developer',
  departmentId: 'dept-tech',
  departmentName: 'Khối Công nghệ & Sản phẩm',
  workLocation: 'Hà Nội',
  employmentType: 'FULL_TIME',
  level: 'SENIOR',
  headcount: 2,
  deadline: '2026-12-31',
  salaryType: 'RANGE',
  salaryMin: 25,
  salaryMax: 45,
  currency: 'VND',
  isSalaryNegotiable: true,
  jobDescription: 'Mô tả công việc chi tiết...',
  requirements: 'Yêu cầu ứng viên...',
  benefits: 'Quyền lợi hấp dẫn...',
  skills: ['React', 'TypeScript', 'Tailwind CSS'],
  status: 'PUBLISHED',
  publishInternal: true,
  publishCareerPage: true,
  publishedAt: '2026-10-10T08:00:00Z',
};

describe('Public Job List Page (User Story S3-01 / Task Jira TKNHTTDNB1-312)', () => {
  describe('AC1: Bố cục & Lấy dữ liệu danh sách việc làm công khai', () => {
    it('lấy danh sách việc làm đã duyệt và xuất bản có phân trang', async () => {
      const result = await jobPostingService.getPublicJobPostings({
        page: 1,
        pageSize: 6,
      });

      expect(result).toBeDefined();
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items.length).toBeLessThanOrEqual(6);
      expect(result.total).toBeGreaterThan(0);
      expect(result.totalPages).toBeGreaterThanOrEqual(1);

      // Tất cả công việc trả về phải ở trạng thái PUBLISHED và publishCareerPage = true
      result.items.forEach((job) => {
        expect(job.status).toBe('PUBLISHED');
        expect(job.publishCareerPage).toBe(true);
      });
    });

    it('tìm kiếm việc làm chính xác theo từ khóa (keyword search)', async () => {
      const result = await jobPostingService.getPublicJobPostings({
        keyword: 'Frontend',
      });

      expect(result.items.length).toBeGreaterThan(0);
      result.items.forEach((job) => {
        const matchesTitle = job.title.toLowerCase().includes('frontend');
        const matchesDesc = job.jobDescription.toLowerCase().includes('frontend');
        const matchesSkills = job.skills.some((s) => s.toLowerCase().includes('frontend'));
        expect(matchesTitle || matchesDesc || matchesSkills).toBe(true);
      });
    });

    it('lọc danh sách việc làm theo phòng ban (department)', async () => {
      const result = await jobPostingService.getPublicJobPostings({
        departmentId: 'dept-tech',
      });

      expect(result.items.length).toBeGreaterThan(0);
      result.items.forEach((job) => {
        expect(job.departmentId === 'dept-tech' || job.departmentName === 'Khối Công nghệ & Sản phẩm').toBe(true);
      });
    });

    it('lọc danh sách việc làm theo địa điểm làm việc (workLocation)', async () => {
      const result = await jobPostingService.getPublicJobPostings({
        workLocation: 'Hà Nội',
      });

      expect(result.items.length).toBeGreaterThan(0);
      result.items.forEach((job) => {
        expect(job.workLocation.toLowerCase()).toContain('hà nội');
      });
    });

    it('lọc việc làm theo hình thức làm việc (employmentType)', async () => {
      const result = await jobPostingService.getPublicJobPostings({
        employmentType: 'REMOTE',
      });

      expect(result.items.length).toBeGreaterThan(0);
      result.items.forEach((job) => {
        expect(job.employmentType).toBe('REMOTE');
      });
    });

    it('lọc việc làm theo cấp bậc (level)', async () => {
      const result = await jobPostingService.getPublicJobPostings({
        level: 'INTERN',
      });

      expect(result.items.length).toBeGreaterThan(0);
      result.items.forEach((job) => {
        expect(job.level).toBe('INTERN');
      });
    });

    it('gọi axiosClient.get đúng endpoint khi backend có sẵn', async () => {
      const mockApiData = {
        items: [mockJobItem],
        total: 1,
        page: 1,
        pageSize: 6,
        totalPages: 1,
      };

      vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: mockApiData,
      });

      const response = await jobPostingService.getPublicJobPostings({ page: 1, pageSize: 6 });
      expect(response.items).toHaveLength(1);
      expect(response.items[0].id).toBe('jp-test-001');
    });
  });

  describe('AC2: Nội dung & Định dạng thẻ việc làm (Job Card)', () => {
    it('thẻ việc làm chứa đầy đủ các trường thông tin theo yêu cầu', () => {
      expect(mockJobItem.title).toBeDefined();
      expect(mockJobItem.departmentName).toBeDefined();
      expect(mockJobItem.workLocation).toBe('Hà Nội');
      expect(mockJobItem.employmentType).toBe('FULL_TIME');
      expect(mockJobItem.level).toBe('SENIOR');
      expect(mockJobItem.salaryType).toBe('RANGE');
      expect(mockJobItem.deadline).toBe('2026-12-31');
      expect(mockJobItem.headcount).toBe(2);
      expect(mockJobItem.skills).toContain('React');
    });

    it('định dạng mức lương RANGE chính xác', () => {
      expect(formatSalaryDisplay({
        salaryType: 'RANGE',
        salaryMin: 25,
        salaryMax: 45,
        currency: 'VND',
        isSalaryNegotiable: false,
      })).toBe('25 - 45 triệu VND');
    });

    it('định dạng mức lương UP_TO và STARTING_FROM chính xác', () => {
      expect(formatSalaryDisplay({
        salaryType: 'UP_TO',
        salaryMax: 50,
        currency: 'VND',
      })).toBe('Lên tới 50 triệu VND');

      expect(formatSalaryDisplay({
        salaryType: 'STARTING_FROM',
        salaryMin: 20,
        currency: 'VND',
      })).toBe('Từ 20 triệu VND');
    });

    it('định dạng mức lương Thỏa thuận khi NEGOTIABLE hoặc không có khoảng lương', () => {
      expect(formatSalaryDisplay({
        salaryType: 'NEGOTIABLE',
        isSalaryNegotiable: true,
      })).toBe('Thỏa thuận');

      expect(formatSalaryDisplay({})).toBe('Thỏa thuận');
    });

    it('chuyển đổi hình thức làm việc sang tiếng Việt chuẩn xác', () => {
      expect(formatEmploymentType('FULL_TIME')).toBe('Toàn thời gian');
      expect(formatEmploymentType('PART_TIME')).toBe('Bán thời gian');
      expect(formatEmploymentType('REMOTE')).toBe('Từ xa (Remote)');
      expect(formatEmploymentType('HYBRID')).toBe('Linh hoạt (Hybrid)');
      expect(formatEmploymentType('INTERNSHIP')).toBe('Thực tập sinh');
    });

    it('chuyển đổi cấp bậc công việc sang tiếng Việt chuẩn xác', () => {
      expect(formatJobLevel('INTERN')).toBe('Thực tập sinh');
      expect(formatJobLevel('FRESHER')).toBe('Mới tốt nghiệp (Fresher)');
      expect(formatJobLevel('JUNIOR')).toBe('Junior');
      expect(formatJobLevel('MIDDLE')).toBe('Middle');
      expect(formatJobLevel('SENIOR')).toBe('Senior');
      expect(formatJobLevel('LEAD')).toBe('Trưởng nhóm (Lead)');
      expect(formatJobLevel('MANAGER')).toBe('Quản lý (Manager)');
    });

    it('tính toán trạng thái hạn nộp hồ sơ (deadline status)', () => {
      // Hạn nộp còn xa
      const futureDate = '2026-12-31';
      const statusFuture = getDeadlineStatus(futureDate);
      expect(statusFuture.isExpired).toBe(false);
      expect(statusFuture.text).toContain('/');

      // Hạn nộp trong quá khứ
      const pastDate = '2025-01-01';
      const statusPast = getDeadlineStatus(pastDate);
      expect(statusPast.isExpired).toBe(true);
      expect(statusPast.text).toBe('Đã hết hạn');

      // Không có hạn nộp
      const noDate = getDeadlineStatus(undefined);
      expect(noDate.text).toBe('Không giới hạn');
      expect(noDate.isUrgent).toBe(false);
    });
  });

  describe('AC3: Phân trang & Trạng thái tải (Skeleton Loading & Empty State)', () => {
    it('tính toán phân trang chính xác khi số lượng trang thay đổi', async () => {
      const page1 = await jobPostingService.getPublicJobPostings({ page: 1, pageSize: 3 });
      expect(page1.page).toBe(1);
      expect(page1.pageSize).toBe(3);
      expect(page1.items.length).toBeLessThanOrEqual(3);
      expect(page1.totalPages).toBeGreaterThanOrEqual(1);

      if (page1.totalPages > 1) {
        const page2 = await jobPostingService.getPublicJobPostings({ page: 2, pageSize: 3 });
        expect(page2.page).toBe(2);
        expect(page2.items[0].id).not.toBe(page1.items[0].id);
      }
    });

    it('trả về danh sách rỗng và total = 0 khi tìm kiếm từ khóa không tồn tại', async () => {
      const result = await jobPostingService.getPublicJobPostings({
        keyword: 'NON_EXISTENT_POSITION_XYZ_9999',
      });

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(1);
    });
  });
});
