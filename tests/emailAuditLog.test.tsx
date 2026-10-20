import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
  type EmailAuditLogItem,
  INITIAL_EMAIL_AUDIT_LOGS,
  formatVietnamDateTime,
  getStoredEmailAuditLogs,
  saveStoredEmailAuditLogs,
  resetStoredEmailAuditLogs,
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

describe('TKNHTTDNB1-535 / S8-02: Thiết kế màn hình lịch sử gửi email và gửi lại (EmailAuditLogPage)', () => {
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

  describe('AC 1: Hiển thị chi tiết Nhật ký gửi email (Email Audit Log Table / Timeline)', () => {
    it('định dạng thời điểm gửi chuẩn xác theo múi giờ Việt Nam Asia/Ho_Chi_Minh (HH:mm - DD/MM/YYYY)', () => {
      // 2026-10-18T08:30:00Z -> 15:30 - 18/10/2026 tại GMT+7
      const formattedUtc = formatVietnamDateTime('2026-10-18T08:30:00Z');
      expect(formattedUtc).toBe('15:30 - 18/10/2026');

      // 2026-10-17T14:45:00Z -> 21:45 - 17/10/2026 tại GMT+7
      const formattedEvening = formatVietnamDateTime('2026-10-17T14:45:00Z');
      expect(formattedEvening).toBe('21:45 - 17/10/2026');

      // Giá trị không hợp lệ hoặc rỗng
      expect(formatVietnamDateTime('')).toBe('--:-- - --/--/----');
    });

    it('khởi tạo danh sách nhật ký chứa đầy đủ các trường thông tin cần thiết', () => {
      expect(INITIAL_EMAIL_AUDIT_LOGS.length).toBeGreaterThanOrEqual(5);

      const firstLog = INITIAL_EMAIL_AUDIT_LOGS[0];
      expect(firstLog.candidateName).toBeDefined();
      expect(firstLog.candidateEmail).toBeDefined();
      expect(firstLog.templateName).toBeDefined();
      expect(firstLog.subject).toBeDefined();
      expect(firstLog.senderName).toBeDefined();
      expect(firstLog.senderEmail).toBeDefined();
      expect(firstLog.status).toBe('SENT');
      expect(firstLog.sentAt).toBeDefined();

      const failedLog = INITIAL_EMAIL_AUDIT_LOGS.find((l) => l.status === 'FAILED');
      expect(failedLog).toBeDefined();
      expect(failedLog?.errorMessage).toBeDefined();
      expect(failedLog?.errorCode).toBeDefined();
    });

    it('hiển thị đầy đủ tiêu đề trang, bảng nhật ký và các cột thông tin chính', () => {
      const html = renderToString(
        <ToastContext.Provider value={mockToastValue}>
          <EmailAuditLogPage />
        </ToastContext.Provider>,
      );

      // Header tiêu đề trang
      expect(html).toContain('Nhật ký &amp; Lịch sử gửi email');
      expect(html).toContain('Theo dõi thời điểm gửi, mẫu thư đã dùng, trạng thái gửi');

      // Tiêu đề các cột trong bảng (AC 1)
      expect(html).toContain('Thời điểm gửi');
      expect(html).toContain('Ứng viên nhận');
      expect(html).toContain('Mẫu email đã dùng');
      expect(html).toContain('Tiêu đề thư');
      expect(html).toContain('Người gửi');
      expect(html).toContain('Trạng thái');
      expect(html).toContain('Thao tác');
    });

    it('hiển thị huy hiệu trạng thái Thành công (Sent) và Thất bại (Failed) trực quan', () => {
      const html = renderToString(
        <ToastContext.Provider value={mockToastValue}>
          <EmailAuditLogPage />
        </ToastContext.Provider>,
      );

      expect(html).toContain('Thành công (Sent)');
      expect(html).toContain('Thất bại (Failed)');
    });
  });

  describe('AC 2: Thao tác Gửi lại thư lỗi (Retry Failed Email)', () => {
    it('hiển thị nút "Gửi lại" tại dòng email có trạng thái Thất bại', () => {
      const html = renderToString(
        <ToastContext.Provider value={mockToastValue}>
          <EmailAuditLogPage />
        </ToastContext.Provider>,
      );

      expect(html).toContain('Gửi lại');
      expect(html).toContain('Gửi lại tất cả thư lỗi');
    });

    it('hỗ trợ lưu và khôi phục nhật ký từ LocalStorage', () => {
      const customLog: EmailAuditLogItem = {
        id: 'test-log-99',
        candidateId: 'cand-99',
        candidateName: 'Test Candidate',
        candidateEmail: 'candidate@test.vn',
        templateType: 'INTERVIEW_INVITATION',
        templateName: 'Thư mời phỏng vấn',
        subject: 'Thư mời phỏng vấn test',
        body: 'Nội dung test',
        senderName: 'Recruiter Admin',
        senderEmail: 'admin@test.vn',
        status: 'FAILED',
        sentAt: '2026-10-18T10:00:00Z',
        errorMessage: 'Lỗi kết nối mạng',
        retryCount: 0,
      };

      saveStoredEmailAuditLogs([customLog]);
      const stored = getStoredEmailAuditLogs();
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe('test-log-99');

      // Khôi phục mặc định
      const reset = resetStoredEmailAuditLogs();
      expect(reset.length).toBeGreaterThan(1);
    });
  });

  describe('AC 3: Trải nghiệm giao diện & Responsive (UX & UI)', () => {
    it('hiển thị 3 thẻ chỉ số thống kê KPI nhanh (Tổng số, Thành công, Thất bại)', () => {
      const html = renderToString(
        <ToastContext.Provider value={mockToastValue}>
          <EmailAuditLogPage />
        </ToastContext.Provider>,
      );

      expect(html).toContain('Tổng số email đã gửi');
      expect(html).toContain('Gửi thành công');
      expect(html).toContain('Thất bại / Cần gửi lại');
    });

    it('hiển thị bộ lọc nhanh theo 3 trạng thái: Tất cả, Thành công, Thất bại', () => {
      const html = renderToString(
        <ToastContext.Provider value={mockToastValue}>
          <EmailAuditLogPage />
        </ToastContext.Provider>,
      );

      expect(html).toContain('Tất cả (');
      expect(html).toContain('Thành công (');
      expect(html).toContain('Thất bại (');
    });

    it('hiển thị tùy chọn chuyển đổi giữa Dạng Bảng và Dòng thời gian', () => {
      const html = renderToString(
        <ToastContext.Provider value={mockToastValue}>
          <EmailAuditLogPage />
        </ToastContext.Provider>,
      );

      expect(html).toContain('Dạng Bảng');
      expect(html).toContain('Dòng thời gian');
    });

    it('hỗ trợ hiển thị dạng tab nhúng (isEmbedded = true) trong hồ sơ ứng viên', () => {
      const html = renderToString(
        <ToastContext.Provider value={mockToastValue}>
          <EmailAuditLogPage
            candidateId="sample-01"
            candidateName="Nguyễn Văn An"
            candidateEmail="an.nguyen@example.com"
            isEmbedded={true}
          />
        </ToastContext.Provider>,
      );

      // Ở chế độ nhúng, tiêu đề toàn trang ẩn đi và hiển thị thẻ thông báo đang lọc theo ứng viên
      expect(html).not.toContain('Theo dõi thời điểm gửi, mẫu thư đã dùng, trạng thái gửi');
      expect(html).toContain('Đang hiển thị lịch sử gửi email riêng cho ứng viên:');
      expect(html).toContain('Nguyễn Văn An');
      expect(html).toContain('Xem tất cả ứng viên');
    });
  });
});

