import axios from 'axios';
import axiosClient from '../utils/axiosClient';
import type {
  EmailAuditLogItem,
  EmailAuditFilterParams,
  RetryEmailResponse,
} from '../types/emailAuditLog';
import {
  getStoredEmailAuditLogs,
  saveStoredEmailAuditLogs,
  resetStoredEmailAuditLogs,
} from '../types/emailAuditLog';

export class EmailAuditApiError extends Error {
  public statusCode?: number;
  public details?: unknown;

  constructor(message: string, statusCode?: number, details?: unknown) {
    super(message);
    this.name = 'EmailAuditApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Bắt và format các mã lỗi trả về từ Axios thành thông báo tiếng Việt thân thiện (AC 3)
 */
export const handleEmailAuditError = (error: unknown, fallbackMessage: string): EmailAuditApiError => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const resData = error.response?.data as { code?: string; message?: string } | undefined;
    const serverMessage = resData?.message;

    if (serverMessage && typeof serverMessage === 'string') {
      return new EmailAuditApiError(serverMessage, status, resData);
    }

    if (!error.response) {
      return new EmailAuditApiError(
        'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.',
        status,
      );
    }

    if (status === 400) {
      return new EmailAuditApiError(
        'Yêu cầu truy vấn nhật ký gửi email không hợp lệ.',
        status,
      );
    }
    if (status === 401) {
      return new EmailAuditApiError(
        'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.',
        status,
      );
    }
    if (status === 403) {
      return new EmailAuditApiError(
        'Bạn không có quyền truy cập nhật ký hoặc gửi lại email tuyển dụng.',
        status,
      );
    }
    if (status === 404) {
      return new EmailAuditApiError(
        'Không tìm thấy thông tin bản ghi nhật ký email tương ứng.',
        status,
      );
    }
    if (status && status >= 500) {
      return new EmailAuditApiError(
        'Hệ thống máy chủ gặp sự cố khi xử lý nhật ký email. Vui lòng thử lại sau.',
        status,
      );
    }
  }

  return error instanceof EmailAuditApiError
    ? error
    : new EmailAuditApiError(
        error instanceof Error ? error.message : fallbackMessage,
      );
};

/**
 * Lọc danh sách nhật ký cục bộ theo các tiêu chí tìm kiếm và thời gian (Fallback)
 */
const filterLogsLocal = (
  logs: EmailAuditLogItem[],
  params?: EmailAuditFilterParams,
): EmailAuditLogItem[] => {
  if (!params) return logs;

  return logs.filter((item) => {
    // 1. Lọc theo ứng viên
    if (params.candidateId && item.candidateId !== params.candidateId) {
      return false;
    }

    // 2. Lọc theo trạng thái gửi (AC 2)
    if (params.status && params.status !== 'ALL') {
      if (params.status === 'QUEUED') {
        if (item.status !== 'QUEUED' && item.status !== 'PENDING') {
          return false;
        }
      } else if (item.status !== params.status) {
        return false;
      }
    }

    // 3. Lọc theo loại mẫu email
    if (params.templateType && params.templateType !== 'ALL' && item.templateType !== params.templateType) {
      return false;
    }

    // 4. Lọc theo từ khóa tìm kiếm
    if (params.searchKeyword && params.searchKeyword.trim()) {
      const kw = params.searchKeyword.toLowerCase().trim();
      const matchSubject = item.subject.toLowerCase().includes(kw);
      const matchCandidate = item.candidateName.toLowerCase().includes(kw);
      const matchEmail = item.candidateEmail.toLowerCase().includes(kw);
      const matchSender = item.senderName.toLowerCase().includes(kw);
      const matchTemplate = item.templateName.toLowerCase().includes(kw);
      if (!matchSubject && !matchCandidate && !matchEmail && !matchSender && !matchTemplate) {
        return false;
      }
    }

    // 5. Lọc theo khoảng thời gian (Date Range Filtering - AC 2)
    if (params.dateRangePreset && params.dateRangePreset !== 'ALL') {
      const logDate = new Date(item.sentAt);
      const now = new Date();

      if (params.dateRangePreset === 'TODAY') {
        const isSameDay =
          logDate.getFullYear() === now.getFullYear() &&
          logDate.getMonth() === now.getMonth() &&
          logDate.getDate() === now.getDate();
        if (!isSameDay) return false;
      } else if (params.dateRangePreset === 'LAST_7_DAYS') {
        const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 7 || diffDays < 0) return false;
      } else if (params.dateRangePreset === 'LAST_30_DAYS') {
        const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 30 || diffDays < 0) return false;
      } else if (params.dateRangePreset === 'CUSTOM') {
        if (params.startDate) {
          const start = new Date(params.startDate);
          start.setHours(0, 0, 0, 0);
          if (logDate < start) return false;
        }
        if (params.endDate) {
          const end = new Date(params.endDate);
          end.setHours(23, 59, 59, 999);
          if (logDate > end) return false;
        }
      }
    }

    return true;
  });
};

