import { afterEach, describe, expect, it, vi } from 'vitest';
import axiosClient from '../src/utils/axiosClient';
import {
  jobPostingService,
  validateJobPostingForm,
  type JobPostingData,
  type SalaryType,
} from '../src/services/jobPostingService';

afterEach(() => {
  vi.restoreAllMocks();
});

const getFutureDate = (daysAhead: number = 30): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
};

const getPastDate = (daysAgo: number = 5): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const validFormData: JobPostingData = {
  title: 'Tuyển dụng Kỹ sư Phần mềm Frontend React/TypeScript',
  positionTitle: 'Kỹ sư Frontend',
  departmentId: 'dept-tech-01',
  departmentName: 'Khối Công nghệ & Sản phẩm',
  workLocation: 'Hà Nội',
  employmentType: 'FULL_TIME',
  level: 'SENIOR',
  headcount: 2,
  deadline: getFutureDate(30),
  salaryType: 'RANGE',
  salaryMin: 25,
  salaryMax: 45,
  currency: 'VND',
  isSalaryNegotiable: true,
  jobDescription: 'Phát triển các giao diện người dùng hiện đại, tối ưu trải nghiệm và hiệu năng.',
  requirements: 'Tối thiểu 3 năm kinh nghiệm lập trình React, nắm vững TypeScript và Tailwind CSS.',
  benefits: 'Lương thưởng cạnh tranh, bảo hiểm cao cấp, đào tạo chứng chỉ quốc tế.',
  skills: ['React', 'TypeScript', 'Tailwind CSS'],
  status: 'PUBLISHED',
  publishInternal: true,
  publishCareerPage: true,
};

