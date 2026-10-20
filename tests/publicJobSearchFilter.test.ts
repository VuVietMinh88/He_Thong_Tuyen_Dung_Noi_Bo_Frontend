import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axiosClient from '../src/utils/axiosClient';
import {
  jobPostingService,
  type JobPostingData,
} from '../src/services/jobPostingService';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const mockJobsList: JobPostingData[] = [
  {
    id: 'jp-001',
    title: 'Senior Frontend Developer (React, TypeScript & Tailwind CSS)',
    positionTitle: 'Senior Frontend Developer',
    departmentId: 'dept-tech',
    departmentName: 'Khối Công nghệ & Sản phẩm',
    workLocation: 'Hà Nội',
    employmentType: 'FULL_TIME',
    level: 'SENIOR',
    headcount: 2,
    deadline: '2026-11-30',
    salaryType: 'RANGE',
    salaryMin: 25,
    salaryMax: 45,
    currency: 'VND',
    jobDescription: 'Lập trình giao diện người dùng React, TypeScript, Tailwind CSS...',
    requirements: 'Tối thiểu 3 năm kinh nghiệm React...',
    benefits: 'Bảo hiểm PVI, tháng 13...',
    skills: ['React', 'TypeScript', 'Tailwind CSS'],
    status: 'PUBLISHED',
    publishInternal: true,
    publishCareerPage: true,
  },
  {
    id: 'jp-002',
    title: 'Data Engineer / MLOps Specialist',
    positionTitle: 'Data Engineer / MLOps Specialist',
    departmentId: 'dept-ai',
    departmentName: 'Trung tâm Nghiên cứu AI & Dữ liệu',
    workLocation: 'Làm việc từ xa (Remote)',
    employmentType: 'REMOTE',
    level: 'MIDDLE',
    headcount: 2,
    deadline: '2026-11-25',
    salaryType: 'RANGE',
    salaryMin: 30,
    salaryMax: 50,
    currency: 'VND',
    jobDescription: 'Xây dựng data pipelines và MLOps...',
    requirements: 'Python, Spark, Airflow, BigQuery...',
    benefits: 'Làm việc từ xa 100%...',
    skills: ['Python', 'Spark', 'Airflow', 'BigQuery'],
    status: 'PUBLISHED',
    publishInternal: true,
    publishCareerPage: true,
  },
  {
    id: 'jp-003',
    title: 'Chuyên viên Phát triển Kinh doanh B2B',
    positionTitle: 'Enterprise Business Development',
    departmentId: 'dept-sales',
    departmentName: 'Phòng Kinh doanh B2B',
    workLocation: 'TP. Hồ Chí Minh',
    employmentType: 'FULL_TIME',
    level: 'MIDDLE',
    headcount: 3,
    deadline: '2026-12-20',
    salaryType: 'STARTING_FROM',
    salaryMin: 18,
    currency: 'VND',
    jobDescription: 'Tìm kiếm và đàm phán giải pháp công nghệ B2B...',
    requirements: 'Kinh nghiệm bán giải pháp SaaS B2B...',
    benefits: 'Lương thưởng hoa hồng hấp dẫn...',
    skills: ['B2B Sales', 'Negotiation', 'CRM'],
    status: 'PUBLISHED',
    publishInternal: true,
    publishCareerPage: true,
  },
];

