import { describe, expect, it } from 'vitest';
import React from 'react';
import {
  checkJobDeadlineStatus,
  getDeadlineStatus,
  type JobPostingData,
} from '../src/services/jobPostingService';
import { JobDeadlineBadge } from '../src/components/CareerPage/JobDeadlineBadge';
import { JobExpiredBanner } from '../src/components/CareerPage/JobExpiredBanner';

describe('Task TKNHTTDNB1-319: Job Expiry Status & Application Constraints (User Story S3-02)', () => {
  const fixedToday = new Date('2026-10-15T08:00:00Z');

  // AC3: Logic tính toán thời gian & phân loại hạn chót
  describe('AC3: Logic tính toán thời gian (checkJobDeadlineStatus)', () => {
    it('phân loại đúng trạng thái ĐÃ HẾT HẠN (EXPIRED) khi hạn nộp đã qua', () => {
      const pastDeadline = '2026-10-14'; // hôm qua so với fixedToday 2026-10-15
      const result = checkJobDeadlineStatus(pastDeadline, fixedToday);

      expect(result.status).toBe('EXPIRED');
      expect(result.isExpired).toBe(true);
      expect(result.isClosingSoon).toBe(false);
      expect(result.daysRemaining).toBeLessThan(0);
      expect(result.badgeVariant).toBe('expired');
      expect(result.badgeText).toBe('Đã đóng tuyển dụng');
    });

    it('phân loại đúng trạng thái SẮP HẾT HẠN (CLOSING_SOON) khi thời gian còn <= 3 ngày', () => {
      // 1. Hết hạn hôm nay (0 ngày)
      const todayDeadline = '2026-10-15';
      const resultToday = checkJobDeadlineStatus(todayDeadline, fixedToday);
      expect(resultToday.status).toBe('CLOSING_SOON');
      expect(resultToday.isClosingSoon).toBe(true);
      expect(resultToday.isExpired).toBe(false);
      expect(resultToday.daysRemaining).toBe(0);
      expect(resultToday.badgeVariant).toBe('closing_soon');
      expect(resultToday.badgeText).toBe('Hôm nay');

      // 2. Hết hạn trong 2 ngày
      const twoDaysDeadline = '2026-10-17';
      const result2Days = checkJobDeadlineStatus(twoDaysDeadline, fixedToday);
      expect(result2Days.status).toBe('CLOSING_SOON');
      expect(result2Days.isClosingSoon).toBe(true);
      expect(result2Days.isExpired).toBe(false);
      expect(result2Days.daysRemaining).toBe(2);
      expect(result2Days.badgeText).toBe('Hết hạn trong 2 ngày');

      // 3. Hết hạn trong 3 ngày
      const threeDaysDeadline = '2026-10-18';
      const result3Days = checkJobDeadlineStatus(threeDaysDeadline, fixedToday);
      expect(result3Days.status).toBe('CLOSING_SOON');
      expect(result3Days.isClosingSoon).toBe(true);
      expect(result3Days.daysRemaining).toBe(3);
      expect(result3Days.badgeText).toBe('Hết hạn trong 3 ngày');
    });

    it('phân loại đúng trạng thái CÒN HẠN (OPEN) khi thời gian còn trên 3 ngày', () => {
      const futureDeadline = '2026-10-25'; // còn 10 ngày
      const result = checkJobDeadlineStatus(futureDeadline, fixedToday);

      expect(result.status).toBe('OPEN');
      expect(result.isExpired).toBe(false);
      expect(result.isClosingSoon).toBe(false);
      expect(result.daysRemaining).toBe(10);
      expect(result.badgeVariant).toBe('open');
      expect(result.badgeText).toBe('Còn 10 ngày');
    });

    it('xử lý an toàn khi không có hạn nộp (undefined / rỗng)', () => {
      const result = checkJobDeadlineStatus(undefined);
      expect(result.status).toBe('OPEN');
      expect(result.isExpired).toBe(false);
      expect(result.isClosingSoon).toBe(false);
      expect(result.daysRemaining).toBeNull();
      expect(result.text).toBe('Không giới hạn');
      expect(result.badgeText).toBe('Đang mở tuyển dụng');
    });

    it('getDeadlineStatus tương thích ngược và phản ánh đúng trạng thái kiểm tra', () => {
      const status = getDeadlineStatus('2025-01-01');
      expect(status.isExpired).toBe(true);
      expect(status.status).toBe('EXPIRED');
    });
  });

  // AC1: Phân loại trạng thái thời hạn (Badge trực quan)
  describe('AC1: Component JobDeadlineBadge hiển thị màu sắc và thông điệp tương ứng', () => {
    it('hiển thị badge màu xanh lá cho tin CÒN HẠN (Open)', () => {
      const element = JobDeadlineBadge({
        deadline: '2026-10-25',
        referenceDate: fixedToday,
      });

      expect(React.isValidElement(element)).toBe(true);
      if (React.isValidElement<{ className?: string; 'data-status'?: string }>(element)) {
        expect(element.props['data-status']).toBe('OPEN');
        expect(element.props.className).toContain('bg-emerald-50');
        expect(element.props.className).toContain('text-emerald-700');
      }
    });

    it('hiển thị badge màu cam/vàng cho tin SẮP HẾT HẠN (Closing Soon)', () => {
      const element = JobDeadlineBadge({
        deadline: '2026-10-17', // còn 2 ngày
        referenceDate: fixedToday,
      });

      expect(React.isValidElement(element)).toBe(true);
      if (React.isValidElement<{ className?: string; 'data-status'?: string }>(element)) {
        expect(element.props['data-status']).toBe('CLOSING_SOON');
        expect(element.props.className).toContain('bg-amber-50');
        expect(element.props.className).toContain('text-amber-700');
      }
    });

    it('hiển thị badge màu đỏ/xám cho tin ĐÃ HẾT HẠN (Expired)', () => {
      const element = JobDeadlineBadge({
        deadline: '2026-10-10', // đã qua 5 ngày
        referenceDate: fixedToday,
      });

      expect(React.isValidElement(element)).toBe(true);
      if (React.isValidElement<{ className?: string; 'data-status'?: string }>(element)) {
        expect(element.props['data-status']).toBe('EXPIRED');
        expect(element.props.className).toContain('bg-rose-50');
        expect(element.props.className).toContain('text-rose-700');
      }
    });
  });

  // AC2: Ràng buộc tương tác khi tin hết hạn
  describe('AC2: Ràng buộc tương tác và Banner thông báo khi tin hết hạn', () => {
    it('hiển thị JobExpiredBanner thông báo nhẹ khi tin tuyển dụng đã đóng', () => {
      const element = JobExpiredBanner({
        message: 'Vị trí tuyển dụng này đã đóng, vui lòng tham khảo các vị trí khác.',
      });

      expect(React.isValidElement(element)).toBe(true);
      if (React.isValidElement<{ className?: string; 'data-testid'?: string }>(element)) {
        expect(element.props['data-testid']).toBe('job-expired-banner');
        expect(element.props.className).toContain('bg-rose-50');
      }
    });

    it('vô hiệu hóa nút ứng tuyển khi tin đã hết hạn và cập nhật nhãn nút', () => {
      const expiredJob: Partial<JobPostingData> = {
        id: 'jp-exp-01',
        title: 'Backend Developer (Node.js)',
        positionTitle: 'Backend Developer',
        departmentId: 'dept-tech',
        workLocation: 'Hà Nội',
        employmentType: 'FULL_TIME',
        level: 'MIDDLE',
        headcount: 1,
        deadline: '2025-01-01', // Đã hết hạn
        jobDescription: 'Lập trình backend...',
        requirements: 'Node.js...',
        benefits: 'Đãi ngộ...',
        skills: ['Node.js'],
        status: 'PUBLISHED',
      };

      const status = checkJobDeadlineStatus(expiredJob.deadline, fixedToday);
      expect(status.isExpired).toBe(true);

      // Nút ứng tuyển khi disabled
      const isApplyDisabled = status.isExpired;
      const applyButtonText = status.isExpired ? 'Đã hết hạn ứng tuyển' : 'Ứng tuyển ngay';

      expect(isApplyDisabled).toBe(true);
      expect(applyButtonText).toBe('Đã hết hạn ứng tuyển');
    });

    it('cho phép ứng tuyển bình thường khi tin còn hạn', () => {
      const activeJob: Partial<JobPostingData> = {
        id: 'jp-act-01',
        title: 'Senior Product Designer (UI/UX)',
        positionTitle: 'Senior Product Designer',
        departmentId: 'dept-tech',
        workLocation: 'TP. Hồ Chí Minh',
        employmentType: 'FULL_TIME',
        level: 'SENIOR',
        headcount: 1,
        deadline: '2026-11-15', // Còn hạn
        jobDescription: 'Thiết kế sản phẩm...',
        requirements: 'Figma...',
        benefits: 'Đãi ngộ...',
        skills: ['Figma'],
        status: 'PUBLISHED',
      };

      const status = checkJobDeadlineStatus(activeJob.deadline, fixedToday);
      expect(status.isExpired).toBe(false);

      const isApplyDisabled = status.isExpired;
      const applyButtonText = status.isExpired ? 'Đã hết hạn ứng tuyển' : 'Ứng tuyển ngay';

      expect(isApplyDisabled).toBe(false);
      expect(applyButtonText).toBe('Ứng tuyển ngay');
    });
  });
});
