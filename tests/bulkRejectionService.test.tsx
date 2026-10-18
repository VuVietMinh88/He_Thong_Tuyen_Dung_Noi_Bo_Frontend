import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { renderToString } from 'react-dom/server';
import axiosClient from '../src/utils/axiosClient';
import bulkRejectionService, {
  BulkRejectionApiError,
  handleBulkRejectionError,
} from '../src/services/bulkRejectionService';
import {
  type SendBulkRejectionPayload,
  type BulkRejectionBatchResult,
  LOCAL_STORAGE_SENT_REJECTIONS_KEY,
  LOCAL_STORAGE_BULK_HISTORY_KEY,
  clearStoredBulkHistory,
  clearStoredSentRejections,
  getStoredBulkHistory,
  getStoredSentRejections,
  saveBulkBatchToHistory,
} from '../src/types/bulkRejection';
import { BulkRejectionModal } from '../src/components/Candidate/BulkRejectionModal';

const storage = new Map<string, string>();

describe('TKNHTTDNB1-525 / S7-09: Tích hợp xác nhận gửi và hiển thị kết quả từng ứng viên (bulkRejectionService)', () => {
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

  const mockPayload: SendBulkRejectionPayload = {
    batchTitle: 'Đợt từ chối ứng viên tháng 10/2026',
    templateId: 'tpl-screening',
    reason: 'Không phù hợp với tiêu chí kỹ thuật / chuyên môn',
    companyName: 'Công ty Công nghệ Thông minh',
    recruiterName: 'Ban Tuyển dụng',
    candidates: [
      {
        candidateId: 'cand-01',
        applicationId: 'app-01',
        candidateName: 'Nguyễn Văn An',
        email: 'an.nguyen@example.com',
        jobTitle: 'Frontend Developer',
        departmentName: 'Khối Công nghệ',
        customEmailSubject: 'Thư cảm ơn - Nguyễn Văn An',
        customEmailBody: 'Chào bạn An, cảm ơn bạn đã nộp hồ sơ...',
        isDuplicate: false,
      },
      {
        candidateId: 'cand-02',
        applicationId: 'app-02',
        candidateName: 'Trần Thị Bích',
        email: 'bich.tran@example.com',
        jobTitle: 'Frontend Developer',
        departmentName: 'Khối Công nghệ',
        customEmailSubject: 'Thư cảm ơn - Trần Thị Bích',
        customEmailBody: 'Chào bạn Bích, cảm ơn bạn đã nộp hồ sơ...',
        isDuplicate: false,
      },
    ],
  };

  describe('AC 1: API Service bulkRejectionService', () => {
    it('ném lỗi BulkRejectionApiError khi payload danh sách ứng viên rỗng', async () => {
      const invalidPayload = {
        ...mockPayload,
        candidates: [],
      };

      await expect(bulkRejectionService.sendBulkRejectionEmails(invalidPayload)).rejects.toThrow(
        'Danh sách ứng viên gửi thư không được để trống.',
      );
      await expect(bulkRejectionService.sendBulkRejectionEmails(invalidPayload)).rejects.toBeInstanceOf(
        BulkRejectionApiError,
      );
    });

    it('gửi thành công khi API Backend phản hồi hợp lệ và cập nhật LocalStorage', async () => {
      const mockBackendResponse: BulkRejectionBatchResult = {
        batchId: 'batch-test-123',
        totalProcessed: 2,
        successCount: 2,
        skippedCount: 0,
        failedCount: 0,
        processedAt: '2026-10-18T10:00:00.000Z',
        items: [
          {
            candidateId: 'cand-01',
            candidateName: 'Nguyễn Văn An',
            email: 'an.nguyen@example.com',
            status: 'SUCCESS',
            message: 'Đã gửi thành công',
            sentAt: '2026-10-18T10:00:00.000Z',
          },
          {
            candidateId: 'cand-02',
            candidateName: 'Trần Thị Bích',
            email: 'bich.tran@example.com',
            status: 'SUCCESS',
            message: 'Đã gửi thành công',
            sentAt: '2026-10-18T10:00:00.000Z',
          },
        ],
      };

      vi.spyOn(axiosClient, 'post').mockResolvedValueOnce({
        data: mockBackendResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await bulkRejectionService.sendBulkRejectionEmails(mockPayload);

      expect(result.batchId).toBe('batch-test-123');
      expect(result.successCount).toBe(2);
      expect(result.failedCount).toBe(0);

      // Kiểm tra LocalStorage được cập nhật lịch sử gửi
      const stored = getStoredSentRejections();
      expect(stored.length).toBeGreaterThanOrEqual(2);
      expect(stored.some((r) => r.candidateId === 'cand-01')).toBe(true);

      const history = getStoredBulkHistory();
      expect(history.length).toBeGreaterThanOrEqual(1);
      expect(history[0].batchId).toBe('batch-test-123');
      expect(storage.get(LOCAL_STORAGE_BULK_HISTORY_KEY)).toBeTruthy();
    });

    it('xử lý offline-first fallback và gọi onProgress khi backend chưa hỗ trợ hoặc mạng lỗi nhẹ', async () => {
      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(new Error('Network offline'));

      const progressSteps: Array<{ processed: number; total: number }> = [];
      const onProgress = (processed: number, total: number) => {
        progressSteps.push({ processed, total });
      };

      // Payload gồm 1 thành công, 1 trùng lặp bị chặn (SKIPPED), 1 email không hợp lệ (FAILED)
      const mixedPayload: SendBulkRejectionPayload = {
        ...mockPayload,
        candidates: [
          {
            candidateId: 'cand-ok',
            candidateName: 'Ứng viên Hợp Lệ',
            email: 'ok@example.com',
            isDuplicate: false,
            customEmailSubject: 'Thư mời',
            customEmailBody: 'Nội dung',
          },
          {
            candidateId: 'cand-dup',
            candidateName: 'Ứng viên Trùng',
            email: 'dup@example.com',
            isDuplicate: true,
            previousSentAt: '10/10/2026',
          },
          {
            candidateId: 'cand-invalid-email',
            candidateName: 'Ứng viên Lỗi Email',
            email: 'invalid-email-address',
            isDuplicate: false,
          },
        ],
      };

      const result = await bulkRejectionService.sendBulkRejectionEmails(mixedPayload, onProgress);

      expect(progressSteps).toEqual([
        { processed: 1, total: 3 },
        { processed: 2, total: 3 },
        { processed: 3, total: 3 },
      ]);

      expect(result.totalProcessed).toBe(3);
      expect(result.successCount).toBe(1);
      expect(result.skippedCount).toBe(1);
      expect(result.failedCount).toBe(1);

      const successItem = result.items.find((i) => i.candidateId === 'cand-ok');
      expect(successItem?.status).toBe('SUCCESS');

      const skippedItem = result.items.find((i) => i.candidateId === 'cand-dup');
      expect(skippedItem?.status).toBe('SKIPPED');
      expect(skippedItem?.message).toContain('tránh gửi trùng lặp');

      const failedItem = result.items.find((i) => i.candidateId === 'cand-invalid-email');
      expect(failedItem?.status).toBe('FAILED');
      expect(failedItem?.message).toContain('Địa chỉ email không hợp lệ');
    });

    it('cho phép gửi lại ứng viên trùng lặp khi bật allowDuplicateRejection', async () => {
      vi.spyOn(axiosClient, 'post').mockRejectedValueOnce(new Error('Network offline'));

      const duplicatePayload: SendBulkRejectionPayload = {
        ...mockPayload,
        allowDuplicateRejection: true,
        overrideReason: 'Gửi lại đợt phỏng vấn tiếp theo',
        candidates: [
          {
            candidateId: 'cand-dup',
            candidateName: 'Ứng viên Gửi Lại',
            email: 'dup@example.com',
            isDuplicate: true,
            previousSentAt: '10/10/2026',
          },
        ],
      };

      const result = await bulkRejectionService.sendBulkRejectionEmails(duplicatePayload);

      expect(result.successCount).toBe(1);
      expect(result.skippedCount).toBe(0);
      expect(result.items[0].status).toBe('SUCCESS');
    });

    it('bắt các mã lỗi HTTP qua handleBulkRejectionError', () => {
      const createAxiosError = (status?: number, message?: string) => {
        const error = new Error(message || 'Request failed') as any;
        error.isAxiosError = true;
        if (status) {
          error.response = { status, data: { message } };
        }
        return error;
      };

      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const errNetwork = handleBulkRejectionError(createAxiosError(undefined), 'Lỗi fallback');
      expect(errNetwork.message).toContain('Không thể kết nối đến máy chủ');

      const err400 = handleBulkRejectionError(createAxiosError(400), 'Lỗi fallback');
      expect(err400.message).toContain('Dữ liệu gửi thư từ chối không hợp lệ');

      const err401 = handleBulkRejectionError(createAxiosError(401), 'Lỗi fallback');
      expect(err401.message).toContain('Phiên làm việc đã hết hạn');

      const err403 = handleBulkRejectionError(createAxiosError(403), 'Lỗi fallback');
      expect(err403.message).toContain('không có quyền');

      const err404 = handleBulkRejectionError(createAxiosError(404), 'Lỗi fallback');
      expect(err404.message).toContain('Không tìm thấy thông tin');

      const err500 = handleBulkRejectionError(createAxiosError(500), 'Lỗi fallback');
      expect(err500.message).toContain('Hệ thống máy chủ gặp sự cố');
    });

    it('getBulkEmailResultDetails lấy chi tiết từ API hoặc lịch sử LocalStorage', async () => {
      // 1. Kiểm tra validation khi thiếu batchId
      await expect(bulkRejectionService.getBulkEmailResultDetails('')).rejects.toThrow(
        'Mã đợt gửi không được để trống.',
      );

      // 2. Lưu vào storage và đọc lại
      const batchResult: BulkRejectionBatchResult = {
        batchId: 'batch-stored-999',
        totalProcessed: 1,
        successCount: 1,
        skippedCount: 0,
        failedCount: 0,
        processedAt: '2026-10-18T10:30:00.000Z',
        items: [
          {
            candidateId: 'cand-01',
            candidateName: 'Lê Hoàng',
            email: 'hoang@example.com',
            status: 'SUCCESS',
            message: 'Đã gửi thành công',
          },
        ],
      };
      saveBulkBatchToHistory(batchResult);

      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(new Error('Endpoint not found'));

      const retrieved = await bulkRejectionService.getBulkEmailResultDetails('batch-stored-999');
      expect(retrieved.batchId).toBe('batch-stored-999');
      expect(retrieved.items[0].candidateName).toBe('Lê Hoàng');

      // 3. Ném 404 khi không tìm thấy
      await expect(bulkRejectionService.getBulkEmailResultDetails('batch-non-existent')).rejects.toThrow(
        'Không tìm thấy chi tiết kết quả cho đợt gửi batch-non-existent.',
      );
    });

    it('getCandidateRejectionHistory lấy lịch sử thư từ chối của ứng viên', async () => {
      const records = [
        {
          candidateId: 'cand-history-01',
          email: 'history@example.com',
          jobTitle: 'Product Manager',
          reason: 'Chưa đủ năm kinh nghiệm',
          sentAt: '2026-10-15T09:00:00.000Z',
        },
      ];

      storage.set(LOCAL_STORAGE_SENT_REJECTIONS_KEY, JSON.stringify(records));

      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce(new Error('Network error'));

      const history = await bulkRejectionService.getCandidateRejectionHistory('cand-history-01');
      expect(history).toHaveLength(1);
      expect(history[0].jobTitle).toBe('Product Manager');

      // Ứng viên chưa từng bị từ chối
      const emptyHistory = await bulkRejectionService.getCandidateRejectionHistory('cand-new');
      expect(emptyHistory).toHaveLength(0);
    });
  });

  describe('AC 2: Giao diện hiển thị bảng kết quả chi tiết từng ứng viên', () => {
    it('hiển thị đầy đủ thông tin tóm tắt và bảng chi tiết từng ứng viên khi đã có kết quả đợt gửi', () => {
      // Mô phỏng trạng thái batchResult thông qua việc gọi helper hoặc render component
      const mockResult: BulkRejectionBatchResult = {
        batchId: 'batch-summary-test',
        totalProcessed: 3,
        successCount: 1,
        skippedCount: 1,
        failedCount: 1,
        processedAt: '2026-10-18T11:00:00.000Z',
        items: [
          {
            candidateId: 'cand-1',
            candidateName: 'Nguyễn Thành Nam',
            email: 'nam.nguyen@example.com',
            jobTitle: 'Frontend Engineer',
            departmentName: 'Phòng Phát Triển',
            status: 'SUCCESS',
            message: 'Đã gửi thư từ chối thành công đến hòm thư ứng viên.',
            emailSubject: 'Thông báo kết quả phỏng vấn',
            emailBody: 'Chào bạn Nam...',
          },
          {
            candidateId: 'cand-2',
            candidateName: 'Hoàng Kim Yến',
            email: 'yen.hoang@example.com',
            jobTitle: 'UI/UX Designer',
            departmentName: 'Phòng Sáng Tạo',
            status: 'SKIPPED',
            message: 'Bị hệ thống tự động chặn do đã từng nhận thư từ chối trước đó.',
            previousRejectionDate: '12/10/2026',
          },
          {
            candidateId: 'cand-3',
            candidateName: 'Phạm Minh Đức',
            email: 'invalid-email',
            jobTitle: 'DevOps Engineer',
            departmentName: 'Khối Hạ Tầng',
            status: 'FAILED',
            message: 'Lỗi gửi email: Địa chỉ email không hợp lệ.',
            errorDetails: 'Invalid email address format',
          },
        ],
      };

      // Đặt trước lịch sử đợt gửi vào Storage để kiểm tra tính toàn vẹn
      saveBulkBatchToHistory(mockResult);

      const storedHistory = getStoredBulkHistory();
      expect(storedHistory).toHaveLength(1);
      expect(storedHistory[0].batchId).toBe('batch-summary-test');
      expect(storedHistory[0].successCount).toBe(1);
      expect(storedHistory[0].skippedCount).toBe(1);
      expect(storedHistory[0].failedCount).toBe(1);

      // Render giao diện Modal với initialBatchResult để kiểm tra chi tiết bảng kết quả
      const html = renderToString(
        <BulkRejectionModal
          isOpen={true}
          onClose={() => {}}
          candidates={[]}
          initialBatchResult={mockResult}
        />,
      );

      // Header kết quả & Trạng thái xử lý
      expect(html).toContain('Kết quả gửi thư từ chối hàng loạt');
      expect(html).toContain('Mã đợt gửi: #batch-summary-test');
      expect(html).toContain('Đã hoàn tất xử lý');

      // 4 Thẻ tóm tắt số liệu
      expect(html).toContain('Tổng số xử lý');
      expect(html).toContain('Đã gửi thành công');
      expect(html).toContain('Đã bỏ qua / Chặn');
      expect(html).toContain('Gặp lỗi hệ thống');

      // Các tab lọc kết quả
      expect(html).toContain('Tất cả (3)');
      expect(html).toContain('Thành công (1)');
      expect(html).toContain('Bị chặn trùng (1)');
      expect(html).toContain('Gặp lỗi (1)');

      // Dòng 1: Thành công
      expect(html).toContain('Nguyễn Thành Nam');
      expect(html).toContain('nam.nguyen@example.com');
      expect(html).toContain('Frontend Engineer');
      expect(html).toContain('Đã gửi thành công');
      expect(html).toContain('Xem thư');

      // Dòng 2: Bị chặn trùng
      expect(html).toContain('Hoàng Kim Yến');
      expect(html).toContain('yen.hoang@example.com');
      expect(html).toContain('Đã bỏ qua (Chặn trùng)');
      expect(html).toContain('Đã gửi trước đó vào: 12/10/2026');

      // Dòng 3: Gặp lỗi
      expect(html).toContain('Phạm Minh Đức');
      expect(html).toContain('invalid-email');
      expect(html).toContain('Gặp lỗi gửi thư');
      expect(html).toContain('Lỗi: Invalid email address format');

      // Nút hành động Footer
      expect(html).toContain('Gửi tiếp đợt khác');
      expect(html).toContain('Hoàn tất &amp; Đóng');
    });

    it('hỗ trợ xóa sạch lịch sử gửi và lịch sử các đợt gửi (clear helpers)', () => {
      clearStoredSentRejections();
      expect(getStoredSentRejections()).toEqual([]);

      clearStoredBulkHistory();
      expect(getStoredBulkHistory()).toEqual([]);
    });
  });
});
