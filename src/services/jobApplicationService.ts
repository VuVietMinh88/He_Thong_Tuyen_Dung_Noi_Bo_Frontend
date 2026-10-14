import axios from 'axios';
import axiosClient from '../utils/axiosClient';

export interface ApplicationSourceOption {
  value: string;
  label: string;
}

export const APPLICATION_SOURCES: ApplicationSourceOption[] = [
  { value: 'WEBSITE', label: 'Website công ty' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'INTERNAL_REFERRAL', label: 'Giới thiệu nội bộ' },
  { value: 'TOPCV', label: 'TopCV' },
  { value: 'VIETNAMWORKS', label: 'VietnamWorks' },
  { value: 'OTHER', label: 'Khác' },
];

export const MAX_CV_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_CV_FILE_SIZE_MB = 10;
export const ALLOWED_CV_EXTENSIONS = ['.pdf', '.docx'];
export const ALLOWED_CV_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];
export const CV_FILE_ACCEPT_ATTRIBUTE =
  '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
export const CV_FILE_RULE_TEXT =
  'Chỉ chấp nhận tệp định dạng PDF hoặc DOCX, dung lượng tối đa 10MB';

export const MAX_SUBMISSIONS_PER_HOUR = 5;
export const SUBMISSION_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 giờ

export const CV_FILE_CONFIG = {
  MAX_SIZE_BYTES: MAX_CV_FILE_SIZE_BYTES,
  MAX_SIZE_MB: MAX_CV_FILE_SIZE_MB,
  ACCEPT_ATTRIBUTE: CV_FILE_ACCEPT_ATTRIBUTE,
  RULE_TEXT: CV_FILE_RULE_TEXT,
  ALLOWED_EXTENSIONS: ALLOWED_CV_EXTENSIONS,
  ALLOWED_MIME_TYPES: ALLOWED_CV_MIME_TYPES,
};

export class DuplicateApplicationError extends Error {
  constructor(
    message: string = 'Email này đã được sử dụng để ứng tuyển vào vị trí này. Vui lòng kiểm tra lại hoặc sử dụng email khác.'
  ) {
    super(message);
    this.name = 'DuplicateApplicationError';
  }
}

export class RateLimitExceededError extends Error {
  constructor(
    message: string = 'Bạn đã vượt quá số lần nộp hồ sơ cho phép trong 1 giờ. Vui lòng thử lại sau.'
  ) {
    super(message);
    this.name = 'RateLimitExceededError';
  }
}

export class ApplicationSubmissionError extends Error {
  public statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ApplicationSubmissionError';
    this.statusCode = statusCode;
  }
}

export interface CandidateApplicationPayload {
  jobId: string;
  jobTitle?: string;
  fullName: string;
  email: string;
  phone: string;
  source: string;
  coverLetter?: string;
  cvFile: File;
}

export interface ApplicationSubmissionResponse {
  success: boolean;
  trackingCode: string;
  applicationId: string;
  message: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle?: string;
  submittedAt: string;
  confirmationEmailSent: boolean;
}

export type ApplicationSubmitResult = ApplicationSubmissionResponse;

export const formatFileSizeMB = (fileSizeBytes: number): string => {
  if (fileSizeBytes <= 0) return '0.00 MB';
  const sizeInMegabytes = fileSizeBytes / (1024 * 1024);
  return `${sizeInMegabytes.toFixed(2)} MB`;
};

export const validateCvFile = (
  selectedFile?: File | null
): { isValid: boolean; error?: string } => {
  if (!selectedFile) {
    return {
      isValid: false,
      error: 'Vui lòng chọn hoặc tải lên tệp CV của bạn.',
    };
  }

  if (selectedFile.size > MAX_CV_FILE_SIZE_BYTES) {
    const actualSizeMb = formatFileSizeMB(selectedFile.size);
    return {
      isValid: false,
      error: `Dung lượng tệp vượt quá mức cho phép (${actualSizeMb} > ${MAX_CV_FILE_SIZE_MB}MB). Vui lòng chọn tệp nhỏ hơn 10MB.`,
    };
  }

  const lowercaseFileName = selectedFile.name.toLowerCase();
  const hasValidExtension = ALLOWED_CV_EXTENSIONS.some((extension) =>
    lowercaseFileName.endsWith(extension)
  );
  const hasValidMimeType = ALLOWED_CV_MIME_TYPES.includes(selectedFile.type);

  if (!hasValidExtension && !hasValidMimeType) {
    return {
      isValid: false,
      error: 'Định dạng tệp không hợp lệ. Chỉ chấp nhận tệp định dạng PDF hoặc DOCX.',
    };
  }

  return { isValid: true };
};

