import axios from 'axios';
import axiosClient from '../utils/axiosClient';
import type {
  EmailTemplateItem,
  UpdateEmailTemplatePayload,
  EmailTemplatePreviewRequest,
  EmailTemplatePreviewResponse,
  SampleCandidateData,
} from '../types/emailTemplate';
import {
  SAMPLE_CANDIDATES,
  renderEmailTemplateWithData,
  getStoredEmailTemplates,
  saveStoredEmailTemplates,
  resetStoredEmailTemplates,
} from '../types/emailTemplate';

export class EmailTemplateApiError extends Error {
  public statusCode?: number;
  public details?: unknown;

  constructor(message: string, statusCode?: number, details?: unknown) {
    super(message);
    this.name = 'EmailTemplateApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Bắt và format các mã lỗi trả về từ Axios thành thông báo tiếng Việt thân thiện (AC 3)
 */
export const handleEmailTemplateError = (error: unknown, fallbackMessage: string): EmailTemplateApiError => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const resData = error.response?.data as { code?: string; message?: string } | undefined;
    const serverMessage = resData?.message;

    if (serverMessage && typeof serverMessage === 'string') {
      return new EmailTemplateApiError(serverMessage, status, resData);
    }

    if (!error.response) {
      return new EmailTemplateApiError(
        'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.',
        status,
      );
    }

    if (status === 400) {
      return new EmailTemplateApiError(
        'Dữ liệu cấu hình mẫu email không hợp lệ hoặc thiếu trường bắt buộc.',
        status,
      );
    }
    if (status === 401) {
      return new EmailTemplateApiError(
        'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.',
        status,
      );
    }
    if (status === 403) {
      return new EmailTemplateApiError(
        'Bạn không có quyền quản lý và cấu hình mẫu email tuyển dụng.',
        status,
      );
    }
    if (status === 404) {
      return new EmailTemplateApiError(
        'Không tìm thấy thông tin mẫu email tương ứng trên hệ thống.',
        status,
      );
    }
    if (status && status >= 500) {
      return new EmailTemplateApiError(
        'Hệ thống máy chủ gặp sự cố khi xử lý mẫu email. Vui lòng thử lại sau.',
        status,
      );
    }
  }

  return error instanceof EmailTemplateApiError
    ? error
    : new EmailTemplateApiError(
        error instanceof Error ? error.message : fallbackMessage,
      );
};

