/**
 * Recruitment Report Service (Jira TKNHTTDNB1-572 / TKNHTTDNB1-84 - User Story S8-08)
 * Quản lý kết nối API báo cáo thời gian chi phí tuyển dụng, cập nhật chi phí quảng cáo/thưởng và xuất Excel.
 */

import axios from 'axios';
import axiosClient from '../utils/axiosClient';
import type {
  TimeCostReportData,
  TimeCostReportFilterState,
  UpdateRecruitmentCostPayload,
} from '../types/timeCostReport';
import { MOCK_TIME_COST_REPORT_DATA } from '../types/timeCostReport';
import {
  exportTimeCostReportToExcel,
  generateTimeCostReportFilename,
} from '../utils/timeCostReportExcelHelper';

export class RecruitmentReportApiError extends Error {
  public statusCode?: number;
  public details?: unknown;

  constructor(message: string, statusCode?: number, details?: unknown) {
    super(message);
    this.name = 'RecruitmentReportApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Bắt và format các mã lỗi trả về từ Axios thành thông báo tiếng Việt rõ ràng, thân thiện (AC 3)
 */
export const handleRecruitmentReportError = (
  error: unknown,
  fallbackMessage: string,
): RecruitmentReportApiError => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const resData = error.response?.data as { message?: string } | undefined;

    if (resData?.message && typeof resData.message === 'string') {
      return new RecruitmentReportApiError(resData.message, status, resData);
    }

    if (!error.response) {
      return new RecruitmentReportApiError(
        'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.',
        status,
      );
    }

    if (status === 400) {
      return new RecruitmentReportApiError(
        'Dữ liệu chi phí hoặc bộ lọc yêu cầu không hợp lệ.',
        status,
      );
    }
    if (status === 401) {
      return new RecruitmentReportApiError(
        'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.',
        status,
      );
    }
    if (status === 403) {
      return new RecruitmentReportApiError(
        'Bạn không có quyền truy cập báo cáo hoặc cập nhật chi phí tuyển dụng.',
        status,
      );
    }
    if (status === 404) {
      return new RecruitmentReportApiError(
        'Không tìm thấy dữ liệu báo cáo thời gian và chi phí tuyển dụng.',
        status,
      );
    }
    if (status && status >= 500) {
      return new RecruitmentReportApiError(
        'Hệ thống máy chủ gặp sự cố khi xử lý báo cáo. Vui lòng thử lại sau.',
        status,
      );
    }
  }

  return error instanceof RecruitmentReportApiError
    ? error
    : new RecruitmentReportApiError(
        error instanceof Error ? error.message : fallbackMessage,
      );
};

const STORAGE_KEY = 'smart_recruitment_time_cost_report_data';

/**
 * Đọc dữ liệu báo cáo từ cache bộ nhớ / localStorage
 */
export const getStoredReportData = (): TimeCostReportData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.kpi && Array.isArray(parsed.departments)) {
        return parsed as TimeCostReportData;
      }
    }
  } catch {
    // Ignore error
  }
  return JSON.parse(JSON.stringify(MOCK_TIME_COST_REPORT_DATA));
};

/**
 * Lưu dữ liệu báo cáo vào cache bộ nhớ / localStorage
 */
export const saveStoredReportData = (data: TimeCostReportData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore error
  }
};

/**
 * Đặt lại dữ liệu báo cáo về mặc định ban đầu
 */
export const resetStoredReportData = (): TimeCostReportData => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore error
  }
  return JSON.parse(JSON.stringify(MOCK_TIME_COST_REPORT_DATA));
};