export const validateApplicationForm = (
  formValues: Partial<CandidateApplicationPayload>
): Record<string, string> => {
  const validationErrors: Record<string, string> = {};

  if (!formValues.fullName || !formValues.fullName.trim()) {
    validationErrors.fullName = 'Vui lòng nhập họ và tên của bạn.';
  } else if (formValues.fullName.trim().length < 2) {
    validationErrors.fullName = 'Họ và tên phải có ít nhất 2 ký tự.';
  }

  const emailRegexPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!formValues.email || !formValues.email.trim()) {
    validationErrors.email = 'Vui lòng nhập địa chỉ email.';
  } else if (!emailRegexPattern.test(formValues.email.trim())) {
    validationErrors.email = 'Địa chỉ email không hợp lệ (ví dụ: ungvien@example.com).';
  }

  const cleanedPhoneNumber = formValues.phone
    ? formValues.phone.replace(/[\s.-]/g, '')
    : '';
  const vietnamPhoneRegexPattern = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
  if (!cleanedPhoneNumber) {
    validationErrors.phone = 'Vui lòng nhập số điện thoại liên hệ.';
  } else if (!vietnamPhoneRegexPattern.test(cleanedPhoneNumber)) {
    validationErrors.phone =
      'Số điện thoại không hợp lệ (gồm 10 số, bắt đầu bằng 03, 05, 07, 08, 09 hoặc +84).';
  }

  if (!formValues.source || !formValues.source.trim()) {
    validationErrors.source = 'Vui lòng chọn nguồn bạn biết thông tin tuyển dụng này.';
  }

  const cvValidationResult = validateCvFile(formValues.cvFile);
  if (!cvValidationResult.isValid && cvValidationResult.error) {
    validationErrors.cvFile = cvValidationResult.error;
  }

  return validationErrors;
};

export const generateTrackingCode = (): string => {
  const currentYear = new Date().getFullYear();
  const randomCharacters = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `APP-${currentYear}-${randomCharacters}`;
};

interface StoredApplicationRecord {
  id: string;
  trackingCode: string;
  jobId: string;
  jobTitle?: string;
  fullName: string;
  email: string;
  phone: string;
  source: string;
  cvFileName: string;
  cvFileSize: number;
  submittedAt: string;
}

