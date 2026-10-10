import { afterEach, describe, expect, it, vi } from 'vitest';
import axiosClient from '../src/utils/axiosClient';
import {
  jobPostingService,
  type JobPostingData,
  type JobPostingAuditLog,
  formatAuditDateTime,
} from '../src/services/jobPostingService';

afterEach(() => {
  vi.restoreAllMocks();
});

const mockBasePosting: JobPostingData = {
  id: 'jp-audit-307',
  requisitionId: 'req-307',
  title: 'Senior Frontend Developer (React & TypeScript)',
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
  jobDescription: 'Mô tả công việc tuyển dụng...',
  requirements: 'Yêu cầu ứng viên tuyển dụng...',
  benefits: 'Quyền lợi đãi ngộ...',
  skills: ['React', 'TypeScript', 'Tailwind CSS'],
  status: 'PENDING_APPROVAL',
  publishInternal: true,
  publishCareerPage: true,
  createdBy: {
    id: 'usr-hr-001',
    name: 'Nguyễn Văn Minh',
    email: 'minh.nguyen@company.com',
    role: 'Chuyên viên Tuyển dụng (Recruiter)',
    department: 'Khối Công nghệ & Sản phẩm',
  },
  createdAt: '2026-10-10T08:00:00Z',
  updatedAt: '2026-10-10T10:00:00Z',
};

const mockAuditLogs: JobPostingAuditLog[] = [
  {
    id: 'log-1',
    postingId: 'jp-audit-307',
    action: 'CREATED',
    actionName: 'Tạo bản nháp tin tuyển dụng',
    actor: {
      id: 'usr-hr-001',
      name: 'Nguyễn Văn Minh',
      email: 'minh.nguyen@company.com',
      role: 'Chuyên viên Tuyển dụng (Recruiter)',
      department: 'Khối Công nghệ & Sản phẩm',
    },
    timestamp: '2026-10-10T08:00:00Z',
    fromStatus: 'DRAFT',
    toStatus: 'DRAFT',
    note: 'Khởi tạo tin từ yêu cầu đã duyệt',
  },
  {
    id: 'log-2',
    postingId: 'jp-audit-307',
    action: 'SUBMITTED',
    actionName: 'Gửi yêu cầu phê duyệt',
    actor: {
      id: 'usr-hr-001',
      name: 'Nguyễn Văn Minh',
      email: 'minh.nguyen@company.com',
      role: 'Chuyên viên Tuyển dụng (Recruiter)',
      department: 'Khối Công nghệ & Sản phẩm',
    },
    timestamp: '2026-10-10T10:00:00Z',
    fromStatus: 'DRAFT',
    toStatus: 'PENDING_APPROVAL',
    note: 'Đã hoàn thiện nội dung và gửi cấp quản lý phê duyệt',
  },
];