export const emailTemplateService = {
  /**
   * 1. Gọi API lấy danh sách toàn bộ các mẫu email theo từng giai đoạn (AC 1)
   */
  async getEmailTemplates(): Promise<EmailTemplateItem[]> {
    try {
      const response = await axiosClient.get<EmailTemplateItem[]>('/recruitment/email-templates');
      if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
        saveStoredEmailTemplates(response.data);
        return response.data;
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status && error.response.status >= 400) {
        throw handleEmailTemplateError(
          error,
          'Không thể tải danh sách mẫu email từ máy chủ.',
        );
      }
      // Khi mất mạng hoặc backend mock mode, tiếp tục offline-first
    }

    return getStoredEmailTemplates();
  },

  /**
   * 2. Lấy chi tiết một mẫu email theo ID (AC 1)
   */
  async getEmailTemplateById(templateId: string): Promise<EmailTemplateItem> {
    if (!templateId || !templateId.trim()) {
      throw new EmailTemplateApiError('Mã mẫu email không được để trống.', 400);
    }

    try {
      const response = await axiosClient.get<EmailTemplateItem>(
        `/recruitment/email-templates/${encodeURIComponent(templateId)}`,
      );
      if (response?.data && response.data.id) {
        return response.data;
      }
    } catch {
      // Fallback
    }

    const localList = getStoredEmailTemplates();
    const found = localList.find((t) => t.id === templateId);
    if (found) {
      return found;
    }

    throw new EmailTemplateApiError(
      `Không tìm thấy mẫu email với mã ${templateId}.`,
      404,
    );
  },

  /**
   * 3. Cập nhật tiêu đề, nội dung và cấu hình gửi tự động của mẫu email (AC 1 & AC 2)
   */
  async updateEmailTemplate(
    templateId: string,
    payload: UpdateEmailTemplatePayload,
  ): Promise<EmailTemplateItem> {
    if (!templateId || !templateId.trim()) {
      throw new EmailTemplateApiError('Mã mẫu email không được để trống.', 400);
    }

    const autoSendVal =
      payload.isAutoSendEnabled !== undefined
        ? payload.isAutoSendEnabled
        : payload.isAutoSend;

    // 1. Thử gọi API Backend
    try {
      const response = await axiosClient.put<EmailTemplateItem>(
        `/recruitment/email-templates/${encodeURIComponent(templateId)}`,
        {
          ...payload,
          isAutoSend: autoSendVal,
          isAutoSendEnabled: autoSendVal,
        },
      );

      if (response?.data && response.data.id) {
        const updatedItem = response.data;
        const currentList = getStoredEmailTemplates();
        const nextList = currentList.map((t) => (t.id === templateId ? updatedItem : t));
        saveStoredEmailTemplates(nextList);
        return updatedItem;
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status && error.response.status >= 400) {
        throw handleEmailTemplateError(
          error,
          'Không thể cập nhật cấu hình mẫu email trên máy chủ.',
        );
      }
    }

    // 2. Cơ chế Fallback Offline-First
    const currentList = getStoredEmailTemplates();
    const index = currentList.findIndex((t) => t.id === templateId);
    if (index === -1) {
      throw new EmailTemplateApiError(
        `Không tìm thấy mẫu email với mã ${templateId} để cập nhật.`,
        404,
      );
    }

    const existing = currentList[index];
    const updatedItem: EmailTemplateItem = {
      ...existing,
      name: payload.name !== undefined ? payload.name.trim() : existing.name,
      subject: payload.subject !== undefined ? payload.subject : existing.subject,
      body: payload.body !== undefined ? payload.body : existing.body,
      isAutoSend: autoSendVal !== undefined ? autoSendVal : existing.isAutoSend,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Trưởng phòng Nhân sự / Quản trị viên',
    };

    currentList[index] = updatedItem;
    saveStoredEmailTemplates(currentList);
    return updatedItem;
  },

  /**
   * 4. Bật hoặc tắt tùy chọn gửi tự động riêng biệt cho từng mẫu email (AC 2 & AC 3)
   */
  async updateTemplateAutoSend(
    templateId: string,
    isAutoSend: boolean,
  ): Promise<EmailTemplateItem> {
    if (!templateId || !templateId.trim()) {
      throw new EmailTemplateApiError('Mã mẫu email không được để trống.', 400);
    }

    try {
      const response = await axiosClient.patch<EmailTemplateItem>(
        `/recruitment/email-templates/${encodeURIComponent(templateId)}/auto-send`,
        { isAutoSend, isAutoSendEnabled: isAutoSend },
      );

      if (response?.data && response.data.id) {
        const updated = response.data;
        const currentList = getStoredEmailTemplates();
        saveStoredEmailTemplates(
          currentList.map((t) => (t.id === templateId ? updated : t)),
        );
        return updated;
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status && error.response.status >= 400) {
        throw handleEmailTemplateError(
          error,
          'Không thể cập nhật tùy chọn gửi tự động.',
        );
      }
    }

    // Fallback Offline-First
    return this.updateEmailTemplate(templateId, { isAutoSend });
  },

  /**
   * 5. Lấy dữ liệu xem trước email được thay thế biến động bằng dữ liệu thật (AC 1 & AC 2)
   */
  async previewEmailTemplate(
    request: EmailTemplatePreviewRequest,
  ): Promise<EmailTemplatePreviewResponse> {
    // Xác định dữ liệu ứng viên mẫu
    let sampleCandidate: SampleCandidateData = SAMPLE_CANDIDATES[0];
    if (request.sampleData) {
      sampleCandidate = request.sampleData;
    } else if (request.sampleCandidateId) {
      const matched = SAMPLE_CANDIDATES.find((c) => c.id === request.sampleCandidateId);
      if (matched) sampleCandidate = matched;
    }

    // 1. Thử gọi API Backend nếu có templateId
    if (request.templateId) {
      try {
        const response = await axiosClient.post<EmailTemplatePreviewResponse>(
          `/recruitment/email-templates/${encodeURIComponent(request.templateId)}/preview`,
          {
            subject: request.subject,
            body: request.body,
            sampleCandidateId: sampleCandidate.id,
          },
        );

        if (response?.data && response.data.renderedSubject && response.data.renderedBody) {
          return response.data;
        }
      } catch {
        // Fallback sang xử lý client-side
      }
    }

    // 2. Client-side resolution fallback
    let subjectToRender = request.subject ?? '';
    let bodyToRender = request.body ?? '';

    // Nếu không truyền subject/body, tra cứu theo templateId
    if (!subjectToRender && !bodyToRender && request.templateId) {
      const allTemplates = getStoredEmailTemplates();
      const tpl = allTemplates.find((t) => t.id === request.templateId);
      if (tpl) {
        subjectToRender = tpl.subject;
        bodyToRender = tpl.body;
      }
    }

    const renderedSubject = renderEmailTemplateWithData(subjectToRender, sampleCandidate);
    const renderedBody = renderEmailTemplateWithData(bodyToRender, sampleCandidate);

    return {
      renderedSubject,
      renderedBody,
      sampleCandidate,
    };
  },

  /**
   * 6. Khôi phục các mẫu email về thiết lập mặc định của hệ thống
   */
  async resetEmailTemplates(): Promise<EmailTemplateItem[]> {
    try {
      const response = await axiosClient.post<EmailTemplateItem[]>('/recruitment/email-templates/reset');
      if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
        saveStoredEmailTemplates(response.data);
        return response.data;
      }
    } catch {
      // Fallback
    }

    return resetStoredEmailTemplates();
  },
};

export default emailTemplateService;
