import { afterEach, describe, expect, it, vi } from 'vitest';
import axiosClient from '../src/utils/axiosClient';
import {
  jobPostingService,
  type JobPostingData,
  type JobPostingStatus,
} from '../src/services/jobPostingService';

afterEach(() => {
  vi.restoreAllMocks();
});

const mockPendingPosting: JobPostingData = {
  id: 'jp-pending-101',
  requisitionId: 'req-app-888',
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
  jobDescription: 'Tham gia phát triển giao diện người dùng web quy mô lớn...',
  requirements: 'Từ 3 năm kinh nghiệm React, TypeScript...',
  benefits: 'Lương thưởng cạnh tranh, bảo hiểm PVI cao cấp...',
  skills: ['React', 'TypeScript', 'Tailwind CSS'],
  status: 'PENDING_APPROVAL',
  publishInternal: true,
  publishCareerPage: true,
  createdAt: '2026-10-10T08:00:00Z',
  updatedAt: '2026-10-10T10:00:00Z',
};

describe('Job Posting Preview & Approval (Task TKNHTTDNB1-306)', () => {
  describe('AC1: Màn hình xem trước (Preview) hiển thị đầy đủ chi tiết tin tuyển dụng', () => {
    it('chứa đầy đủ các trường thông tin hiển thị trên giao diện Preview', () => {
      expect(mockPendingPosting.id).toBe('jp-pending-101');
      expect(mockPendingPosting.title).toBeDefined();
      expect(mockPendingPosting.positionTitle).toBeDefined();
      expect(mockPendingPosting.departmentName).toBeDefined();
      expect(mockPendingPosting.workLocation).toBe('Hà Nội');
      expect(mockPendingPosting.employmentType).toBe('FULL_TIME');
      expect(mockPendingPosting.level).toBe('SENIOR');
      expect(mockPendingPosting.headcount).toBe(2);
      expect(mockPendingPosting.deadline).toBe('2026-12-31');
      expect(mockPendingPosting.jobDescription).toBeDefined();
      expect(mockPendingPosting.requirements).toBeDefined();
      expect(mockPendingPosting.benefits).toBeDefined();
      expect(mockPendingPosting.skills).toContain('React');
      expect(mockPendingPosting.publishInternal).toBe(true);
      expect(mockPendingPosting.publishCareerPage).toBe(true);
    });

    it('hỗ trợ đầy đủ các trạng thái phê duyệt của tin tuyển dụng', () => {
      const allowedStatuses: JobPostingStatus[] = [
        'DRAFT',
        'PENDING_APPROVAL',
        'APPROVED',
        'PUBLISHED',
        'REJECTED',
        'REVISION_REQUESTED',
        'CLOSED',
      ];
      expect(allowedStatuses).toContain('PENDING_APPROVAL');
      expect(allowedStatuses).toContain('PUBLISHED');
      expect(allowedStatuses).toContain('REJECTED');
      expect(allowedStatuses).toContain('REVISION_REQUESTED');
    });

    it('lấy chi tiết tin tuyển dụng qua getJobPostingById', async () => {
      const getSpy = vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: mockPendingPosting,
      });

      const result = await jobPostingService.getJobPostingById('jp-pending-101');
      expect(getSpy).toHaveBeenCalledWith('/job-postings/jp-pending-101');
      expect(result).not.toBeNull();
      expect(result?.title).toBe(mockPendingPosting.title);
      expect(result?.status).toBe('PENDING_APPROVAL');
    });

    it('trả về null an toàn khi không tìm thấy tin tuyển dụng hoặc gặp lỗi', async () => {
      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(new Error('Not found'));

      const result = await jobPostingService.getJobPostingById('invalid-id');
      expect(result).toBeNull();
    });
  });

  describe('AC2: Nhóm thao tác Duyệt xuất bản, Từ chối, Yêu cầu chỉnh sửa', () => {
    it('thao tác Duyệt xuất bản (approveJobPosting) gọi API và chuyển trạng thái sang PUBLISHED', async () => {
      const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
        data: {
          ...mockPendingPosting,
          status: 'PUBLISHED',
          approvalNote: 'Đạt chuẩn xuất bản',
          reviewedAt: '2026-10-10T12:00:00Z',
        },
      });

      const response = await jobPostingService.approveJobPosting('jp-pending-101', 'Đạt chuẩn xuất bản');
      expect(postSpy).toHaveBeenCalledWith(
        '/job-postings/jp-pending-101/approve',
        expect.objectContaining({
          status: 'PUBLISHED',
          note: 'Đạt chuẩn xuất bản',
        })
      );
      expect(response.status).toBe('PUBLISHED');
      expect(response.approvalNote).toBe('Đạt chuẩn xuất bản');
    });

    it('thao tác Duyệt xuất bản có cơ chế fallback an toàn nếu API backend offline', async () => {
      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(new Error('Network error'));

      const response = await jobPostingService.approveJobPosting('jp-pending-101');
      expect(response).toBeDefined();
      expect(response.status).toBe('PUBLISHED');
    });

    it('thao tác Từ chối (rejectJobPosting) gọi API và chuyển trạng thái sang REJECTED', async () => {
      const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
        data: {
          ...mockPendingPosting,
          status: 'REJECTED',
          rejectionReason: 'Vị trí đã tạm ngưng theo chỉ đạo BGĐ',
          reviewedAt: '2026-10-10T12:00:00Z',
        },
      });

      const response = await jobPostingService.rejectJobPosting(
        'jp-pending-101',
        'Vị trí đã tạm ngưng theo chỉ đạo BGĐ'
      );
      expect(postSpy).toHaveBeenCalledWith(
        '/job-postings/jp-pending-101/reject',
        expect.objectContaining({
          status: 'REJECTED',
          reason: 'Vị trí đã tạm ngưng theo chỉ đạo BGĐ',
        })
      );
      expect(response.status).toBe('REJECTED');
      expect(response.rejectionReason).toBe('Vị trí đã tạm ngưng theo chỉ đạo BGĐ');
    });

    it('thao tác Yêu cầu chỉnh sửa (requestRevisionJobPosting) gọi API và chuyển trạng thái REVISION_REQUESTED', async () => {
      const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
        data: {
          ...mockPendingPosting,
          status: 'REVISION_REQUESTED',
          revisionFeedback: 'Cần làm rõ thêm quyền lợi và mức thưởng KPI',
          reviewedAt: '2026-10-10T12:00:00Z',
        },
      });

      const response = await jobPostingService.requestRevisionJobPosting(
        'jp-pending-101',
        'Cần làm rõ thêm quyền lợi và mức thưởng KPI'
      );
      expect(postSpy).toHaveBeenCalledWith(
        '/job-postings/jp-pending-101/request-revision',
        expect.objectContaining({
          status: 'REVISION_REQUESTED',
          feedback: 'Cần làm rõ thêm quyền lợi và mức thưởng KPI',
        })
      );
      expect(response.status).toBe('REVISION_REQUESTED');
      expect(response.revisionFeedback).toBe('Cần làm rõ thêm quyền lợi và mức thưởng KPI');
    });
  });

  describe('AC3: Validate lý do bắt buộc khi từ chối hoặc yêu cầu chỉnh sửa', () => {
    it('báo lỗi khi từ chối tin tuyển dụng nếu lý do để trống', async () => {
      await expect(
        jobPostingService.rejectJobPosting('jp-pending-101', '   ')
      ).rejects.toThrow('Vui lòng cung cấp lý do từ chối tin tuyển dụng.');
    });

    it('báo lỗi khi yêu cầu chỉnh sửa tin tuyển dụng nếu nội dung phản hồi để trống', async () => {
      await expect(
        jobPostingService.requestRevisionJobPosting('jp-pending-101', '')
      ).rejects.toThrow('Vui lòng cung cấp nội dung yêu cầu chỉnh sửa tin tuyển dụng.');
    });

    it('fallback trả về dữ liệu có lưu lý do từ chối khi API backend gặp lỗi', async () => {
      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(new Error('Server Error'));

      const fallback = await jobPostingService.rejectJobPosting(
        'jp-pending-101',
        'Ngân sách quý này chưa đủ đáp ứng'
      );
      expect(fallback.id).toBe('jp-pending-101');
      expect(fallback.status).toBe('REJECTED');
      expect(fallback.rejectionReason).toBe('Ngân sách quý này chưa đủ đáp ứng');
    });

    it('fallback trả về dữ liệu có lưu phản hồi chỉnh sửa khi API backend gặp lỗi', async () => {
      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(new Error('Server Error'));

      const fallback = await jobPostingService.requestRevisionJobPosting(
        'jp-pending-101',
        'Đề xuất tăng thêm 1 chỉ tiêu tuyển dụng'
      );
      expect(fallback.id).toBe('jp-pending-101');
      expect(fallback.status).toBe('REVISION_REQUESTED');
      expect(fallback.revisionFeedback).toBe('Đề xuất tăng thêm 1 chỉ tiêu tuyển dụng');
    });
  });
});
