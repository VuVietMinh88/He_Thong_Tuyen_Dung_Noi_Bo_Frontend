import axiosClient from '../utils/axiosClient';

export interface CreateJobRequisitionPayload {
  jobTitle: string;
  departmentId: number;
  level: string;
  jobType: string;
  expectedJoinDate: string;
  headcount: number;
  description: string;
  requirements: string;
  benefits: string;
}

export const jobRequisitionService = {
  createJobRequisition: async (data: CreateJobRequisitionPayload): Promise<any> => {
    const response = await axiosClient.post('/job-requisitions', data);
    return response.data;
  },
};
