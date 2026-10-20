import axiosClient from '../utils/axiosClient';

export interface ApprovalActionPayload {
  action: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION';
  comment: string;
  expectedRevision?: string;
}

export const approvalActionService = {
  submitAction: async (requestId: string | number, data: ApprovalActionPayload): Promise<any> => {
    const response = await axiosClient.post(`/approvals/${requestId}/action`, data);
    return response.data;
  },
};