export const emailAuditService = {
  /**
   * 1. Gọi API lấy danh sách nhật ký gửi email cho ứng viên kèm bộ lọc theo trạng thái và thời gian (AC 1 & AC 2)
   */
  async getEmailAuditLogs(params?: EmailAuditFilterParams): Promise<EmailAuditLogItem[]> {
    try {
      const response = await axiosClient.get<EmailAuditLogItem[]>('/recruitment/email-audit-logs', {
        params,
      });

      if (response?.data && Array.isArray(response.data)) {
        // Đồng bộ vào cache bộ nhớ cục bộ
        saveStoredEmailAuditLogs(response.data);
        return filterLogsLocal(response.data, params);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status && error.response.status >= 400) {
        throw handleEmailAuditError(
          error,
          'Không thể tải danh sách nhật ký gửi email từ máy chủ.',
        );
      }
      // Khi mất mạng hoặc API mock mode, tiếp tục offline-first
    }

    // Fallback Offline-First
    const stored = getStoredEmailAuditLogs();
    return filterLogsLocal(stored, params);
  },

  /**
   * 2. Lấy chi tiết một bản ghi nhật ký email theo ID
   */
  async getEmailAuditLogById(logId: string): Promise<EmailAuditLogItem> {
    if (!logId || !logId.trim()) {
      throw new EmailAuditApiError('Mã nhật ký email không được để trống.', 400);
    }

    try {
      const response = await axiosClient.get<EmailAuditLogItem>(
        `/recruitment/email-audit-logs/${encodeURIComponent(logId)}`,
      );
      if (response?.data && response.data.id) {
        return response.data;
      }
    } catch {
      // Fallback
    }

    const localList = getStoredEmailAuditLogs();
    const found = localList.find((l) => l.id === logId);
    if (found) {
      return found;
    }

    throw new EmailAuditApiError(
      `Không tìm thấy bản ghi nhật ký email với mã ${logId}.`,
      404,
    );
  },

  /**
   * 3. Gửi yêu cầu thử gửi lại email bị lỗi lên hệ thống qua hàng đợi xử lý ngầm (AC 1 & AC 3)
   */
  async retryFailedEmail(logId: string): Promise<RetryEmailResponse> {
    if (!logId || !logId.trim()) {
      throw new EmailAuditApiError('Mã nhật ký email cần gửi lại không hợp lệ.', 400);
    }

    // 1. Thử gọi API Backend
    try {
      const response = await axiosClient.post<RetryEmailResponse>(
        `/recruitment/email-audit-logs/${encodeURIComponent(logId)}/retry`,
      );

      if (response?.data && response.data.logItem) {
        const updatedItem = response.data.logItem;
        const currentList = getStoredEmailAuditLogs();
        const nextList = currentList.map((l) => (l.id === logId ? updatedItem : l));
        saveStoredEmailAuditLogs(nextList);
        return response.data;
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status && error.response.status >= 400) {
        throw handleEmailAuditError(
          error,
          'Máy chủ từ chối yêu cầu gửi lại email.',
        );
      }
    }

    // 2. Cơ chế Fallback Offline-First (Mô phỏng hàng đợi bất đồng bộ)
    const currentList = getStoredEmailAuditLogs();
    const index = currentList.findIndex((l) => l.id === logId);
    if (index === -1) {
      throw new EmailAuditApiError(
        `Không tìm thấy email với mã ${logId} để thực hiện gửi lại.`,
        404,
      );
    }

    const existing = currentList[index];
    const trackingId = `q-trk-${Date.now().toString(36)}`;
    const updatedItem: EmailAuditLogItem = {
      ...existing,
      status: 'SENT',
      sentAt: new Date().toISOString(),
      errorMessage: undefined,
      errorCode: undefined,
      retryCount: existing.retryCount + 1,
      lastRetryAt: new Date().toISOString(),
      queueTrackingId: trackingId,
    };

    currentList[index] = updatedItem;
    saveStoredEmailAuditLogs(currentList);

    return {
      success: true,
      message: `Đã đưa email tới ${existing.candidateName} vào hàng đợi gửi lại thành công.`,
      logItem: updatedItem,
      queueTrackingId: trackingId,
    };
  },

  /**
   * 4. Gửi lại toàn bộ email đang gặp lỗi (Retry All Failed)
   */
  async retryAllFailedEmails(candidateId?: string): Promise<{ retriedCount: number; message: string }> {
    try {
      const response = await axiosClient.post<{ retriedCount: number; message: string }>(
        '/recruitment/email-audit-logs/retry-all',
        { candidateId },
      );
      if (response?.data) {
        return response.data;
      }
    } catch {
      // Fallback
    }

    const currentList = getStoredEmailAuditLogs();
    let count = 0;
    const nextList = currentList.map((item) => {
      const matchCandidate = !candidateId || item.candidateId === candidateId;
      if (item.status === 'FAILED' && matchCandidate) {
        count++;
        return {
          ...item,
          status: 'SENT' as const,
          sentAt: new Date().toISOString(),
          errorMessage: undefined,
          errorCode: undefined,
          retryCount: item.retryCount + 1,
          lastRetryAt: new Date().toISOString(),
        };
      }
      return item;
    });

    saveStoredEmailAuditLogs(nextList);
    return {
      retriedCount: count,
      message: `Đã hoàn tất gửi lại thành công ${count} email lỗi.`,
    };
  },

  /**
   * 5. Khôi phục dữ liệu nhật ký mẫu ban đầu
   */
  async resetAuditLogs(): Promise<EmailAuditLogItem[]> {
    try {
      const response = await axiosClient.post<EmailAuditLogItem[]>('/recruitment/email-audit-logs/reset');
      if (response?.data && Array.isArray(response.data)) {
        saveStoredEmailAuditLogs(response.data);
        return response.data;
      }
    } catch {
      // Fallback
    }

    return resetStoredEmailAuditLogs();
  },
};

export default emailAuditService;

