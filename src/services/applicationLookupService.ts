import axiosClient from '../utils/axiosClient';

export type ApplicationLookupMethod = 'applicationCode' | 'contact';

export type ApplicationStatus =
  | 'RECEIVED'
  | 'IN_REVIEW'
  | 'INTERVIEW'
  | 'HIRED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface ApplicationTimelineEvent {
  status: ApplicationStatus;
  occurredAt?: string;
  note?: string;
}

export interface ApplicationLookupResult {
  applicationCode: string;
  jobTitle: string;
  submittedAt: string;
  status: ApplicationStatus;
  timeline?: ApplicationTimelineEvent[];
}

export const applicationLookupService = {
  async lookup(
    method: ApplicationLookupMethod,
    value: string,
  ): Promise<ApplicationLookupResult> {
    const response = await axiosClient.get<ApplicationLookupResult>(
      '/public/applications/lookup',
      { params: { method, value: value.trim() } },
    );
    return response.data;
  },
};

export default applicationLookupService;