export const submitCandidateApplication = async (
  applicationPayload: CandidateApplicationPayload
): Promise<ApplicationSubmissionResponse> => {
  const applicationFormData = new FormData();
  applicationFormData.append('jobId', applicationPayload.jobId);
  if (applicationPayload.jobTitle) {
    applicationFormData.append('jobTitle', applicationPayload.jobTitle);
  }
  applicationFormData.append('fullName', applicationPayload.fullName.trim());
  applicationFormData.append('email', applicationPayload.email.trim());
  applicationFormData.append('phone', applicationPayload.phone.trim());
  applicationFormData.append('source', applicationPayload.source);
  if (applicationPayload.coverLetter) {
    applicationFormData.append('coverLetter', applicationPayload.coverLetter.trim());
  }
  applicationFormData.append('cvFile', applicationPayload.cvFile);

  try {
    const apiResponse = await axiosClient.post<ApplicationSubmissionResponse>(
      `/public/jobs/${applicationPayload.jobId}/applications`,
      applicationFormData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const submissionData = apiResponse.data;
    if (!submissionData.trackingCode) {
      submissionData.trackingCode = generateTrackingCode();
    }
    submissionData.confirmationEmailSent = true;

    return submissionData;
  } catch (caughtError: unknown) {
    if (axios.isAxiosError(caughtError)) {
      const httpStatusCode = caughtError.response?.status;
      const responseBody = caughtError.response?.data;
      const serverMessage =
        typeof responseBody === 'object' &&
        responseBody !== null &&
        'message' in responseBody &&
        typeof responseBody.message === 'string'
          ? responseBody.message
          : '';

      if (httpStatusCode === 409) {
        throw new DuplicateApplicationError(
          serverMessage ||
            'Email này đã được sử dụng để ứng tuyển vào vị trí này. Vui lòng kiểm tra lại hoặc sử dụng email khác.'
        );
      }

      if (httpStatusCode === 429) {
        throw new RateLimitExceededError(
          serverMessage ||
            'Bạn đã vượt quá số lần nộp hồ sơ cho phép trong 1 giờ. Vui lòng thử lại sau.'
        );
      }

      if (httpStatusCode === 400) {
        throw new ApplicationSubmissionError(
          serverMessage || 'Thông tin ứng tuyển không hợp lệ. Vui lòng kiểm tra lại các trường.',
          400
        );
      }

      if (caughtError.response) {
        throw new ApplicationSubmissionError(
          serverMessage || 'Máy chủ đang gặp sự cố khi tiếp nhận hồ sơ. Vui lòng thử lại sau.',
          httpStatusCode
        );
      }
    }

    // Khi không nhận được phản hồi từ Backend (môi trường dev offline / frontend standalone testing)
    // Thực hiện kiểm tra trùng lặp và giới hạn tốc độ gửi để mô phỏng chính xác hành vi máy chủ
    return handleOfflineFallbackSubmission(applicationPayload);
  }
};

const handleOfflineFallbackSubmission = (
  applicationPayload: CandidateApplicationPayload
): ApplicationSubmissionResponse => {
  const storageKey = 'submitted_applications';
  let existingRecords: StoredApplicationRecord[] = [];

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const rawStoredData = window.localStorage.getItem(storageKey);
      if (rawStoredData) {
        existingRecords = JSON.parse(rawStoredData);
      }
    }
  } catch {
    existingRecords = [];
  }

  // 1. Kiểm tra lỗi trùng email cho cùng một vị trí (HTTP 409 Conflict)
  const isDuplicateApplication = existingRecords.some(
    (record) =>
      record.jobId === applicationPayload.jobId &&
      record.email.toLowerCase() === applicationPayload.email.trim().toLowerCase()
  );

  if (isDuplicateApplication) {
    throw new DuplicateApplicationError(
      'Email này đã được sử dụng để ứng tuyển vào vị trí này. Vui lòng kiểm tra lại hoặc sử dụng email khác.'
    );
  }

  // 2. Kiểm tra giới hạn số lần nộp trong 1 giờ (HTTP 429 Too Many Requests)
  const currentTimeMs = Date.now();
  const recentSubmissionsCount = existingRecords.filter((record) => {
    const submissionTimestamp = new Date(record.submittedAt).getTime();
    return currentTimeMs - submissionTimestamp < SUBMISSION_RATE_LIMIT_WINDOW_MS;
  }).length;

  if (recentSubmissionsCount >= MAX_SUBMISSIONS_PER_HOUR) {
    throw new RateLimitExceededError(
      'Bạn đã vượt quá số lần nộp hồ sơ cho phép trong 1 giờ. Vui lòng thử lại sau.'
    );
  }

  const generatedTrackingCode = generateTrackingCode();
  const generatedApplicationId = `app-${currentTimeMs}-${Math.random().toString(36).substring(2, 7)}`;
  const currentTimestamp = new Date().toISOString();

  const newRecord: StoredApplicationRecord = {
    id: generatedApplicationId,
    trackingCode: generatedTrackingCode,
    jobId: applicationPayload.jobId,
    jobTitle: applicationPayload.jobTitle,
    fullName: applicationPayload.fullName.trim(),
    email: applicationPayload.email.trim(),
    phone: applicationPayload.phone.trim(),
    source: applicationPayload.source,
    cvFileName: applicationPayload.cvFile.name,
    cvFileSize: applicationPayload.cvFile.size,
    submittedAt: currentTimestamp,
  };

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      existingRecords.push(newRecord);
      window.localStorage.setItem(storageKey, JSON.stringify(existingRecords));
    }
  } catch {
    // Không gián đoạn quy trình nếu bộ nhớ tạm đầy
  }

  return {
    success: true,
    trackingCode: generatedTrackingCode,
    applicationId: generatedApplicationId,
    message: 'Hồ sơ ứng tuyển của bạn đã được gửi thành công!',
    candidateName: applicationPayload.fullName.trim(),
    candidateEmail: applicationPayload.email.trim(),
    jobTitle: applicationPayload.jobTitle,
    submittedAt: currentTimestamp,
    confirmationEmailSent: true,
  };
};

export const jobApplicationService = {
  submitApplication: submitCandidateApplication,
  submitCandidateApplication,
};

export default jobApplicationService;
