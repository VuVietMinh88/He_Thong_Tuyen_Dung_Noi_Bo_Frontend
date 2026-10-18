import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { renderToString } from 'react-dom/server';
import axiosClient from '../src/utils/axiosClient';
import emailAuditService, {
  handleEmailAuditError,
} from '../src/services/emailAuditService';
import {
  type EmailAuditLogItem,
  INITIAL_EMAIL_AUDIT_LOGS,
  getStoredEmailAuditLogs,
  saveStoredEmailAuditLogs,
} from '../src/types/emailAuditLog';
import { EmailAuditLogPage } from '../src/pages/Candidate/EmailAuditLogPage';
import { ToastContext } from '../src/components/notifications/ToastContext';

const storage = new Map<string, string>();

const mockToastValue = {
  notify: vi.fn(),
  addToast: vi.fn(),
  removeToast: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
};

describe('TKNHTTDNB1-536 / S8-02: Tích hợp lọc lịch sử và phản hồi gửi lại (emailAuditService)', () => {
  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
    });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('AC 1: API Service getEmailAuditLogs & getEmailAuditLogById', () => {
    it('lấy danh sách nhật ký gửi email thành công từ backend API', async () => {
      const mockApiLogs: EmailAuditLogItem[] = [
        {
          id: 'log-api-01',
          candidateId: 'cand-01',
          candidateName: 'Nguyễn Văn An',
          candidateEmail: 'an.nguyen@example.com',
          templateType: 'APPLICATION_CONFIRMATION',
          templateName: 'Xác nhận tiếp nhận hồ sơ',
          subject: 'Xác nhận hồ sơ - Nguyễn Văn An',
          body: 'Nội dung thư...',
          senderName: 'Trần Thu Hà',
          senderEmail: 'ha.tran@smart-recruitment.vn',
          status: 'SENT',
          sentAt: '2026-10-18T10:00:00Z',
          retryCount: 0,
        },
      ];

      vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: mockApiLogs,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await emailAuditService.getEmailAuditLogs();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('log-api-01');
      expect(result[0].candidateName).toBe('Nguyễn Văn An');

      // Kiểm tra cache LocalStorage
      const local = getStoredEmailAuditLogs();
      expect(local[0].id).toBe('log-api-01');
    });

    it('fallback về dữ liệu cục bộ khi backend API gặp lỗi mất kết nối mạng', async () => {
      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(new Error('Network error'));

      const result = await emailAuditService.getEmailAuditLogs();
      expect(result.length).toBeGreaterThanOrEqual(5);
      expect(result[0].id).toBe(INITIAL_EMAIL_AUDIT_LOGS[0].id);
    });

    it('ném lỗi EmailAuditApiError khi API trả về mã lỗi 403 Forbidden', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 403,
          data: { message: 'Bạn không có quyền truy cập nhật ký hoặc gửi lại email tuyển dụng.' },
        },
      };
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);
      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(axiosError);

      await expect(emailAuditService.getEmailAuditLogs()).rejects.toThrow(
        'Bạn không có quyền truy cập nhật ký hoặc gửi lại email tuyển dụng.',
      );
    });

    it('lấy chi tiết một bản ghi nhật ký email theo ID hợp lệ', async () => {
      const mockDetail: EmailAuditLogItem = {
        ...INITIAL_EMAIL_AUDIT_LOGS[0],
        subject: 'Tiêu đề chi tiết từ API',
      };

      vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: mockDetail,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await emailAuditService.getEmailAuditLogById('log-01');
      expect(result.subject).toBe('Tiêu đề chi tiết từ API');
    });

    it('ném lỗi khi logId để trống hoặc không tìm thấy bản ghi', async () => {
      await expect(emailAuditService.getEmailAuditLogById('')).rejects.toThrow(
        'Mã nhật ký email không được để trống.',
      );

      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(new Error('Not found'));
      await expect(emailAuditService.getEmailAuditLogById('non-existent-id')).rejects.toThrow(
        'Không tìm thấy bản ghi nhật ký email với mã non-existent-id.',
      );
    });
  });

  describe('AC 2: Lọc lịch sử & Trạng thái Hàng đợi (Filtering & Queue Status)', () => {
    it('lọc chính xác theo trạng thái Thành công (SENT)', async () => {
      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(new Error('Local fallback'));

      const sentLogs = await emailAuditService.getEmailAuditLogs({ status: 'SENT' });
      expect(sentLogs.length).toBeGreaterThan(0);
      sentLogs.forEach((item) => {
        expect(item.status).toBe('SENT');
      });
    });

    it('lọc chính xác theo trạng thái Thất bại (FAILED)', async () => {
      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(new Error('Local fallback'));

      const failedLogs = await emailAuditService.getEmailAuditLogs({ status: 'FAILED' });
      expect(failedLogs.length).toBeGreaterThan(0);
      failedLogs.forEach((item) => {
        expect(item.status).toBe('FAILED');
      });
    });

    it('lọc chính xác theo trạng thái Đang chờ trong hàng đợi (QUEUED / PENDING)', async () => {
      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(new Error('Local fallback'));

      const queuedLogs = await emailAuditService.getEmailAuditLogs({ status: 'QUEUED' });
      expect(queuedLogs.length).toBeGreaterThan(0);
      queuedLogs.forEach((item) => {
        expect(['QUEUED', 'PENDING']).toContain(item.status);
      });
    });

    it('lọc theo khoảng thời gian tùy chọn (Date Range)', async () => {
      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(new Error('Local fallback'));

      // Thêm một email cũ năm 2025
      const oldLog: EmailAuditLogItem = {
        ...INITIAL_EMAIL_AUDIT_LOGS[0],
        id: 'old-log-2025',
        sentAt: '2025-01-15T10:00:00Z',
      };
      saveStoredEmailAuditLogs([...INITIAL_EMAIL_AUDIT_LOGS, oldLog]);

      // Lọc theo CUSTOM từ 2026-10-01 đến 2026-10-31
      const octLogs = await emailAuditService.getEmailAuditLogs({
        dateRangePreset: 'CUSTOM',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
      });

      expect(octLogs.some((l) => l.id === 'old-log-2025')).toBe(false);
    });

    it('lọc theo từ khóa tìm kiếm (searchKeyword)', async () => {
      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(new Error('Local fallback'));

      const results = await emailAuditService.getEmailAuditLogs({
        searchKeyword: 'Lê Quốc Bảo',
      });

      expect(results.length).toBe(1);
      expect(results[0].candidateName).toBe('Lê Quốc Bảo');
    });
  });

  describe('AC 3: Thao tác Gửi lại qua Hàng đợi (retryFailedEmail & retryAllFailedEmails)', () => {
    it('gửi yêu cầu gửi lại email lỗi qua backend API và nhận queue tracking id', async () => {
      const mockSuccessResponse = {
        success: true,
        message: 'Đã đưa email vào hàng đợi gửi lại thành công.',
        logItem: {
          ...INITIAL_EMAIL_AUDIT_LOGS[1],
          status: 'SENT' as const,
          sentAt: '2026-10-18T14:00:00Z',
          retryCount: 2,
          queueTrackingId: 'q-trk-9999',
        },
        queueTrackingId: 'q-trk-9999',
      };

      vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
        data: mockSuccessResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const response = await emailAuditService.retryFailedEmail('log-02');
      expect(response.success).toBe(true);
      expect(response.logItem.status).toBe('SENT');
      expect(response.logItem.retryCount).toBe(2);
      expect(response.queueTrackingId).toBe('q-trk-9999');

      // Kiểm tra bộ nhớ local được cập nhật đồng bộ
      const stored = getStoredEmailAuditLogs();
      const updatedInStore = stored.find((l) => l.id === 'log-02');
      expect(updatedInStore?.status).toBe('SENT');
      expect(updatedInStore?.retryCount).toBe(2);
    });

    it('gửi lại offline-first thành công khi backend không phản hồi', async () => {
      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(new Error('Backend offline'));

      const response = await emailAuditService.retryFailedEmail('log-04');
      expect(response.success).toBe(true);
      expect(response.logItem.status).toBe('SENT');
      expect(response.logItem.retryCount).toBe(1);
      expect(response.queueTrackingId).toBeDefined();

      const stored = getStoredEmailAuditLogs();
      const updated = stored.find((l) => l.id === 'log-04');
      expect(updated?.status).toBe('SENT');
    });

    it('ném lỗi khi thử gửi lại với ID không tồn tại trong hệ thống', async () => {
      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(new Error('Not found'));

      await expect(
        emailAuditService.retryFailedEmail('non-existent-id'),
      ).rejects.toThrow('Không tìm thấy email với mã non-existent-id để thực hiện gửi lại.');
    });

    it('gửi lại toàn bộ email đang gặp lỗi (retryAllFailedEmails)', async () => {
      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(new Error('Offline fallback'));

      const result = await emailAuditService.retryAllFailedEmails();
      expect(result.retriedCount).toBeGreaterThanOrEqual(1);

      const stored = getStoredEmailAuditLogs();
      const remainingFailed = stored.filter((l) => l.status === 'FAILED');
      expect(remainingFailed).toHaveLength(0);
    });
  });

  describe('AC 4: Chuyển đổi mã lỗi HTTP (handleEmailAuditError)', () => {
    it('xử lý mã lỗi 400 Bad Request', () => {
      const err = { isAxiosError: true, response: { status: 400, data: {} } };
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const parsed = handleEmailAuditError(err, 'Lỗi mặc định');
      expect(parsed.statusCode).toBe(400);
      expect(parsed.message).toBe('Yêu cầu truy vấn nhật ký gửi email không hợp lệ.');
    });

    it('xử lý mã lỗi 401 Unauthorized', () => {
      const err = { isAxiosError: true, response: { status: 401, data: {} } };
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const parsed = handleEmailAuditError(err, 'Lỗi mặc định');
      expect(parsed.statusCode).toBe(401);
      expect(parsed.message).toBe('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.');
    });

    it('xử lý mã lỗi 403 Forbidden', () => {
      const err = { isAxiosError: true, response: { status: 403, data: {} } };
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const parsed = handleEmailAuditError(err, 'Lỗi mặc định');
      expect(parsed.statusCode).toBe(403);
      expect(parsed.message).toBe('Bạn không có quyền truy cập nhật ký hoặc gửi lại email tuyển dụng.');
    });

    it('xử lý mã lỗi 404 Not Found', () => {
      const err = { isAxiosError: true, response: { status: 404, data: {} } };
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const parsed = handleEmailAuditError(err, 'Lỗi mặc định');
      expect(parsed.statusCode).toBe(404);
      expect(parsed.message).toBe('Không tìm thấy thông tin bản ghi nhật ký email tương ứng.');
    });

    it('xử lý mã lỗi 500 Server Error', () => {
      const err = { isAxiosError: true, response: { status: 500, data: {} } };
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const parsed = handleEmailAuditError(err, 'Lỗi mặc định');
      expect(parsed.statusCode).toBe(500);
      expect(parsed.message).toBe('Hệ thống máy chủ gặp sự cố khi xử lý nhật ký email. Vui lòng thử lại sau.');
    });

    it('xử lý lỗi mất kết nối mạng (Network Error / No Response)', () => {
      const err = { isAxiosError: true, response: undefined };
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const parsed = handleEmailAuditError(err, 'Lỗi mặc định');
      expect(parsed.message).toBe('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.');
    });
  });

  describe('AC 5: Tích hợp giao diện EmailAuditLogPage với Queue Status & Date Filter', () => {
    it('hiển thị đầy đủ 4 thẻ thống kê nhanh bao gồm Đang trong hàng đợi', () => {
      const html = renderToString(
        <ToastContext.Provider value={mockToastValue}>
          <EmailAuditLogPage />
        </ToastContext.Provider>,
      );

      expect(html).toContain('Tổng số email đã gửi');
      expect(html).toContain('Gửi thành công');
      expect(html).toContain('Thất bại / Cần gửi lại');
      expect(html).toContain('Đang trong hàng đợi');
    });

    it('hiển thị nút lọc trạng thái Hàng đợi và huy hiệu Đang trong hàng đợi (Queued)', () => {
      const html = renderToString(
        <ToastContext.Provider value={mockToastValue}>
          <EmailAuditLogPage />
        </ToastContext.Provider>,
      );

      expect(html).toContain('Hàng đợi (');
      expect(html).toContain('Đang trong hàng đợi (Queued)');
    });

    it('hiển thị bộ chọn khoảng thời gian với các tùy chọn preset', () => {
      const html = renderToString(
        <ToastContext.Provider value={mockToastValue}>
          <EmailAuditLogPage />
        </ToastContext.Provider>,
      );

      expect(html).toContain('Tất cả thời gian');
      expect(html).toContain('Hôm nay');
      expect(html).toContain('7 ngày qua');
      expect(html).toContain('30 ngày qua');
    });
  });
});
