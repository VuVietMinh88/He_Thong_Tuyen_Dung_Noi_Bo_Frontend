import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
  DEFAULT_EMAIL_TEMPLATES,
  AVAILABLE_EMAIL_VARIABLES,
  SAMPLE_CANDIDATES,
  renderEmailTemplateWithData,
  getStoredEmailTemplates,
  saveStoredEmailTemplates,
  resetStoredEmailTemplates,
  type EmailTemplateItem,
} from '../src/types/emailTemplate';
import { EmailTemplateManagementPage } from '../src/pages/Settings/EmailTemplateManagementPage';
import { ToastContext } from '../src/components/notifications/ToastContext';

const mockToastValue = {
  notify: vi.fn(),
  addToast: vi.fn(),
  removeToast: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
};

const storage = new Map<string, string>();

describe('TKNHTTDNB1-529 / S8-01: Quản lý mẫu email tuyển dụng theo giai đoạn (EmailTemplateManagementPage)', () => {
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

  describe('AC 1: Quản lý đa dạng mẫu email theo giai đoạn (Stage-based Email Templates)', () => {
    it('cung cấp đầy đủ 5 mẫu email chuẩn mực tương ứng với các giai đoạn cốt lõi của tuyển dụng', () => {
      expect(DEFAULT_EMAIL_TEMPLATES).toHaveLength(5);

      // 1. Xác nhận đã nhận hồ sơ
      const confirmationTpl = DEFAULT_EMAIL_TEMPLATES.find(
        (t) => t.type === 'APPLICATION_CONFIRMATION',
      );
      expect(confirmationTpl).toBeDefined();
      expect(confirmationTpl?.name).toBe('Xác nhận tiếp nhận hồ sơ ứng tuyển');
      expect(confirmationTpl?.stage).toBe('NEW');
      expect(confirmationTpl?.body).toContain('{TEN_UNG_VIEN}');
      expect(confirmationTpl?.body).toContain('{VI_TRI_UNG_TUYEN}');

      // 2. Thư mời phỏng vấn
      const invitationTpl = DEFAULT_EMAIL_TEMPLATES.find(
        (t) => t.type === 'INTERVIEW_INVITATION',
      );
      expect(invitationTpl).toBeDefined();
      expect(invitationTpl?.name).toBe('Thư mời tham gia phỏng vấn');
      expect(invitationTpl?.stage).toBe('INTERVIEWING');
      expect(invitationTpl?.body).toContain('{THOI_GIAN_PHONG_VAN}');
      expect(invitationTpl?.body).toContain('{DIA_DIEM_PHONG_VAN}');

      // 3. Cảm ơn sau phỏng vấn
      const thankYouTpl = DEFAULT_EMAIL_TEMPLATES.find(
        (t) => t.type === 'POST_INTERVIEW_THANK_YOU',
      );
      expect(thankYouTpl).toBeDefined();
      expect(thankYouTpl?.name).toBe('Thư cảm ơn sau buổi phỏng vấn');
      expect(thankYouTpl?.stage).toBe('INTERVIEWING');

      // 4. Thư từ chối
      const rejectionTpl = DEFAULT_EMAIL_TEMPLATES.find((t) => t.type === 'REJECTION');
      expect(rejectionTpl).toBeDefined();
      expect(rejectionTpl?.name).toBe('Thư từ chối ứng viên lịch sự & Chuyên nghiệp');
      expect(rejectionTpl?.stage).toBe('REJECTED');
      expect(rejectionTpl?.body).toContain('Hệ thống Dữ liệu Nhân tài (Talent Pool)');

      // 5. Thư đề xuất công việc (Job Offer)
      const offerTpl = DEFAULT_EMAIL_TEMPLATES.find((t) => t.type === 'OFFER_LETTER');
      expect(offerTpl).toBeDefined();
      expect(offerTpl?.name).toBe('Thư mời nhận việc & Đề xuất công việc (Job Offer)');
      expect(offerTpl?.stage).toBe('OFFER');
      expect(offerTpl?.body).toContain('{MUC_LUONG_OFFER}');
      expect(offerTpl?.body).toContain('{NGAY_BAT_DAU}');
      expect(offerTpl?.body).toContain('{HAN_PHAN_HOI}');
    });

    it('hiển thị đầy đủ tiêu đề trang, bộ lọc giai đoạn và danh sách các thẻ mẫu thư', () => {
      const html = renderToString(
        <ToastContext.Provider value={mockToastValue}>
          <EmailTemplateManagementPage />
        </ToastContext.Provider>,
      );

      // Tiêu đề trang
      expect(html).toContain('Quản lý mẫu email tuyển dụng');
      expect(html).toContain(
        'Cấu hình mẫu email tự động theo từng giai đoạn, chèn biến động và xem trước với dữ liệu thật',
      );

      // Bộ lọc giai đoạn
      expect(html).toContain('Tất cả giai đoạn');
      expect(html).toContain('Hồ sơ mới');
      expect(html).toContain('Phỏng vấn');
      expect(html).toContain('Đề xuất việc (Offer)');
      expect(html).toContain('Từ chối');

      // Danh sách các mẫu email
      expect(html).toContain('Xác nhận tiếp nhận hồ sơ ứng tuyển');
      expect(html).toContain('Thư mời tham gia phỏng vấn');
      expect(html).toContain('Thư cảm ơn sau buổi phỏng vấn');
      expect(html).toContain('Thư từ chối ứng viên lịch sự &amp; Chuyên nghiệp');
      expect(html).toContain('Thư mời nhận việc &amp; Đề xuất công việc (Job Offer)');
    });
  });

  describe('AC 2: Hệ thống chèn biến linh hoạt & Xem trước dữ liệu thật (Dynamic Variables & Live Preview)', () => {
    it('cung cấp danh sách các biến động đa dạng phân loại theo các nhóm nghiệp vụ', () => {
      expect(AVAILABLE_EMAIL_VARIABLES.length).toBeGreaterThanOrEqual(12);

      const keys = AVAILABLE_EMAIL_VARIABLES.map((v) => v.key);
      expect(keys).toContain('{TEN_UNG_VIEN}');
      expect(keys).toContain('{EMAIL_UNG_VIEN}');
      expect(keys).toContain('{VI_TRI_UNG_TUYEN}');
      expect(keys).toContain('{PHONG_BAN}');
      expect(keys).toContain('{TEN_CONG_TY}');
      expect(keys).toContain('{THOI_GIAN_PHONG_VAN}');
      expect(keys).toContain('{DIA_DIEM_PHONG_VAN}');
      expect(keys).toContain('{MUC_LUONG_OFFER}');
      expect(keys).toContain('{NGAY_BAT_DAU}');
      expect(keys).toContain('{HAN_PHAN_HOI}');
      expect(keys).toContain('{NGUOI_LIEN_HE}');
    });

    it('hàm renderEmailTemplateWithData thay thế chính xác toàn bộ biến động bằng dữ liệu mẫu thật của ứng viên', () => {
      const sample = SAMPLE_CANDIDATES[0];
      const templateSubject =
        '[{TEN_CONG_TY}] Chúc mừng bạn {TEN_UNG_VIEN} ứng tuyển {VI_TRI_UNG_TUYEN}';
      const templateBody =
        'Chào {TEN_UNG_VIEN},\nLịch hẹn vào {THOI_GIAN_PHONG_VAN} tại {DIA_DIEM_PHONG_VAN}. Mức lương đề xuất {MUC_LUONG_OFFER}.\nTrân trọng,\n{NGUOI_LIEN_HE}.';

      const renderedSubject = renderEmailTemplateWithData(templateSubject, sample);
      const renderedBody = renderEmailTemplateWithData(templateBody, sample);

      expect(renderedSubject).toContain(sample.companyName);
      expect(renderedSubject).toContain(sample.candidateName);
      expect(renderedSubject).toContain(sample.jobTitle);

      expect(renderedBody).toContain(sample.candidateName);
      expect(renderedBody).toContain(sample.interviewTime);
      expect(renderedBody).toContain(sample.interviewLocation);
      expect(renderedBody).toContain(sample.offerSalary);
      expect(renderedBody).toContain(sample.recruiterName);

      // Đảm bảo không còn biến thô chưa thay thế
      expect(renderedSubject).not.toContain('{');
      expect(renderedBody).not.toContain('{');
    });

    it('hiển thị thanh công cụ chèn biến động và khung xem trước Live Preview trong giao diện', () => {
      const html = renderToString(
        <ToastContext.Provider value={mockToastValue}>
          <EmailTemplateManagementPage />
        </ToastContext.Provider>,
      );

      // Thanh công cụ chèn biến
      expect(html).toContain('Thanh công cụ chèn biến động (Nhấp để chèn):');
      expect(html).toContain('{TEN_UNG_VIEN}');
      expect(html).toContain('{VI_TRI_UNG_TUYEN}');
      expect(html).toContain('{THOI_GIAN_PHONG_VAN}');

      // Khung Live Preview
      expect(html).toContain('Xem trước bản nháp với dữ liệu thật (Live Preview)');
      expect(html).toContain('Dữ liệu mẫu:');
      expect(html).toContain('Nguyễn Văn An - Senior Frontend Developer');
      expect(html).toContain('Xem trước thực tế');
      expect(html).toContain('Người gửi:');
      expect(html).toContain('Người nhận:');
    });
  });

  describe('AC 3: Bật/Tắt gửi tự động & Trải nghiệm giao diện (Toggle Auto-sending & Storage)', () => {
    it('hiển thị công tắc Toggle Switch và thống kê số lượng mẫu tự động gửi', () => {
      const html = renderToString(
        <ToastContext.Provider value={mockToastValue}>
          <EmailTemplateManagementPage />
        </ToastContext.Provider>,
      );

      // Thẻ thống kê
      expect(html).toContain('Tổng số mẫu email');
      expect(html).toContain('Đang bật gửi tự động');
      expect(html).toContain('Chế độ gửi thủ công');

      // Nhãn trạng thái tự động gửi
      expect(html).toContain('Tự động gửi');
      expect(html).toContain('Gửi thủ công');
    });

    it('lưu trữ và tải cấu hình mẫu email qua LocalStorage (saveStoredEmailTemplates & getStoredEmailTemplates)', () => {
      const customTemplates: EmailTemplateItem[] = [
        {
          ...DEFAULT_EMAIL_TEMPLATES[0],
          subject: 'Tiêu đề tùy chỉnh đã lưu',
          isAutoSend: false,
        },
      ];

      saveStoredEmailTemplates(customTemplates);

      const loaded = getStoredEmailTemplates();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].subject).toBe('Tiêu đề tùy chỉnh đã lưu');
      expect(loaded[0].isAutoSend).toBe(false);
    });

    it('hỗ trợ khôi phục về các mẫu mặc định qua resetStoredEmailTemplates', () => {
      const modifiedTemplates: EmailTemplateItem[] = [
        {
          ...DEFAULT_EMAIL_TEMPLATES[0],
          name: 'Tên mẫu bị sửa đổi',
        },
      ];

      saveStoredEmailTemplates(modifiedTemplates);
      expect(getStoredEmailTemplates()[0].name).toBe('Tên mẫu bị sửa đổi');

      // Khôi phục
      const restored = resetStoredEmailTemplates();
      expect(restored).toHaveLength(5);
      expect(restored[0].name).toBe('Xác nhận tiếp nhận hồ sơ ứng tuyển');

      const afterReset = getStoredEmailTemplates();
      expect(afterReset[0].name).toBe('Xác nhận tiếp nhận hồ sơ ứng tuyển');
    });
  });
});
