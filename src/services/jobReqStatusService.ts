import axiosClient from '../utils/axiosClient';

export interface StatusChangePayload {
  status: 'PAUSED' | 'FILLED' | 'CANCELLED' | string;
  reason?: string;
  [key: string]: any;
}

export type UpdateStatusPayload = StatusChangePayload;

export const jobReqStatusService = {
  getActiveCandidatesCount: async (jobRequisitionId: string | number): Promise<{ count: number }> => {
    const response = await axiosClient.get(`/job-requisitions/${jobRequisitionId}/active-candidates-count`);
    return response.data;
  },

  /**
   * Chuyển trạng thái yêu cầu tuyển dụng theo tài liệu API mới:
   * POST /requisitions/{id}/status-changes với payload là 'FILLED', 'PAUSED', hoặc 'CANCELLED'.
   */
  changeStatus: async (
    jobRequisitionId: string | number,
    data: StatusChangePayload | string
  ): Promise<any> => {
    const payload = typeof data === 'string' ? { status: data } : data;
    const response = await axiosClient.post(`/requisitions/${jobRequisitionId}/status-changes`, payload);
    return response.data;
  },

  /**
   * Tương thích với các lời gọi updateStatus cũ: tự động chuẩn hóa CLOSED -> FILLED
   * và gọi POST /requisitions/{id}/status-changes.
   */
  updateStatus: async (
    jobRequisitionId: string | number,
    data: StatusChangePayload
  ): Promise<any> => {
    const normalizedStatus = data.status === 'CLOSED' ? 'FILLED' : data.status;
    const payload = {
      ...data,
      status: normalizedStatus,
    };
    const response = await axiosClient.post(`/requisitions/${jobRequisitionId}/status-changes`, payload);
    return response.data;
  },
};

export default jobReqStatusService;
