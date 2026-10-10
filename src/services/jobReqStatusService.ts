import axiosClient from '../utils/axiosClient';

export interface UpdateStatusPayload {
  status: 'PAUSED' | 'CLOSED' | 'CANCELLED';
  reason?: string;
}

export const jobReqStatusService = {
  getActiveCandidatesCount: async (jobRequisitionId: string | number): Promise<{ count: number }> => {
    const response = await axiosClient.get(`/job-requisitions/${jobRequisitionId}/active-candidates-count`);
    return response.data;
  },

  updateStatus: async (jobRequisitionId: string | number, data: UpdateStatusPayload): Promise<any> => {
    const response = await axiosClient.patch(`/job-requisitions/${jobRequisitionId}/status`, data);
    return response.data;
  },
};
