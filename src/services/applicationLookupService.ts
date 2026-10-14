import axios from 'axios';
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

export type ApplicationLookupErrorKind = 'not-found' | 'mismatch';

export class ApplicationLookupError extends Error {
  readonly kind: ApplicationLookupErrorKind;

  constructor(kind: ApplicationLookupErrorKind) {
    super('Application lookup did not match an existing application.');
    this.name = 'ApplicationLookupError';
    this.kind = kind;
  }
}

const mismatchErrorCodes = new Set([
  'APPLICATION_NOT_FOUND',
  'APPLICATION_CODE_NOT_FOUND',
  'APPLICATION_LOOKUP_NOT_FOUND',
  'APPLICATION_EMAIL_MISMATCH',
  'APPLICATION_CONTACT_MISMATCH',
  'APPLICATION_LOOKUP_MISMATCH',
  'APPLICATION_CODE_EMAIL_MISMATCH',
  'EMAIL_MISMATCH',
  'CONTACT_MISMATCH',
  'LOOKUP_MISMATCH',
  'INVALID_APPLICATION_CODE',
  'INVALID_LOOKUP_INFORMATION',
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isLookupMismatch = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  if (status === 404) return true;
  if (status !== 400 && status !== 422) return false;

  const body = error.response?.data;
  if (!isRecord(body)) return false;

  const nestedError = isRecord(body.error) ? body.error : undefined;
  const code = [body.code, body.errorCode, body.error_code, body.error, nestedError?.code]
    .find((value): value is string => typeof value === 'string')
    ?.trim()
    .toUpperCase();
  if (code && mismatchErrorCodes.has(code)) return true;

  const message = [body.message, body.detail, nestedError?.message]
    .find((value): value is string => typeof value === 'string');
  return Boolean(message && /application.*(not found|mismatch|not match)|email.*(mismatch|not match)|contact.*(mismatch|not match)|(?:không tồn tại|không khớp)/i.test(message));
};

export const applicationLookupService = {
  async lookup(
    method: ApplicationLookupMethod,
    value: string,
  ): Promise<ApplicationLookupResult> {
    try {
      const response = await axiosClient.get<ApplicationLookupResult>(
        '/public/applications/lookup',
        { params: { method, value: value.trim() } },
      );
      return response.data;
    } catch (error: unknown) {
      if (isLookupMismatch(error)) {
        throw new ApplicationLookupError(
          axios.isAxiosError(error) && error.response?.status === 404 ? 'not-found' : 'mismatch',
        );
      }
      throw error;
    }
  },

  async withdraw(applicationCode: string, reason: string): Promise<void> {
    const trimmedCode = applicationCode.trim();
    const trimmedReason = reason.trim();
    if (!trimmedCode) throw new Error('Mã hồ sơ không được để trống.');
    if (!trimmedReason) throw new Error('Vui lòng nhập lý do rút hồ sơ.');

    await axiosClient.patch(
      `/public/applications/${encodeURIComponent(trimmedCode)}/withdraw`,
      { reason: trimmedReason },
    );
  },
};

export default applicationLookupService;
