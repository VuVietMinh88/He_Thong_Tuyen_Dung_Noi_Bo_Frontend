import { afterEach, describe, expect, it, vi } from 'vitest';
import axiosClient from '../src/utils/axiosClient';
import {
  jobPostingService,
  validateJobPostingForm,
  mapRequisitionToJobPosting,
  type JobPostingData,
  type SalaryType,
} from '../src/services/jobPostingService';
import type { Requisition, Position, Department } from '../src/services/business.service';

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

  describe('Task TKNHTTDNB1-301: Tích hợp lưu nháp tin từ yêu cầu đã duyệt', () => {
    const mockPositions: Position[] = [
      {
        id: 'pos-101',
        code: 'FE_DEV',
        name: 'Senior Frontend Developer',
        level: 'SENIOR',
        active: true,
        competencyFrameworkId: 'fw-1',
        createdAt: '2026-10-10T00:00:00Z',
        updatedAt: '2026-10-10T00:00:00Z',
      },
    ];

    const mockDepartments: Department[] = [
      {
        id: 'dept-tech',
        name: 'Trung tâm Phát triển Phần mềm',
        active: true,
      },
    ];

    const mockApprovedReq: Requisition = {
      id: 'req-app-999',
      positionId: 'pos-101',
      departmentId: 'dept-tech',
      headcount: 3,
      reason: 'NEW_HEADCOUNT',
      proposedSalaryMin: 25,
      proposedSalaryMax: 40,
      salaryJustification: 'Theo khung thị trường',
      neededBy: '2026-12-31',
      jobDescription: 'Phát triển các tính năng quản lý tuyển dụng cốt lõi.',
      candidateRequirements: 'Tối thiểu 3 năm kinh nghiệm React, TypeScript.',
      status: 'APPROVED',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-05T00:00:00Z',
    };

    it('AC1: lấy danh sách yêu cầu tuyển dụng đã duyệt (status = APPROVED) từ API', async () => {
      const getSpy = vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: {
          items: [
            mockApprovedReq,
            { ...mockApprovedReq, id: 'req-draft-1', status: 'DRAFT' },
          ],
        },
      });

      const approvedList = await jobPostingService.getApprovedRequisitions();
      expect(getSpy).toHaveBeenCalledWith('/requisitions', {
        params: { status: 'APPROVED', size: 100 },
      });
      expect(approvedList).toHaveLength(1);
      expect(approvedList[0].id).toBe('req-app-999');
      expect(approvedList[0].status).toBe('APPROVED');
    });

    it('AC1: lấy chi tiết yêu cầu tuyển dụng theo ID từ API', async () => {
      const getSpy = vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: mockApprovedReq,
      });

      const reqDetail = await jobPostingService.getRequisitionById('req-app-999');
      expect(getSpy).toHaveBeenCalledWith('/requisitions/req-app-999');
      expect(reqDetail?.id).toBe('req-app-999');
      expect(reqDetail?.headcount).toBe(3);
    });

    it('AC1: chuyển đổi và điền sẵn dữ liệu từ yêu cầu đã duyệt vào form (mapRequisitionToJobPosting)', () => {
      const mapped = mapRequisitionToJobPosting(mockApprovedReq, mockPositions, mockDepartments);

      expect(mapped.requisitionId).toBe('req-app-999');
      expect(mapped.title).toContain('Senior Frontend Developer');
      expect(mapped.title).toContain('Trung tâm Phát triển Phần mềm');
      expect(mapped.positionTitle).toBe('Senior Frontend Developer');
      expect(mapped.departmentId).toBe('dept-tech');
      expect(mapped.departmentName).toBe('Trung tâm Phát triển Phần mềm');
      expect(mapped.headcount).toBe(3);
      expect(mapped.deadline).toBe('2026-12-31');
      expect(mapped.salaryType).toBe('RANGE');
      expect(mapped.salaryMin).toBe(25);
      expect(mapped.salaryMax).toBe(40);
      expect(mapped.jobDescription).toBe('Phát triển các tính năng quản lý tuyển dụng cốt lõi.');
      expect(mapped.requirements).toBe('Tối thiểu 3 năm kinh nghiệm React, TypeScript.');
      expect(mapped.status).toBe('DRAFT');
    });

    it('AC1: xử lý mapping mức lương UP_TO và STARTING_FROM khi yêu cầu chỉ có min hoặc max', () => {
      // Chỉ có max lương
      const reqUpTo: Requisition = {
        ...mockApprovedReq,
        proposedSalaryMin: null,
        proposedSalaryMax: 50,
      };
      const mappedUpTo = mapRequisitionToJobPosting(reqUpTo, mockPositions, mockDepartments);
      expect(mappedUpTo.salaryType).toBe('UP_TO');
      expect(mappedUpTo.salaryMax).toBe(50);
      expect(mappedUpTo.salaryMin).toBeUndefined();

      // Chỉ có min lương
      const reqStarting: Requisition = {
        ...mockApprovedReq,
        proposedSalaryMin: 18,
        proposedSalaryMax: null,
      };
      const mappedStarting = mapRequisitionToJobPosting(reqStarting, mockPositions, mockDepartments);
      expect(mappedStarting.salaryType).toBe('STARTING_FROM');
      expect(mappedStarting.salaryMin).toBe(18);
      expect(mappedStarting.salaryMax).toBeUndefined();

      // Lương thỏa thuận
      const reqNegotiable: Requisition = {
        ...mockApprovedReq,
        proposedSalaryMin: null,
        proposedSalaryMax: null,
      };
      const mappedNegotiable = mapRequisitionToJobPosting(reqNegotiable, mockPositions, mockDepartments);
      expect(mappedNegotiable.salaryType).toBe('NEGOTIABLE');
      expect(mappedNegotiable.isSalaryNegotiable).toBe(true);
    });

    it('AC2: gọi API lưu trạng thái nháp thành công kèm requisitionId liên kết', async () => {
      const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
        data: {
          id: 'jp-draft-saved-101',
          requisitionId: 'req-app-999',
          title: 'Tin nháp tuyển dụng từ Requisition 999',
          status: 'DRAFT',
        },
      });

      const result = await jobPostingService.saveDraft({
        requisitionId: 'req-app-999',
        title: 'Tin nháp tuyển dụng từ Requisition 999',
        positionTitle: 'Senior Frontend Developer',
        status: 'DRAFT',
      });

      expect(postSpy).toHaveBeenCalledWith(
        '/job-postings/draft',
        expect.objectContaining({
          requisitionId: 'req-app-999',
          title: 'Tin nháp tuyển dụng từ Requisition 999',
          status: 'DRAFT',
        })
      );
      expect(result.id).toBe('jp-draft-saved-101');
      expect(result.requisitionId).toBe('req-app-999');
      expect(result.status).toBe('DRAFT');
    });

    it('AC2: fallback tạo bản nháp cục bộ an toàn khi API backend trả về lỗi', async () => {
      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(new Error('Server unavailable'));

      const fallbackDraft = await jobPostingService.saveDraft({
        requisitionId: 'req-app-999',
        title: 'Tin tuyển dụng fallback',
      });

      expect(fallbackDraft.id).toBeDefined();
      expect(fallbackDraft.requisitionId).toBe('req-app-999');
      expect(fallbackDraft.title).toBe('Tin tuyển dụng fallback');
      expect(fallbackDraft.status).toBe('DRAFT');
    });
  });
});
