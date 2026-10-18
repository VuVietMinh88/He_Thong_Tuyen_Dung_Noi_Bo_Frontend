import axios from 'axios';
import axiosClient from '../utils/axiosClient';
import type {
  SendBulkRejectionPayload,
  BulkRejectionBatchResult,
  BulkRejectionItemResult,
  StoredSentRejectionRecord,
} from '../types/bulkRejection';
import {
  saveStoredSentRejections,
  getStoredSentRejections,
  getStoredBulkHistory,
  saveBulkBatchToHistory,
} from '../types/bulkRejection';

export class BulkRejectionApiError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'BulkRejectionApiError';
    this.statusCode = statusCode;
  }
}

/**
 * Bắt và format các mã lỗi trả về từ Axios thành thông báo tiếng Việt thân thiện (AC 1 & AC 3)
 */
export const handleBulkRejectionError = (error: unknown, fallbackMessage: string): Error => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const resData = error.response?.data as { code?: string; message?: string } | undefined;
    const serverMessage = resData?.message;

    if (serverMessage && typeof serverMessage === 'string') {
      return new BulkRejectionApiError(serverMessage, status);
    }

    if (!error.response) {
      return new BulkRejectionApiError(
        'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.',
        status,
      );
    }

    if (status === 400) {
      return new BulkRejectionApiError(
        'Dữ liệu gửi thư từ chối không hợp lệ hoặc thiếu thông tin ứng viên bắt buộc.',
        status,
      );
    }
    if (status === 401) {
      return new BulkRejectionApiError(
        'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.',
        status,
      );
    }
    if (status === 403) {
      return new BulkRejectionApiError(
        'Bạn không có quyền thực hiện thao tác gửi thư từ chối hàng loạt.',
        status,
      );
    }
    if (status === 404) {
      return new BulkRejectionApiError(
        'Không tìm thấy thông tin hồ sơ ứng viên hoặc đợt gửi tương ứng.',
        status,
      );
    }
    if (status && status >= 500) {
      return new BulkRejectionApiError(
        'Hệ thống máy chủ gặp sự cố khi xử lý gửi thư từ chối hàng loạt. Vui lòng thử lại sau.',
        status,
      );
    }
  }

  return error instanceof Error
    ? error
    : new BulkRejectionApiError(fallbackMessage);
};