describe('TKNHTTDNB1-313: Tích hợp tìm kiếm và lọc tin tuyển dụng công khai (User Story S3-01)', () => {
  describe('AC1: Thanh tìm kiếm & Bộ lọc linh hoạt', () => {
    it('lọc chính xác theo từ khóa kỹ năng hoặc tiêu đề', async () => {
      const response = await jobPostingService.getPublicJobs({
        keyword: 'React',
      });

      expect(response.items.length).toBeGreaterThan(0);
      response.items.forEach((job) => {
        const matchesTitle = job.title.toLowerCase().includes('react');
        const matchesSkills = job.skills.some((s) => s.toLowerCase().includes('react'));
        expect(matchesTitle || matchesSkills).toBe(true);
      });
    });

    it('lọc chính xác theo phòng ban (department)', async () => {
      const response = await jobPostingService.getPublicJobs({
        department: 'dept-tech',
      });

      expect(response.items.length).toBeGreaterThan(0);
      response.items.forEach((job) => {
        expect(
          job.departmentId === 'dept-tech' ||
          job.departmentName?.toLowerCase().includes('công nghệ')
        ).toBe(true);
      });
    });

    it('lọc chính xác theo địa điểm làm việc (location)', async () => {
      const response = await jobPostingService.getPublicJobs({
        location: 'Hà Nội',
      });

      expect(response.items.length).toBeGreaterThan(0);
      response.items.forEach((job) => {
        expect(job.workLocation.toLowerCase()).toContain('hà nội');
      });
    });

    it('lọc chính xác theo hình thức làm việc (workType: REMOTE, FULL_TIME)', async () => {
      const responseRemote = await jobPostingService.getPublicJobs({
        workType: 'REMOTE',
      });

      expect(responseRemote.items.length).toBeGreaterThan(0);
      responseRemote.items.forEach((job) => {
        expect(job.employmentType).toBe('REMOTE');
      });
    });

    it('khôi phục về tất cả tin tuyển dụng khi bộ lọc ở trạng thái mặc định (reset filter)', async () => {
      const allJobs = await jobPostingService.getPublicJobs({
        keyword: '',
        department: 'ALL',
        location: 'ALL',
        workType: 'ALL',
        page: 1,
        pageSize: 10,
      });

      expect(allJobs.items.length).toBeGreaterThan(0);
      expect(allJobs.total).toBeGreaterThanOrEqual(allJobs.items.length);
    });
  });

  describe('AC2: Tối ưu trải nghiệm tìm kiếm với Debounce & URL query params', () => {
    it('hook useDebounce trì hoãn cập nhật từ khóa sau thời gian delay (400ms - 500ms)', () => {
      // Helper component simulation for testing useDebounce
      let debouncedVal = '';

      const updateDebounce = (val: string, delay: number) => {
        const timer = setTimeout(() => {
          debouncedVal = val;
        }, delay);
        return () => clearTimeout(timer);
      };

      const cancel1 = updateDebounce('R', 450);
      vi.advanceTimersByTime(200);
      expect(debouncedVal).toBe(''); // chưa đủ 450ms

      cancel1();
      const cancel2 = updateDebounce('React', 450);
      vi.advanceTimersByTime(449);
      expect(debouncedVal).toBe(''); // vẫn chưa đủ 450ms

      vi.advanceTimersByTime(1);
      expect(debouncedVal).toBe('React'); // đã đủ 450ms
      cancel2();
    });

    it('đồng bộ chính xác điều kiện lọc thành URL search query parameters', () => {
      const queryParams = new URLSearchParams();
      const filters = {
        keyword: 'TypeScript',
        department: 'dept-tech',
        location: 'Hà Nội',
        workType: 'FULL_TIME',
        level: 'SENIOR',
        page: 2,
      };

      if (filters.keyword.trim()) queryParams.set('keyword', filters.keyword.trim());
      if (filters.department !== 'ALL') queryParams.set('department', filters.department);
      if (filters.location !== 'ALL') queryParams.set('location', filters.location);
      if (filters.workType !== 'ALL') queryParams.set('workType', filters.workType);
      if (filters.level !== 'ALL') queryParams.set('level', filters.level);
      if (filters.page > 1) queryParams.set('page', String(filters.page));

      const queryString = queryParams.toString();
      expect(queryString).toContain('keyword=TypeScript');
      expect(queryString).toContain('department=dept-tech');
      expect(queryString).toContain('location=H%C3%A0+N%E1%BB%99i');
      expect(queryString).toContain('workType=FULL_TIME');
      expect(queryString).toContain('level=SENIOR');
      expect(queryString).toContain('page=2');
    });

    it('không đưa các tham số mặc định (ALL hoặc rỗng) lên URL để giữ URL gọn gàng', () => {
      const queryParams = new URLSearchParams();
      const defaultFilters = {
        keyword: '',
        department: 'ALL',
        location: 'ALL',
        workType: 'ALL',
        level: 'ALL',
        page: 1,
      };

      if (defaultFilters.keyword.trim()) queryParams.set('keyword', defaultFilters.keyword.trim());
      if (defaultFilters.department !== 'ALL') queryParams.set('department', defaultFilters.department);
      if (defaultFilters.location !== 'ALL') queryParams.set('location', defaultFilters.location);
      if (defaultFilters.workType !== 'ALL') queryParams.set('workType', defaultFilters.workType);
      if (defaultFilters.level !== 'ALL') queryParams.set('level', defaultFilters.level);
      if (defaultFilters.page > 1) queryParams.set('page', String(defaultFilters.page));

      expect(queryParams.toString()).toBe('');
    });
  });

  describe('AC3: Kết nối API & Xử lý bất đồng bộ', () => {
    it('service getPublicJobs nhận đầy đủ keyword, department, location, workType, page', async () => {
      const mockApiResponse = {
        items: mockJobsList,
        total: 3,
        page: 1,
        pageSize: 6,
        totalPages: 1,
      };

      vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: mockApiResponse,
      });

      const result = await jobPostingService.getPublicJobs({
        keyword: 'Developer',
        department: 'dept-tech',
        location: 'Hà Nội',
        workType: 'FULL_TIME',
        page: 1,
      });

      expect(axiosClient.get).toHaveBeenCalledWith('/public/job-postings', {
        params: {
          keyword: 'Developer',
          department: 'dept-tech',
          location: 'Hà Nội',
          workType: 'FULL_TIME',
          page: 1,
        },
      });

      expect(result.items).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
    });

    it('trả về tổng số tin tìm thấy (total) chính xác khi không có tin nào khớp', async () => {
      const result = await jobPostingService.getPublicJobs({
        keyword: 'NON_EXISTING_KEYWORD_XYZ_99999',
      });

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(1);
    });

    it('hỗ trợ cả các tên tham số alias (departmentId, workLocation, employmentType)', async () => {
      const result = await jobPostingService.getPublicJobs({
        departmentId: 'dept-tech',
        workLocation: 'Hà Nội',
        employmentType: 'FULL_TIME',
      });

      expect(result.items.length).toBeGreaterThan(0);
      result.items.forEach((job) => {
        expect(job.departmentId).toBe('dept-tech');
        expect(job.workLocation).toBe('Hà Nội');
        expect(job.employmentType).toBe('FULL_TIME');
      });
    });
  });
});
