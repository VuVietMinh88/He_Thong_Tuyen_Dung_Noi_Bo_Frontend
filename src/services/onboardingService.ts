/**
 * Dịch vụ Onboarding Service kết nối API backend & quản lý trạng thái đầu việc
 * Jira Task: TKNHTTDNB1-519 (User Story S8-01)
 */
import axiosClient from '../utils/axiosClient';
import type {
  CandidateOnboardingRecord,
  OnboardingCandidateTask,
  OnboardingProgressSummary,
  UpdateChecklistItemPayload,
  UpdateChecklistItemResponse,
  OnboardingTaskStatus,
} from '../types/onboardingChecklist';
import {
  onboardingTrackingService,
  MOCK_CANDIDATE_ONBOARDING_RECORDS,
} from './onboardingTrackingService';
import { calculateOnboardingProgress } from '../utils/onboardingTrackingHelper';

const STORAGE_KEY = 'smart_recruitment_candidate_onboarding_records_v1';

export const onboardingService = {
  /**
   * Cập nhật trạng thái đầu việc checklist tiếp nhận (AC 3 - Task TKNHTTDNB1-519)
   * updateChecklistItemStatus(employeeId, itemId, payload)
   * 
   * @param employeeId Mã định danh nhân sự mới (id, candidateId, hoặc candidateCode)
   * @param itemId ID của đầu việc checklist cần cập nhật
   * @param payload Dữ liệu cập nhật: status ('PENDING' | 'IN_PROGRESS' | 'COMPLETED'), completedAt, completedBy, notes
   * @param options Tùy chọn kiểm thử mô phỏng lỗi mạng
   */
  async updateChecklistItemStatus(
    employeeId: string,
    itemId: string,
    payload: UpdateChecklistItemPayload,
    options?: { simulateError?: boolean }
  ): Promise<UpdateChecklistItemResponse> {
    if (options?.simulateError) {
      throw new Error('Lỗi kết nối máy chủ backend. Không thể lưu trạng thái đầu việc.');
    }

    // Chuẩn hóa status giữa API backend ('PENDING') và UI ('NOT_STARTED')
    const normalizedStatus: OnboardingTaskStatus =
      payload.status === 'PENDING'
        ? 'NOT_STARTED'
        : (payload.status as OnboardingTaskStatus);

    // 1. Thử gọi API Backend thực tế
    try {
      const response = await axiosClient.patch<{ data?: CandidateOnboardingRecord }>(
        `/onboarding/employees/${encodeURIComponent(employeeId)}/checklist/${encodeURIComponent(itemId)}`,
        {
          status: payload.status,
          completedAt: payload.completedAt,
          completedBy: payload.completedBy,
          notes: payload.notes,
        }
      );

      if (response.data?.data) {
        const record = response.data.data;
        const refreshedSummary = calculateOnboardingProgress(record.tasks);
        return {
          success: true,
          data: record,
          refreshedSummary,
          message: 'Cập nhật trạng thái nhiệm vụ thành công.',
        };
      }
    } catch {
      // Fallback: Nếu backend chưa sẵn sàng hoặc môi trường offline, xử lý qua local storage & memory
    }

    // 2. Fallback xử lý cục bộ và tính toán lại tiến độ
    const currentRecord = await onboardingTrackingService.getCandidateOnboardingRecord(employeeId);
    if (!currentRecord) {
      throw new Error(`Không tìm thấy hồ sơ tiếp nhận cho nhân sự ${employeeId}`);
    }

    const taskIndex = currentRecord.tasks.findIndex((t) => t.id === itemId);
    if (taskIndex === -1) {
      throw new Error(`Không tìm thấy đầu việc ${itemId} trong hồ sơ nhân viên ${employeeId}`);
    }

    const targetTask = currentRecord.tasks[taskIndex];
    const isCompleted = normalizedStatus === 'COMPLETED';

    const updatedTask: OnboardingCandidateTask = {
      ...targetTask,
      status: normalizedStatus,
      completedAt: isCompleted ? payload.completedAt || new Date().toISOString() : undefined,
      completedBy: isCompleted ? payload.completedBy || 'Người dùng hệ thống' : undefined,
      notes: payload.notes !== undefined ? payload.notes : targetTask.notes,
    };

    currentRecord.tasks[taskIndex] = updatedTask;
    currentRecord.updatedAt = new Date().toISOString();

    // Cập nhật lại danh sách toàn cục trong tracking service
    const allRecords = await onboardingTrackingService.listCandidateOnboardingRecords();
    const idx = allRecords.findIndex(
      (r) => r.id === currentRecord.id || r.candidateId === currentRecord.candidateId
    );
    if (idx >= 0) {
      allRecords[idx] = currentRecord;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(allRecords));
        }
      } catch {
        // Ignore
      }
    }

    // Tự động tính toán lại toàn bộ tiến độ % (AC 3)
    const refreshedSummary = calculateOnboardingProgress(currentRecord.tasks);

    return {
      success: true,
      data: currentRecord,
      refreshedSummary,
      message: 'Cập nhật trạng thái nhiệm vụ thành công.',
    };
  },

  /**
   * Lấy chi tiết tiến độ checklist và tính toán % hoàn thành của nhân sự (AC 3)
   */
  async getEmployeeOnboardingProgress(employeeId: string): Promise<{
    record: CandidateOnboardingRecord;
    summary: OnboardingProgressSummary;
  }> {
    try {
      const response = await axiosClient.get<{ data?: CandidateOnboardingRecord }>(
        `/onboarding/employees/${encodeURIComponent(employeeId)}/progress`
      );
      if (response.data?.data) {
        const record = response.data.data;
        return {
          record,
          summary: calculateOnboardingProgress(record.tasks),
        };
      }
    } catch {
      // Fallback
    }

    const record = await onboardingTrackingService.getCandidateOnboardingRecord(employeeId);
    const summary = calculateOnboardingProgress(record.tasks);
    return { record, summary };
  },

  /**
   * Tự động gọi refresh lại tổng % tiến độ của hồ sơ nhân viên sau khi cập nhật thành công (AC 3)
   */
  async refreshOnboardingProgress(employeeId: string): Promise<OnboardingProgressSummary> {
    const { summary } = await this.getEmployeeOnboardingProgress(employeeId);
    return summary;
  },

  /**
   * Khôi phục dữ liệu mẫu
   */
  async resetToDefaultRecords(): Promise<CandidateOnboardingRecord[]> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_CANDIDATE_ONBOARDING_RECORDS));
      }
    } catch {
      // Ignore
    }
    return JSON.parse(JSON.stringify(MOCK_CANDIDATE_ONBOARDING_RECORDS));
  },
};

export default onboardingService;
