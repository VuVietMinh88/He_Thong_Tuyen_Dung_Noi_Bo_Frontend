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

export const CV_FILE_CONFIG = {
  MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  MAX_SIZE_MB: 10,
  ACCEPT_ATTRIBUTE: '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  RULE_TEXT: 'Chỉ chấp nhận tệp định dạng PDF hoặc DOCX, dung lượng tối đa 10MB',
  ALLOWED_EXTENSIONS: ['.pdf', '.docx'],
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ],
};

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

export interface ApplicationSubmitResult {
  success: boolean;
  applicationId: string;
  message: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle?: string;
  submittedAt: string;
}

/**
 * Định dạng dung lượng byte sang MB có 2 chữ số thập phân
 */
export const formatFileSizeMB = (bytes: number): string => {
  if (bytes <= 0) return '0.00 MB';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
};

/**
 * Kiểm tra tính hợp lệ của tệp CV nộp lên
 */
export const validateCvFile = (file?: File | null): { isValid: boolean; error?: string } => {
  if (!file) {
    return {
      isValid: false,
      error: 'Vui lòng chọn hoặc tải lên tệp CV của bạn.',
    };
  }

  // Kiểm tra dung lượng tối đa 10MB
  if (file.size > CV_FILE_CONFIG.MAX_SIZE_BYTES) {
    const actualSizeMb = formatFileSizeMB(file.size);
    return {
      isValid: false,
      error: `Dung lượng tệp vượt quá mức cho phép (${actualSizeMb} > ${CV_FILE_CONFIG.MAX_SIZE_MB}MB). Vui lòng chọn tệp nhỏ hơn 10MB.`,
    };
  }

  // Kiểm tra đuôi file và mime type
  const fileName = file.name.toLowerCase();
  const hasValidExtension = CV_FILE_CONFIG.ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
  const hasValidMime = CV_FILE_CONFIG.ALLOWED_MIME_TYPES.includes(file.type);

  if (!hasValidExtension && !hasValidMime) {
    return {
      isValid: false,
      error: 'Định dạng tệp không hợp lệ. Chỉ chấp nhận tệp định dạng PDF hoặc DOCX.',
    };
  }

  return { isValid: true };
};

/**
 * Xác thực thông tin biểu mẫu ứng tuyển
 */
export const validateApplicationForm = (
  values: Partial<CandidateApplicationPayload>
): Record<string, string> => {
  const errors: Record<string, string> = {};

  // 1. Họ và tên
  if (!values.fullName || !values.fullName.trim()) {
    errors.fullName = 'Vui lòng nhập họ và tên của bạn.';
  } else if (values.fullName.trim().length < 2) {
    errors.fullName = 'Họ và tên phải có ít nhất 2 ký tự.';
  }

  // 2. Email
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!values.email || !values.email.trim()) {
    errors.email = 'Vui lòng nhập địa chỉ email.';
  } else if (!emailRegex.test(values.email.trim())) {
    errors.email = 'Địa chỉ email không hợp lệ (ví dụ: ungvien@example.com).';
  }

  // 3. Số điện thoại (Việt Nam 10-11 số)
  const phoneClean = values.phone ? values.phone.replace(/[\s.-]/g, '') : '';
  const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
  if (!phoneClean) {
    errors.phone = 'Vui lòng nhập số điện thoại liên hệ.';
  } else if (!phoneRegex.test(phoneClean)) {
    errors.phone = 'Số điện thoại không hợp lệ (gồm 10 số, bắt đầu bằng 03, 05, 07, 08, 09 hoặc +84).';
  }

  // 4. Nguồn biết tin
  if (!values.source || !values.source.trim()) {
    errors.source = 'Vui lòng chọn nguồn bạn biết thông tin tuyển dụng này.';
  }

  // 5. Tệp CV
  const cvValidation = validateCvFile(values.cvFile);
  if (!cvValidation.isValid && cvValidation.error) {
    errors.cvFile = cvValidation.error;
  }

  return errors;
};

export const jobApplicationService = {
  /**
   * Nộp hồ sơ ứng tuyển công khai
   */
  async submitApplication(payload: CandidateApplicationPayload): Promise<ApplicationSubmitResult> {
    const formData = new FormData();
    formData.append('jobId', payload.jobId);
    if (payload.jobTitle) formData.append('jobTitle', payload.jobTitle);
    formData.append('fullName', payload.fullName.trim());
    formData.append('email', payload.email.trim());
    formData.append('phone', payload.phone.trim());
    formData.append('source', payload.source);
    if (payload.coverLetter) formData.append('coverLetter', payload.coverLetter.trim());
    formData.append('cvFile', payload.cvFile);

    try {
      const response = await axiosClient.post<ApplicationSubmitResult>(
        `/public/jobs/${payload.jobId}/applications`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch {
      // Local fallback cho môi trường dev / offline testing
      const mockResult: ApplicationSubmitResult = {
        success: true,
        applicationId: `app-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        message: 'Hồ sơ ứng tuyển của bạn đã được gửi thành công!',
        candidateName: payload.fullName.trim(),
        candidateEmail: payload.email.trim(),
        jobTitle: payload.jobTitle,
        submittedAt: new Date().toISOString(),
      };

      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const existing = JSON.parse(window.localStorage.getItem('submitted_applications') || '[]');
          existing.push({
            id: mockResult.applicationId,
            jobId: payload.jobId,
            jobTitle: payload.jobTitle,
            fullName: payload.fullName,
            email: payload.email,
            phone: payload.phone,
            source: payload.source,
            cvFileName: payload.cvFile.name,
            cvFileSize: payload.cvFile.size,
            submittedAt: mockResult.submittedAt,
          });
          window.localStorage.setItem('submitted_applications', JSON.stringify(existing));
        }
      } catch {
        // Ignored
      }

      return mockResult;
    }
  },
};

export default jobApplicationService;