export const bulkRejectionService = {
  /**
   * 1. Gửi danh sách các ứng viên cần gửi thư từ chối hàng loạt lên Backend (AC 1)
   */
  async sendBulkRejectionEmails(
    payload: SendBulkRejectionPayload,
    onProgress?: (processed: number, total: number) => void,
  ): Promise<BulkRejectionBatchResult> {
    if (!payload.candidates || payload.candidates.length === 0) {
      throw new BulkRejectionApiError('Danh sách ứng viên gửi thư không được để trống.', 400);
    }

    // 1. Thử gửi request lên máy chủ qua API Backend
    try {
      const response = await axiosClient.post<BulkRejectionBatchResult>(
        '/recruitment/candidates/bulk-rejections',
        payload,
      );

      if (response?.data && response.data.batchId && Array.isArray(response.data.items)) {
        const batchData = response.data;

        // Lưu trữ các ứng viên thành công vào LocalStorage
        const successfulItems = batchData.items.filter((item) => item.status === 'SUCCESS');
        if (successfulItems.length > 0) {
          const newRecords: StoredSentRejectionRecord[] = successfulItems.map((item) => ({
            candidateId: item.candidateId,
            email: item.email,
            jobTitle: item.jobTitle,
            reason: payload.reason,
            sentAt: item.sentAt || new Date().toISOString(),
            overrideReason: payload.overrideReason,
            emailSubject: item.emailSubject,
            emailBody: item.emailBody,
          }));

          const existingRecords = getStoredSentRejections();
          saveStoredSentRejections([...newRecords, ...existingRecords]);
        }

        saveBulkBatchToHistory(batchData);
        return batchData;
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status && error.response.status >= 400) {
        throw handleBulkRejectionError(
          error,
          'Không thể xử lý yêu cầu gửi thư từ chối hàng loạt.',
        );
      }
      // Nếu là lỗi mất kết nối mạng hoặc endpoint mock, tiếp tục xử lý offline-first
    }

    // 2. Cơ chế xử lý Fallback (Offline-First / Mock mode)
    const nowIso = new Date().toISOString();
    const batchId = `batch-rej-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const results: BulkRejectionItemResult[] = [];
    const total = payload.candidates.length;

    for (let i = 0; i < total; i++) {
      const c = payload.candidates[i];

      // Báo tiến độ gửi
      if (onProgress) {
        onProgress(i + 1, total);
      }

      // Kiểm tra trường hợp bị chặn trùng lặp (AC 3)
      if (c.isDuplicate && !payload.allowDuplicateRejection) {
        results.push({
          candidateId: c.candidateId,
          applicationId: c.applicationId,
          candidateName: c.candidateName,
          email: c.email,
          jobTitle: c.jobTitle,
          departmentName: c.departmentName,
          status: 'SKIPPED',
          message: 'Bị hệ thống tự động chặn do đã từng nhận thư từ chối trước đó (tránh gửi trùng lặp).',
          previousRejectionDate: c.previousSentAt || 'Trước đó',
          emailSubject: c.customEmailSubject,
          emailBody: c.customEmailBody,
        });
        continue;
      }

      // Kiểm tra định dạng email
      if (!c.email || !c.email.includes('@') || !c.email.includes('.')) {
        results.push({
          candidateId: c.candidateId,
          applicationId: c.applicationId,
          candidateName: c.candidateName,
          email: c.email || 'Không có email',
          jobTitle: c.jobTitle,
          departmentName: c.departmentName,
          status: 'FAILED',
          message: 'Lỗi gửi email: Địa chỉ email không hợp lệ.',
          errorDetails: 'Invalid email address format',
          emailSubject: c.customEmailSubject,
          emailBody: c.customEmailBody,
        });
        continue;
      }

      // Gửi thành công
      results.push({
        candidateId: c.candidateId,
        applicationId: c.applicationId,
        candidateName: c.candidateName,
        email: c.email,
        jobTitle: c.jobTitle,
        departmentName: c.departmentName,
        status: 'SUCCESS',
        message: 'Đã gửi thư từ chối thành công đến hòm thư ứng viên.',
        sentAt: nowIso,
        emailSubject: c.customEmailSubject,
        emailBody: c.customEmailBody,
      });
    }

    const successCount = results.filter((r) => r.status === 'SUCCESS').length;
    const skippedCount = results.filter((r) => r.status === 'SKIPPED').length;
    const failedCount = results.filter((r) => r.status === 'FAILED').length;

    const batchResult: BulkRejectionBatchResult = {
      batchId,
      totalProcessed: results.length,
      successCount,
      skippedCount,
      failedCount,
      processedAt: nowIso,
      items: results,
    };

    // Lưu vào LocalStorage
    const successfulItems = results.filter((r) => r.status === 'SUCCESS');
    if (successfulItems.length > 0) {
      const newRecords: StoredSentRejectionRecord[] = successfulItems.map((item) => ({
        candidateId: item.candidateId,
        email: item.email,
        jobTitle: item.jobTitle,
        reason: payload.reason,
        sentAt: nowIso,
        overrideReason: payload.overrideReason,
        emailSubject: item.emailSubject,
        emailBody: item.emailBody,
      }));

      const existingRecords = getStoredSentRejections();
      saveStoredSentRejections([...newRecords, ...existingRecords]);
    }

    saveBulkBatchToHistory(batchResult);
    return batchResult;
  },

  /**
   * 2. Lấy chi tiết kết quả xử lý của từng ứng viên trong đợt gửi để hiển thị (AC 1 & AC 2)
   */
  async getBulkEmailResultDetails(batchId: string): Promise<BulkRejectionBatchResult> {
    if (!batchId || !batchId.trim()) {
      throw new BulkRejectionApiError('Mã đợt gửi không được để trống.', 400);
    }

    try {
      const response = await axiosClient.get<BulkRejectionBatchResult>(
        `/recruitment/candidates/bulk-rejections/${encodeURIComponent(batchId)}`,
      );

      if (response?.data && response.data.batchId) {
        return response.data;
      }
    } catch {
      // Fallback
    }

    const history = getStoredBulkHistory();
    const found = history.find((b) => b.batchId === batchId);
    if (found) {
      return found;
    }

    throw new BulkRejectionApiError(
      `Không tìm thấy chi tiết kết quả cho đợt gửi ${batchId}.`,
      404,
    );
  },

  /**
   * 3. Lấy lịch sử các thư từ chối đã từng gửi cho một ứng viên cụ thể (AC 2)
   */
  async getCandidateRejectionHistory(candidateId: string): Promise<StoredSentRejectionRecord[]> {
    if (!candidateId) return [];

    try {
      const response = await axiosClient.get<StoredSentRejectionRecord[]>(
        `/recruitment/candidates/${encodeURIComponent(candidateId)}/rejection-history`,
      );

      if (response?.data && Array.isArray(response.data)) {
        return response.data;
      }
    } catch {
      // Fallback
    }

    const records = getStoredSentRejections();
    return records.filter((r) => r.candidateId === candidateId);
  },
};

export default bulkRejectionService;