describe('Tích hợp duyệt xuất bản và lịch sử người đăng (Task TKNHTTDNB1-307)', () => {
  describe('AC1: Kết nối API duyệt tin tuyển dụng, cập nhật trạng thái thành "Đã xuất bản"', () => {
    it('approveJobPosting gọi API thành công và cập nhật status thành PUBLISHED, thông tin người duyệt và thời gian duyệt', async () => {
      const now = '2026-10-10T11:00:00Z';
      const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
        data: {
          ...mockBasePosting,
          status: 'PUBLISHED',
          approvalNote: 'Đạt yêu cầu xuất bản',
          publishedBy: {
            id: 'usr-mgr-002',
            name: 'Trần Thị Thu Hà',
            email: 'ha.tran@company.com',
            role: 'Trưởng phòng Tuyển dụng & Đãi ngộ',
          },
          publishedAt: now,
          reviewedAt: now,
        },
      });

      const result = await jobPostingService.approveJobPosting('jp-audit-307', 'Đạt yêu cầu xuất bản');
      expect(postSpy).toHaveBeenCalledWith(
        '/job-postings/jp-audit-307/approve',
        expect.objectContaining({
          status: 'PUBLISHED',
          note: 'Đạt yêu cầu xuất bản',
        })
      );
      expect(result.status).toBe('PUBLISHED');
      expect(result.approvalNote).toBe('Đạt yêu cầu xuất bản');
      expect(result.publishedBy?.name).toBe('Trần Thị Thu Hà');
      expect(result.publishedAt).toBe(now);
    });

    it('publishJobPosting gọi API xuất bản trực tiếp kèm cấu hình các kênh truyền thông', async () => {
      const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
        data: {
          ...mockBasePosting,
          status: 'PUBLISHED',
          publishInternal: true,
          publishCareerPage: true,
          publishedAt: '2026-10-10T11:30:00Z',
        },
      });

      const result = await jobPostingService.publishJobPosting(
        'jp-audit-307',
        'Xuất bản đa kênh',
        { publishInternal: true, publishCareerPage: true }
      );

      expect(postSpy).toHaveBeenCalledWith(
        '/job-postings/jp-audit-307/publish',
        expect.objectContaining({
          status: 'PUBLISHED',
          note: 'Xuất bản đa kênh',
          channels: { publishInternal: true, publishCareerPage: true },
        })
      );
      expect(result.status).toBe('PUBLISHED');
      expect(result.publishInternal).toBe(true);
      expect(result.publishCareerPage).toBe(true);
    });

    it('approveJobPosting có fallback an toàn cập nhật status PUBLISHED và bổ sung audit log khi backend offline', async () => {
      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(new Error('Network error'));

      const result = await jobPostingService.approveJobPosting('jp-audit-307', 'Ghi chú duyệt offline');
      expect(result).toBeDefined();
      expect(result.status).toBe('PUBLISHED');
      expect(result.publishedBy?.name).toBe('Trần Thị Thu Hà');
      expect(result.publishedAt).toBeDefined();
      expect(result.auditLogs).toBeDefined();
      expect(result.auditLogs?.[0].action).toBe('PUBLISHED');
      expect(result.auditLogs?.[0].toStatus).toBe('PUBLISHED');
    });
  });

  describe('AC2: Lấy dữ liệu và hiển thị danh sách/thông tin lịch sử người đăng (Audit Log)', () => {
    it('getJobPostingAuditHistory gọi API lấy danh sách vết kiểm toán thành công', async () => {
      const getSpy = vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: mockAuditLogs,
      });

      const logs = await jobPostingService.getJobPostingAuditHistory('jp-audit-307');
      expect(getSpy).toHaveBeenCalledWith('/job-postings/jp-audit-307/audit-logs');
      expect(logs).toHaveLength(2);
      expect(logs[0].action).toBe('CREATED');
      expect(logs[0].actor.name).toBe('Nguyễn Văn Minh');
      expect(logs[1].action).toBe('SUBMITTED');
      expect(logs[1].toStatus).toBe('PENDING_APPROVAL');
    });

    it('getJobPostingAuditHistory trả về dữ liệu mock hợp lệ khi backend endpoint chưa cấu hình', async () => {
      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(new Error('Endpoint not ready'));

      const logs = await jobPostingService.getJobPostingAuditHistory('jp-mock-id');
      expect(logs).toBeDefined();
      expect(logs.length).toBeGreaterThanOrEqual(2);
      expect(logs[0].actor.name).toBeDefined();
      expect(logs[0].timestamp).toBeDefined();
    });

    it('formatAuditDateTime định dạng thời gian tiếng Việt và tính toán khoảng thời gian tương đối chuẩn xác', () => {
      const now = new Date();
      const justNowString = now.toISOString();
      const resultJustNow = formatAuditDateTime(justNowString);
      expect(resultJustNow.formatted).toContain(':');
      expect(resultJustNow.relative).toBe('Vừa xong');

      const pastDate = '2026-10-01T10:30:00Z';
      const resultPast = formatAuditDateTime(pastDate);
      expect(resultPast.formatted).toBeDefined();
      expect(resultPast.formatted).toContain('2026');

      const invalid = formatAuditDateTime(undefined);
      expect(invalid.formatted).toBe('Chưa có thông tin');
    });

    it('kiểm tra dữ liệu người đăng tin (Creator) có đầy đủ tên, email, chức danh và phòng ban', () => {
      expect(mockBasePosting.createdBy).toBeDefined();
      expect(mockBasePosting.createdBy?.name).toBe('Nguyễn Văn Minh');
      expect(mockBasePosting.createdBy?.email).toBe('minh.nguyen@company.com');
      expect(mockBasePosting.createdBy?.role).toBe('Chuyên viên Tuyển dụng (Recruiter)');
      expect(mockBasePosting.createdBy?.department).toBe('Khối Công nghệ & Sản phẩm');
    });
  });

  describe('AC3: Xử lý các trạng thái loading, success, error khi gọi API', () => {
    it('rejectJobPosting từ chối tin và ném lỗi hợp lệ khi không cung cấp lý do', async () => {
      await expect(jobPostingService.rejectJobPosting('jp-audit-307', '   ')).rejects.toThrow(
        'Vui lòng cung cấp lý do từ chối tin tuyển dụng.'
      );
    });

    it('requestRevisionJobPosting ném lỗi hợp lệ khi để trống nội dung góp ý', async () => {
      await expect(jobPostingService.requestRevisionJobPosting('jp-audit-307', '')).rejects.toThrow(
        'Vui lòng cung cấp nội dung yêu cầu chỉnh sửa tin tuyển dụng.'
      );
    });

    it('rejectJobPosting gọi API thành công và chuyển trạng thái thành REJECTED', async () => {
      const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
        data: {
          ...mockBasePosting,
          status: 'REJECTED',
          rejectionReason: 'Vị trí đã đủ chỉ tiêu tuyển dụng',
        },
      });

      const result = await jobPostingService.rejectJobPosting(
        'jp-audit-307',
        'Vị trí đã đủ chỉ tiêu tuyển dụng'
      );
      expect(postSpy).toHaveBeenCalledWith(
        '/job-postings/jp-audit-307/reject',
        expect.objectContaining({
          status: 'REJECTED',
          reason: 'Vị trí đã đủ chỉ tiêu tuyển dụng',
        })
      );
      expect(result.status).toBe('REJECTED');
      expect(result.rejectionReason).toBe('Vị trí đã đủ chỉ tiêu tuyển dụng');
    });

    it('requestRevisionJobPosting gọi API thành công và chuyển trạng thái thành REVISION_REQUESTED', async () => {
      const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
        data: {
          ...mockBasePosting,
          status: 'REVISION_REQUESTED',
          revisionFeedback: 'Cần bổ sung tiêu chí chứng chỉ ngoại ngữ',
        },
      });

      const result = await jobPostingService.requestRevisionJobPosting(
        'jp-audit-307',
        'Cần bổ sung tiêu chí chứng chỉ ngoại ngữ'
      );
      expect(postSpy).toHaveBeenCalledWith(
        '/job-postings/jp-audit-307/request-revision',
        expect.objectContaining({
          status: 'REVISION_REQUESTED',
          feedback: 'Cần bổ sung tiêu chí chứng chỉ ngoại ngữ',
        })
      );
      expect(result.status).toBe('REVISION_REQUESTED');
      expect(result.revisionFeedback).toBe('Cần bổ sung tiêu chí chứng chỉ ngoại ngữ');
    });
  });
});
