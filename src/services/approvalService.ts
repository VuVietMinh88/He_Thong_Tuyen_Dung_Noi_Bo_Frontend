import axiosClient from '../utils/axiosClient';

export interface ApprovalStepPayload {
  level: number;
  roleId: string | null;
  userId: string | null;
}

export interface ApprovalWorkflowPayload {
  steps: ApprovalStepPayload[];
}

export const approvalService = {
  saveConfig: async (data: ApprovalWorkflowPayload): Promise<any> => {
    const response = await axiosClient.put('/approval-workflows/config', data);
    return response.data;
  },
};
