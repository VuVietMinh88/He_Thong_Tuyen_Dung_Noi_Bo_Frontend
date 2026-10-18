import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { renderToString } from 'react-dom/server';
import axiosClient from '../src/utils/axiosClient';
import emailTemplateService, {
  handleEmailTemplateError,
} from '../src/services/emailTemplateService';
import {
  DEFAULT_EMAIL_TEMPLATES,
  SAMPLE_CANDIDATES,
  getStoredEmailTemplates,
  saveStoredEmailTemplates,
  type EmailTemplateItem,
  type UpdateEmailTemplatePayload,
} from '../src/types/emailTemplate';
import { EmailTemplateManagementPage } from '../src/pages/Settings/EmailTemplateManagementPage';
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

describe('TKNHTTDNB1-530 / S8-01: Tích hợp xem trước email và bật tắt gửi tự động (emailTemplateService)', () => {
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

  describe('AC 1: API Service getEmailTemplates & getEmailTemplateById', () => {
    it('lấy danh sách toàn bộ các mẫu email thành công từ backend API', async () => {
      const mockApiTemplates: EmailTemplateItem[] = [
        {
          id: 'tpl-api-01',
          name: 'Xác nhận nộp hồ sơ tự động',
          type: 'APPLICATION_CONFIRMATION',
          stage: 'NEW',
          stageLabel: 'Hồ sơ mới / Nộp đơn',
          description: 'Tự động gửi ngay khi nhận hồ sơ',
          applicableRoles: ['ADMIN'],
          subject: 'Xác nhận hồ sơ - {TEN_UNG_VIEN}',
          body: 'Chào {TEN_UNG_VIEN}, hồ sơ ứng tuyển vị trí {VI_TRI_UNG_TUYEN} đã được tiếp nhận.',
          isAutoSend: true,
          isAutoSendEnabled: true,
          updatedAt: '2026-10-18T10:00:00Z',
          updatedBy: 'Admin',
        },
      ];

      vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: mockApiTemplates,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await emailTemplateService.getEmailTemplates();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tpl-api-01');
      expect(result[0].name).toBe('Xác nhận nộp hồ sơ tự động');

      // Đảm bảo dữ liệu đã được lưu trữ offline vào LocalStorage
      const localData = getStoredEmailTemplates();
      expect(localData).toHaveLength(1);
      expect(localData[0].id).toBe('tpl-api-01');
    });

    it('tự động fallback về LocalStorage / Mặc định khi API gặp lỗi mạng hoặc mock mode', async () => {
      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(new Error('Network error'));

      const result = await emailTemplateService.getEmailTemplates();
      expect(result).toHaveLength(DEFAULT_EMAIL_TEMPLATES.length);
      expect(result[0].id).toBe(DEFAULT_EMAIL_TEMPLATES[0].id);
    });

    it('ném EmailTemplateApiError khi API backend trả về lỗi HTTP 403 Forbidden', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 403,
          data: { message: 'Bạn không có quyền quản lý và cấu hình mẫu email tuyển dụng.' },
        },
      };
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);
      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(axiosError);

      await expect(emailTemplateService.getEmailTemplates()).rejects.toThrow(
        'Bạn không có quyền quản lý và cấu hình mẫu email tuyển dụng.',
      );
    });

    it('lấy chi tiết một mẫu email theo ID hợp lệ từ backend API', async () => {
      const mockItem: EmailTemplateItem = {
        ...DEFAULT_EMAIL_TEMPLATES[0],
        name: 'Mẫu thư lấy từ API',
      };

      vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: mockItem,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await emailTemplateService.getEmailTemplateById(DEFAULT_EMAIL_TEMPLATES[0].id);
      expect(result.name).toBe('Mẫu thư lấy từ API');
    });

    it('lấy chi tiết một mẫu email từ bộ nhớ local khi API backend lỗi', async () => {
      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(new Error('Backend offline'));

      const result = await emailTemplateService.getEmailTemplateById(DEFAULT_EMAIL_TEMPLATES[1].id);
      expect(result.id).toBe(DEFAULT_EMAIL_TEMPLATES[1].id);
      expect(result.type).toBe('INTERVIEW_INVITATION');
    });

    it('ném lỗi khi templateId để trống hoặc không tồn tại', async () => {
      await expect(emailTemplateService.getEmailTemplateById('')).rejects.toThrow(
        'Mã mẫu email không được để trống.',
      );

      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(new Error('Not found'));
      await expect(emailTemplateService.getEmailTemplateById('non-existent-id')).rejects.toThrow(
        'Không tìm thấy mẫu email với mã non-existent-id.',
      );
    });
  });

  describe('AC 2: API Service updateEmailTemplate & updateTemplateAutoSend', () => {
    it('cập nhật tiêu đề, nội dung và cấu hình gửi tự động qua API backend', async () => {
      const updatePayload: UpdateEmailTemplatePayload = {
        name: 'Thư mời phỏng vấn - Đã tùy chỉnh',
        subject: '[Cập nhật] Thư mời phỏng vấn vòng 1',
        body: 'Kính gửi {TEN_UNG_VIEN}, chúng tôi trân trọng mời bạn tham gia...',
        isAutoSend: true,
        isAutoSendEnabled: true,
      };

      const updatedResponse: EmailTemplateItem = {
        ...DEFAULT_EMAIL_TEMPLATES[1],
        ...updatePayload,
        updatedAt: '2026-10-18T10:30:00Z',
      };

      vi.spyOn(axiosClient, 'put').mockResolvedValueOnce({
        data: updatedResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const targetId = DEFAULT_EMAIL_TEMPLATES[1].id;
      const result = await emailTemplateService.updateEmailTemplate(targetId, updatePayload);

      expect(result.name).toBe('Thư mời phỏng vấn - Đã tùy chỉnh');
      expect(result.subject).toBe('[Cập nhật] Thư mời phỏng vấn vòng 1');
      expect(result.isAutoSend).toBe(true);

      // Kiểm tra bộ nhớ local được cập nhật đồng bộ
      const stored = getStoredEmailTemplates();
      const updatedInStore = stored.find((t) => t.id === targetId);
      expect(updatedInStore?.name).toBe('Thư mời phỏng vấn - Đã tùy chỉnh');
      expect(updatedInStore?.isAutoSend).toBe(true);
    });

    it('cập nhật offline-first thành công khi backend không phản hồi', async () => {
      vi.spyOn(axiosClient, 'put').mockRejectedValueOnce(new Error('Network disconnected'));

      const targetId = DEFAULT_EMAIL_TEMPLATES[2].id;
      const result = await emailTemplateService.updateEmailTemplate(targetId, {
        subject: 'Cảm ơn bạn đã tham gia phỏng vấn hôm nay',
        isAutoSend: false,
      });

      expect(result.subject).toBe('Cảm ơn bạn đã tham gia phỏng vấn hôm nay');
      expect(result.isAutoSend).toBe(false);

      const stored = getStoredEmailTemplates();
      const updatedInStore = stored.find((t) => t.id === targetId);
      expect(updatedInStore?.subject).toBe('Cảm ơn bạn đã tham gia phỏng vấn hôm nay');
      expect(updatedInStore?.isAutoSend).toBe(false);
    });

    it('bật hoặc tắt riêng biệt tính năng tự động gửi (updateTemplateAutoSend)', async () => {
      const targetId = DEFAULT_EMAIL_TEMPLATES[0].id;
      const patchedResponse: EmailTemplateItem = {
        ...DEFAULT_EMAIL_TEMPLATES[0],
        isAutoSend: false,
        isAutoSendEnabled: false,
      };

      vi.spyOn(axiosClient, 'patch').mockResolvedValueOnce({
        data: patchedResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const res = await emailTemplateService.updateTemplateAutoSend(targetId, false);
      expect(res.isAutoSend).toBe(false);

      const stored = getStoredEmailTemplates();
      expect(stored.find((t) => t.id === targetId)?.isAutoSend).toBe(false);
    });

    it('ném lỗi khi cập nhật mẫu email không tồn tại trong hệ thống', async () => {
      vi.spyOn(axiosClient, 'put').mockRejectedValueOnce(new Error('Not found'));

      await expect(
        emailTemplateService.updateEmailTemplate('id-khong-ton-tai', { subject: 'Test' }),
      ).rejects.toThrow('Không tìm thấy mẫu email với mã id-khong-ton-tai để cập nhật.');
    });
  });

  describe('AC 3: Live Preview & Thay thế biến động (previewEmailTemplate)', () => {
    it('thay thế chuẩn xác toàn bộ các biến động bằng dữ liệu ứng viên mẫu', async () => {
      const sample = SAMPLE_CANDIDATES[0]; // Nguyễn Văn An
      const previewRes = await emailTemplateService.previewEmailTemplate({
        subject: 'Chào {TEN_UNG_VIEN} ứng tuyển {VI_TRI_UNG_TUYEN}',
        body: 'Thân gửi {TEN_UNG_VIEN}, mức lương offer: {MUC_LUONG_OFFER}. Địa điểm: {DIA_DIEM_PHONG_VAN}',
        sampleCandidateId: sample.id,
      });

      expect(previewRes.renderedSubject).toBe('Chào Nguyễn Văn An ứng tuyển Senior Frontend Developer');
      expect(previewRes.renderedBody).toContain('Thân gửi Nguyễn Văn An');
      expect(previewRes.renderedBody).toContain('mức lương offer: 35.000.000 VNĐ / tháng (Gross)');
      expect(previewRes.renderedBody).toContain('Địa điểm: https://meet.google.com/abc-xyz-123');
      expect(previewRes.sampleCandidate.id).toBe(sample.id);
    });

    it('sử dụng API backend khi có templateId và fallback client-side khi backend lỗi', async () => {
      // Mock API backend trả về kết quả
      vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
        data: {
          renderedSubject: 'Nội dung tiêu đề từ backend',
          renderedBody: 'Nội dung thân thư từ backend',
          sampleCandidate: SAMPLE_CANDIDATES[1],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const resOnline = await emailTemplateService.previewEmailTemplate({
        templateId: DEFAULT_EMAIL_TEMPLATES[0].id,
        sampleCandidateId: SAMPLE_CANDIDATES[1].id,
      });
      expect(resOnline.renderedSubject).toBe('Nội dung tiêu đề từ backend');
      expect(resOnline.renderedBody).toBe('Nội dung thân thư từ backend');

      // Khi backend lỗi, tự động render client-side
      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(new Error('500 Server Error'));

      const resOffline = await emailTemplateService.previewEmailTemplate({
        templateId: DEFAULT_EMAIL_TEMPLATES[0].id,
        subject: 'Xác nhận - {TEN_UNG_VIEN}',
        body: 'Kính gửi {TEN_UNG_VIEN}, vị trí {VI_TRI_UNG_TUYEN}',
        sampleCandidateId: SAMPLE_CANDIDATES[2].id, // Lê Quốc Bảo
      });

      expect(resOffline.renderedSubject).toBe('Xác nhận - Lê Quốc Bảo');
      expect(resOffline.renderedBody).toContain('Kính gửi Lê Quốc Bảo, vị trí DevOps / Cloud Engineer');
    });

    it('khôi phục mẫu email về mặc định qua resetEmailTemplates()', async () => {
      // Thay đổi một mẫu trước
      saveStoredEmailTemplates([
        {
          ...DEFAULT_EMAIL_TEMPLATES[0],
          name: 'Tên mẫu đã bị đổi',
        },
      ]);
      expect(getStoredEmailTemplates()[0].name).toBe('Tên mẫu đã bị đổi');

      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(new Error('Reset offline'));
      const resetList = await emailTemplateService.resetEmailTemplates();

      expect(resetList).toHaveLength(5);
      expect(resetList[0].name).toBe(DEFAULT_EMAIL_TEMPLATES[0].name);
    });
  });

  describe('AC 4: Xử lý và chuyển đổi mã lỗi HTTP (handleEmailTemplateError)', () => {
    it('xử lý lỗi 400 Bad Request', () => {
      const err = {
        isAxiosError: true,
        response: { status: 400, data: {} },
      };
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const parsed = handleEmailTemplateError(err, 'Lỗi mặc định');
      expect(parsed.statusCode).toBe(400);
      expect(parsed.message).toBe('Dữ liệu cấu hình mẫu email không hợp lệ hoặc thiếu trường bắt buộc.');
    });

    it('xử lý lỗi 401 Unauthorized', () => {
      const err = {
        isAxiosError: true,
        response: { status: 401, data: {} },
      };
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const parsed = handleEmailTemplateError(err, 'Lỗi mặc định');
      expect(parsed.statusCode).toBe(401);
      expect(parsed.message).toBe('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.');
    });

    it('xử lý lỗi 403 Forbidden', () => {
      const err = {
        isAxiosError: true,
        response: { status: 403, data: {} },
      };
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const parsed = handleEmailTemplateError(err, 'Lỗi mặc định');
      expect(parsed.statusCode).toBe(403);
      expect(parsed.message).toBe('Bạn không có quyền quản lý và cấu hình mẫu email tuyển dụng.');
    });

    it('xử lý lỗi 404 Not Found', () => {
      const err = {
        isAxiosError: true,
        response: { status: 404, data: {} },
      };
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const parsed = handleEmailTemplateError(err, 'Lỗi mặc định');
      expect(parsed.statusCode).toBe(404);
      expect(parsed.message).toBe('Không tìm thấy thông tin mẫu email tương ứng trên hệ thống.');
    });

    it('xử lý lỗi 500 Server Error', () => {
      const err = {
        isAxiosError: true,
        response: { status: 500, data: {} },
      };
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const parsed = handleEmailTemplateError(err, 'Lỗi mặc định');
      expect(parsed.statusCode).toBe(500);
      expect(parsed.message).toBe('Hệ thống máy chủ gặp sự cố khi xử lý mẫu email. Vui lòng thử lại sau.');
    });

    it('xử lý lỗi mất kết nối mạng (Network Error / No Response)', () => {
      const err = {
        isAxiosError: true,
        response: undefined,
      };
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const parsed = handleEmailTemplateError(err, 'Lỗi mặc định');
      expect(parsed.message).toBe('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.');
    });

    it('ưu tiên hiển thị message từ server nếu response có trường message', () => {
      const err = {
        isAxiosError: true,
        response: {
          status: 422,
          data: { message: 'Biến {TEN_CONG_TY} không được hỗ trợ trong loại thư này.' },
        },
      };
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const parsed = handleEmailTemplateError(err, 'Lỗi mặc định');
      expect(parsed.message).toBe('Biến {TEN_CONG_TY} không được hỗ trợ trong loại thư này.');
    });
  });

  describe('AC 5: Tích hợp giao diện quản lý mẫu email (EmailTemplateManagementPage)', () => {
    it('hiển thị trực quan công tắc bật/tắt gửi tự động cho mẫu đang chọn', () => {
      const html = renderToString(
        <ToastContext.Provider value={mockToastValue}>
          <EmailTemplateManagementPage />
        </ToastContext.Provider>,
      );

      // Công tắc và nhãn điều khiển gửi tự động
      expect(html).toContain('Gửi tự động:');
      expect(html).toContain('Tự động gửi');
      expect(html).toContain('Đang bật gửi tự động');
      expect(html).toContain('Chế độ gửi thủ công');
    });

    it('hiển thị danh sách 3 ứng viên mẫu để người dùng lựa chọn Live Preview', () => {
      const html = renderToString(
        <ToastContext.Provider value={mockToastValue}>
          <EmailTemplateManagementPage />
        </ToastContext.Provider>,
      );

      SAMPLE_CANDIDATES.forEach((cand) => {
        expect(html).toContain(cand.candidateName);
      });
    });

    it('hiển thị đầy đủ thanh công cụ chèn biến động và các chip biến', () => {
      const html = renderToString(
        <ToastContext.Provider value={mockToastValue}>
          <EmailTemplateManagementPage />
        </ToastContext.Provider>,
      );

      expect(html).toContain('Thanh công cụ chèn biến động (Nhấp để chèn):');
      expect(html).toContain('{TEN_UNG_VIEN}');
      expect(html).toContain('{VI_TRI_UNG_TUYEN}');
      expect(html).toContain('{TEN_CONG_TY}');
      expect(html).toContain('{MUC_LUONG_OFFER}');
    });

    it('hiển thị khung Live Preview với nội dung đã được cá nhân hóa dữ liệu thật', () => {
      const html = renderToString(
        <ToastContext.Provider value={mockToastValue}>
          <EmailTemplateManagementPage />
        </ToastContext.Provider>,
      );

      // Ứng viên mặc định là Nguyễn Văn An
      const defaultSample = SAMPLE_CANDIDATES[0];
      expect(html).toContain(`Chào bạn ${defaultSample.candidateName}`);
      expect(html).toContain(defaultSample.jobTitle);
      expect(html).toContain(defaultSample.companyName);
    });
  });
});