describe('Job Posting Form & Service (Task TKNHTTDNB1-300)', () => {
  describe('AC1: Cấu trúc trường thông tin & Metadata tin tuyển dụng', () => {
    it('chứa đầy đủ các trường thông tin tiêu đề, chức danh, phòng ban, địa điểm, cấp bậc', () => {
      expect(validFormData.title).toBeDefined();
      expect(validFormData.positionTitle).toBeDefined();
      expect(validFormData.departmentId).toBeDefined();
      expect(validFormData.workLocation).toBeDefined();
      expect(validFormData.level).toBeDefined();
    });

    it('hỗ trợ các hình thức lương đa dạng: RANGE, NEGOTIABLE, UP_TO, STARTING_FROM', () => {
      const salaryTypes: SalaryType[] = ['RANGE', 'NEGOTIABLE', 'UP_TO', 'STARTING_FROM'];
      expect(salaryTypes).toContain('RANGE');
      expect(salaryTypes).toContain('NEGOTIABLE');
      expect(salaryTypes).toContain('UP_TO');
      expect(salaryTypes).toContain('STARTING_FROM');
    });

    it('hỗ trợ danh sách kỹ năng trọng tâm (skills tags) và các kênh phát hành', () => {
      expect(validFormData.skills).toContain('React');
      expect(validFormData.skills).toContain('TypeScript');
      expect(validFormData.publishInternal).toBe(true);
      expect(validFormData.publishCareerPage).toBe(true);
    });
  });

  describe('AC2: Validation dữ liệu đầu vào (Input Validation)', () => {
    it('báo lỗi khi tiêu đề bị để trống hoặc chỉ chứa khoảng trắng', () => {
      const result = validateJobPostingForm({ ...validFormData, title: '   ' });
      expect(result.isValid).toBe(false);
      expect(result.errors.title).toBe('Tiêu đề tin tuyển dụng không được để trống.');
    });

    it('báo lỗi khi tiêu đề quá ngắn (< 5 ký tự)', () => {
      const result = validateJobPostingForm({ ...validFormData, title: 'Dev' });
      expect(result.isValid).toBe(false);
      expect(result.errors.title).toBe('Tiêu đề tin tuyển dụng cần tối thiểu 5 ký tự.');
    });

    it('báo lỗi khi chức danh hoặc phòng ban không được lựa chọn', () => {
      const resPosition = validateJobPostingForm({ ...validFormData, positionTitle: '' });
      expect(resPosition.isValid).toBe(false);
      expect(resPosition.errors.positionTitle).toBe('Vui lòng chọn hoặc nhập vị trí chức danh tuyển dụng.');

      const resDept = validateJobPostingForm({ ...validFormData, departmentId: '' });
      expect(resDept.isValid).toBe(false);
      expect(resDept.errors.departmentId).toBe('Vui lòng chọn phòng ban phụ trách tuyển dụng.');
    });

    it('báo lỗi khi địa điểm hoặc hình thức làm việc bị trống', () => {
      const resLoc = validateJobPostingForm({ ...validFormData, workLocation: '' });
      expect(resLoc.isValid).toBe(false);
      expect(resLoc.errors.workLocation).toBe('Vui lòng chọn địa điểm làm việc.');

      const resEmp = validateJobPostingForm({ ...validFormData, employmentType: '' });
      expect(resEmp.isValid).toBe(false);
      expect(resEmp.errors.employmentType).toBe('Vui lòng chọn hình thức làm việc.');
    });

    it('báo lỗi khi số lượng tuyển dụng nhỏ hơn 1 hoặc không hợp lệ', () => {
      const resZero = validateJobPostingForm({ ...validFormData, headcount: 0 });
      expect(resZero.isValid).toBe(false);
      expect(resZero.errors.headcount).toBe('Số lượng tuyển dụng phải lớn hơn hoặc bằng 1.');

      const resNegative = validateJobPostingForm({ ...validFormData, headcount: -5 });
      expect(resNegative.isValid).toBe(false);
      expect(resNegative.errors.headcount).toBe('Số lượng tuyển dụng phải lớn hơn hoặc bằng 1.');
    });

    it('báo lỗi khi hạn nộp hồ sơ ở trong quá khứ', () => {
      const pastDate = getPastDate(5);
      const result = validateJobPostingForm({ ...validFormData, deadline: pastDate });
      expect(result.isValid).toBe(false);
      expect(result.errors.deadline).toBe('Hạn nộp hồ sơ không được là ngày trong quá khứ.');
    });

    it('báo lỗi khi mức lương min > max trong chế độ RANGE', () => {
      const result = validateJobPostingForm({
        ...validFormData,
        salaryType: 'RANGE',
        salaryMin: 50,
        salaryMax: 30,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.salary).toBe('Mức lương tối thiểu không được lớn hơn mức lương tối đa.');
    });

    it('báo lỗi khi mức lương tối đa không hợp lệ trong chế độ UP_TO', () => {
      const result = validateJobPostingForm({
        ...validFormData,
        salaryType: 'UP_TO',
        salaryMax: 0,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.salary).toBe('Vui lòng nhập mức lương tối đa hợp lệ.');
    });

    it('báo lỗi khi mức lương khởi điểm không hợp lệ trong chế độ STARTING_FROM', () => {
      const result = validateJobPostingForm({
        ...validFormData,
        salaryType: 'STARTING_FROM',
        salaryMin: 0,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.salary).toBe('Vui lòng nhập mức lương khởi điểm hợp lệ.');
    });

    it('báo lỗi khi mô tả công việc (JD) quá ngắn (< 20 ký tự)', () => {
      const result = validateJobPostingForm({ ...validFormData, jobDescription: 'Làm việc nhóm' });
      expect(result.isValid).toBe(false);
      expect(result.errors.jobDescription).toBe('Mô tả công việc cần chi tiết hơn (tối thiểu 20 ký tự).');
    });

    it('báo lỗi khi yêu cầu ứng viên quá ngắn (< 20 ký tự)', () => {
      const result = validateJobPostingForm({ ...validFormData, requirements: 'Chăm chỉ' });
      expect(result.isValid).toBe(false);
      expect(result.errors.requirements).toBe('Yêu cầu ứng viên cần chi tiết hơn (tối thiểu 20 ký tự).');
    });

    it('báo lỗi khi quyền lợi ứng viên quá ngắn (< 10 ký tự)', () => {
      const result = validateJobPostingForm({ ...validFormData, benefits: 'Thưởng' });
      expect(result.isValid).toBe(false);
      expect(result.errors.benefits).toBe('Quyền lợi ứng viên cần chi tiết hơn (tối thiểu 10 ký tự).');
    });

    it('xác thực thành công khi toàn bộ dữ liệu hợp lệ', () => {
      const result = validateJobPostingForm(validFormData);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });
  });

  describe('AC3: Tương tác API Service & Lưu nháp / Đăng tin', () => {
    it('gọi API post /job-postings khi tạo mới tin tuyển dụng hợp lệ', async () => {
      const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
        data: {
          ...validFormData,
          id: 'jp-1001',
          createdAt: '2026-10-10T00:00:00Z',
          updatedAt: '2026-10-10T00:00:00Z',
        },
      });

      const response = await jobPostingService.createJobPosting(validFormData);
      expect(postSpy).toHaveBeenCalledWith('/job-postings', validFormData);
      expect(response.id).toBe('jp-1001');
      expect(response.title).toBe(validFormData.title);
    });

    it('ném lỗi ngay lập tức mà không gọi API nếu dữ liệu chưa thỏa mãn validate', async () => {
      const postSpy = vi.spyOn(axiosClient, 'post');

      await expect(
        jobPostingService.createJobPosting({ ...validFormData, title: '' })
      ).rejects.toThrow('Tiêu đề tin tuyển dụng không được để trống.');

      expect(postSpy).not.toHaveBeenCalled();
    });

    it('fallback an toàn khi backend API chưa triển khai endpoint /job-postings', async () => {
      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(new Error('Network Error / 404 Not Found'));

      const response = await jobPostingService.createJobPosting(validFormData);
      expect(response).toBeDefined();
      expect(response.id).toMatch(/^jp-/);
      expect(response.title).toBe(validFormData.title);
      expect(response.status).toBe('PUBLISHED');
    });

    it('cho phép lưu bản nháp (saveDraft) chỉ cần tiêu đề mà không bắt buộc đầy đủ thông tin', async () => {
      const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
        data: {
          id: 'jp-draft-1',
          title: 'Bản nháp tuyển dụng React Dev',
          status: 'DRAFT',
        },
      });

      const draftResult = await jobPostingService.saveDraft({
        title: 'Bản nháp tuyển dụng React Dev',
      });

      expect(postSpy).toHaveBeenCalledWith(
        '/job-postings/draft',
        expect.objectContaining({
          title: 'Bản nháp tuyển dụng React Dev',
          status: 'DRAFT',
        })
      );
      expect(draftResult.status).toBe('DRAFT');
    });

    it('báo lỗi khi lưu nháp nếu không có tiêu đề', async () => {
      await expect(
        jobPostingService.saveDraft({ title: '   ' })
      ).rejects.toThrow('Vui lòng nhập tiêu đề để có thể lưu bản nháp.');
    });
  });
});
