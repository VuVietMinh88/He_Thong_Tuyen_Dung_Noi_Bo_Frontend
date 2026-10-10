import axiosClient from '../utils/axiosClient';

export interface ApprovalHistoryItem {
  stepName: string;
  approverName: string;
  status: 'APPROVED' | 'REJECTED' | 'PENDING';
  comment: string | null;
  actionDate: string | null;
}

export const approvalHistoryService = {
  getHistory: async (requestId: string | number): Promise<ApprovalHistoryItem[]> => {
    const response = await axiosClient.get(`/approvals/${requestId}/history`);
    return response.data;
  },
};