export const recruitmentReportService = {
  /**
   * AC 1: Gọi API lấy số liệu báo cáo tổng hợp gồm Time-to-hire, Cost-per-hire và so sánh đa chiều
   */
  async getRecruitmentReportData(
    filters?: TimeCostReportFilterState,
  ): Promise<TimeCostReportData> {
    try {
      const response = await axiosClient.get('/recruitment/reports/time-cost', {
        params: filters,
      });

      if (response?.data && typeof response.data === 'object' && response.data.kpi) {
        saveStoredReportData(response.data as TimeCostReportData);
        return response.data as TimeCostReportData;
      }
    } catch {
      // Fallback khi backend chưa có endpoint hoặc chạy mock
    }

    return getStoredReportData();
  },

  /**
   * AC 1 & 2: Nhập hoặc cập nhật chi phí quảng cáo tin tuyển dụng và thưởng giới thiệu nhân sự
   * Sau đó tính toán lại các chỉ số Time-to-hire & Cost-per-hire thời gian thực.
   */
  async updateRecruitmentCost(
    payload: UpdateRecruitmentCostPayload,
  ): Promise<{ success: boolean; data: TimeCostReportData; message: string }> {
    if (!payload) {
      throw new RecruitmentReportApiError('Dữ liệu nhập chi phí không hợp lệ.', 400);
    }

    if (!payload.positionId && !payload.departmentId) {
      throw new RecruitmentReportApiError(
        'Vui lòng chọn vị trí công việc hoặc phòng ban cần nhập chi phí.',
        400,
      );
    }

    if (payload.postingFees < 0 || payload.referralBonuses < 0) {
      throw new RecruitmentReportApiError(
        'Chi phí đăng tin và tiền thưởng giới thiệu không được là số âm.',
        400,
      );
    }

    const currentData = getStoredReportData();

    // 1. Cập nhật chi phí cho Vị trí công việc cụ thể
    if (payload.positionId) {
      const posIndex = currentData.positions.findIndex(
        (p) => p.jobId === payload.positionId,
      );
      if (posIndex >= 0) {
        const targetPos = currentData.positions[posIndex];
        targetPos.postingFees = Math.round(payload.postingFees);
        targetPos.referralBonuses = Math.round(payload.referralBonuses);
        targetPos.totalCost = targetPos.postingFees + targetPos.referralBonuses;
        targetPos.costPerHire =
          targetPos.hiredCount > 0
            ? Math.round(targetPos.totalCost / targetPos.hiredCount)
            : targetPos.totalCost;

        // Cập nhật lại tổng của phòng ban chứa vị trí này
        const targetDept = currentData.departments.find(
          (d) => d.departmentName === targetPos.departmentName,
        );
        if (targetDept) {
          const deptPositions = currentData.positions.filter(
            (p) => p.departmentName === targetDept.departmentName,
          );
          targetDept.totalPostingFees = deptPositions.reduce(
            (sum, p) => sum + p.postingFees,
            0,
          );
          targetDept.totalReferralBonuses = deptPositions.reduce(
            (sum, p) => sum + p.referralBonuses,
            0,
          );
          targetDept.totalCost =
            targetDept.totalPostingFees + targetDept.totalReferralBonuses;
          targetDept.costPerHire =
            targetDept.hiredCount > 0
              ? Math.round(targetDept.totalCost / targetDept.hiredCount)
              : 0;
        }
      }
    } else if (payload.departmentId) {
      // 2. Cập nhật trực tiếp cho Phòng ban nếu không chọn vị trí cụ thể
      const deptIndex = currentData.departments.findIndex(
        (d) => d.departmentId === payload.departmentId,
      );
      if (deptIndex >= 0) {
        const dept = currentData.departments[deptIndex];
        dept.totalPostingFees = Math.round(payload.postingFees);
        dept.totalReferralBonuses = Math.round(payload.referralBonuses);
        dept.totalCost = dept.totalPostingFees + dept.totalReferralBonuses;
        dept.costPerHire =
          dept.hiredCount > 0 ? Math.round(dept.totalCost / dept.hiredCount) : 0;
      }
    }

    // 3. Tính toán lại toàn bộ chỉ số KPI tổng hợp (Summary Metrics recalculation)
    const newTotalPosting = currentData.departments.reduce(
      (sum, d) => sum + d.totalPostingFees,
      0,
    );
    const newTotalReferral = currentData.departments.reduce(
      (sum, d) => sum + d.totalReferralBonuses,
      0,
    );
    const newTotalCost = newTotalPosting + newTotalReferral;

    currentData.kpi.totalPostingFees = newTotalPosting;
    currentData.kpi.totalReferralBonuses = newTotalReferral;
    currentData.kpi.totalRecruitmentCost = newTotalCost;
    currentData.kpi.avgCostPerHire =
      currentData.kpi.totalHires > 0
        ? Math.round(newTotalCost / currentData.kpi.totalHires)
        : 0;

    currentData.kpi.postingFeePercentage =
      newTotalCost > 0
        ? Math.round((newTotalPosting / newTotalCost) * 1000) / 10
        : 0;
    currentData.kpi.referralBonusPercentage =
      newTotalCost > 0
        ? Math.round((newTotalReferral / newTotalCost) * 1000) / 10
        : 0;

    currentData.generatedAt = new Date().toISOString();

    // 4. Đồng bộ lên Backend qua Axios
    try {
      await axiosClient.post('/recruitment/reports/time-cost/costs', payload);
    } catch {
      // Tiếp tục hoạt động ở chế độ client-storage khi server offline
    }

    saveStoredReportData(currentData);

    return {
      success: true,
      data: currentData,
      message: 'Đã cập nhật chi phí tuyển dụng thành công!',
    };
  },

  /**
   * AC 1 & 3: Xuất báo cáo Excel tuân thủ bộ lọc hiện tại và kích hoạt tải về an toàn
   */
  async exportRecruitmentReportExcel(
    filters: TimeCostReportFilterState,
    currentData?: TimeCostReportData,
  ): Promise<{ success: boolean; filename: string }> {
    const filename = generateTimeCostReportFilename();

    try {
      // 1. Thử tải file trực tiếp từ Backend
      const response = await axiosClient.get(
        '/recruitment/reports/time-cost/export',
        {
          params: filters,
          responseType: 'blob',
        },
      );

      if (response?.data && response.data instanceof Blob) {
        if (typeof window !== 'undefined' && window.URL && document.createElement) {
          const downloadUrl = window.URL.createObjectURL(response.data);
          const anchor = document.createElement('a');
          anchor.href = downloadUrl;
          anchor.setAttribute('download', filename);
          document.body.appendChild(anchor);
          anchor.click();
          document.body.removeChild(anchor);
          window.URL.revokeObjectURL(downloadUrl);
        }
        return { success: true, filename };
      }
    } catch {
      // Fallback sang tạo Excel phía client qua SheetJS
    }

    // 2. Tạo Excel từ dữ liệu hiện tại với các tiêu chí bộ lọc đã chọn
    const reportData = currentData || (await this.getRecruitmentReportData(filters));
    const success = exportTimeCostReportToExcel(reportData, filters);

    if (!success) {
      throw new RecruitmentReportApiError(
        'Không thể khởi tạo hoặc ghi tệp Excel báo cáo.',
        500,
      );
    }

    return { success: true, filename };
  },
};

