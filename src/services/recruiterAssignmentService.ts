import axiosClient from '../utils/axiosClient';

export interface AssignRecruiterPayload {
  recruiterId: string;
  note?: string;
}

export interface AssignmentHistoryItem {
  assignedTo: string;
  assignedBy: string;
  assignedAt: string;
  note: string | null;
}

export const recruiterAssignmentService = {
  assignRecruiter: async (jobRequisitionId: string | number, data: AssignRecruiterPayload): Promise<any> => {
    const response = await axiosClient.post(`/job-requisitions/${jobRequisitionId}/assign`, data);
    return response.data;
  },

  getHistory: async (jobRequisitionId: string | number): Promise<AssignmentHistoryItem[]> => {
    const response = await axiosClient.get(`/job-requisitions/${jobRequisitionId}/assignment-history`);
    return response.data;
  },
};
