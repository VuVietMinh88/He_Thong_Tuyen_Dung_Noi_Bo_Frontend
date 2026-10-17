import type { AppNotificationItem } from '../types/notification';

/**
 * Danh mục đường dẫn (Routes) cho các đối tượng trong thông báo hệ thống
 * Jira Subtask: TKNHTTDNB1-542 - Tích hợp mở đúng đối tượng từ thông báo (Story TKNHTTDNB1-79)
 * 
 * LƯU Ý QUAN TRỌNG:
 * Màn hình lịch phỏng vấn do thành viên khác (Duy Mạnh / Tuấn Minh) phụ trách phát triển,
 * do đó các route paths được khai báo tập trung thành Constants riêng biệt tại đây
 * để dễ dàng điều chỉnh đường dẫn tương ứng khi ghép mã nguồn giữa các nhánh tính năng.
 */
export const NOTIFICATION_ROUTE_PATHS = {
  // 1. Yêu cầu tuyển dụng & Tin tuyển dụng (Recruitment Requisitions & Job Postings)
  JOB_POSTING_LIST: '/job-postings',
  JOB_POSTING_DETAIL: '/job-postings/:id',
  JOB_POSTING_REVIEW: '/job-postings/:id/review',
  JOB_POSTING_CREATE: '/job-postings/create',
  REQUISITION_LIST: '/jobs',
  REQUISITION_DETAIL: '/jobs/:id',

  // 2. Chi tiết ứng viên & Hồ sơ ứng tuyển (Candidate Details & Profiles)
  CANDIDATE_LIST: '/candidates',
  CANDIDATE_DETAIL: '/candidates/:id',
  CANDIDATE_EVALUATION: '/candidates/:id/evaluation-summary',

  // 3. Màn hình lịch phỏng vấn (Interview Schedule - Duy Mạnh / Tuấn Minh phụ trách)
  // Khai báo độc lập để dễ dàng cập nhật khi đổi route, ví dụ '/interviews/personal' hoặc '/interview-schedule'
  INTERVIEW_SCHEDULE: '/interviews',
  INTERVIEW_DETAIL: '/interviews/:id',

  // 4. Thư offer & Phê duyệt đề nghị tuyển dụng (Offer Approval)
  OFFER_APPROVAL_DETAIL: '/offers/:id/approval',
  OFFER_APPROVAL_LIST: '/offers/approval',

  // 5. Đường dẫn điều hướng dự phòng
  UNAUTHORIZED: '/unauthorized',
  DASHBOARD: '/dashboard',
} as const;

/**
 * Các hàm helper tạo URL đối tượng cụ thể từ identifier
 */
export const buildNotificationRoute = {
  jobPostingReview: (postingId: string): string =>
    `/job-postings/${encodeURIComponent(postingId)}/review`,

  jobPostingDetail: (postingId: string): string =>
    `/job-postings/${encodeURIComponent(postingId)}`,

  requisitionDetail: (jobId: string): string =>
    `/jobs/${encodeURIComponent(jobId)}`,

  candidateDetail: (candidateId: string): string =>
    `/candidates/${encodeURIComponent(candidateId)}`,

  candidateEvaluation: (candidateId: string): string =>
    `/candidates/${encodeURIComponent(candidateId)}/evaluation-summary`,

  // Đường dẫn phỏng vấn: hỗ trợ param query để focus trực tiếp vào buổi phỏng vấn
  interviewSchedule: (): string =>
    NOTIFICATION_ROUTE_PATHS.INTERVIEW_SCHEDULE,

  interviewDetail: (interviewId: string): string =>
    `${NOTIFICATION_ROUTE_PATHS.INTERVIEW_SCHEDULE}?interviewId=${encodeURIComponent(interviewId)}`,

  offerApprovalDetail: (offerId: string): string =>
    `/offers/${encodeURIComponent(offerId)}/approval`,

  offerApprovalList: (): string =>
    NOTIFICATION_ROUTE_PATHS.OFFER_APPROVAL_LIST,

  unauthorized: (): string =>
    NOTIFICATION_ROUTE_PATHS.UNAUTHORIZED,

  dashboard: (): string =>
    NOTIFICATION_ROUTE_PATHS.DASHBOARD,
};

/**
 * Trích xuất identifier từ metadata thông báo theo các key thông dụng
 */
const extractMetadataIdentifier = (
  metadata: Record<string, unknown> | undefined,
  candidateKeys: string[]
): string | null => {
  if (!metadata) return null;
  for (const candidateKey of candidateKeys) {
    const rawValue = metadata[candidateKey];
    if (typeof rawValue === 'string' && rawValue.trim().length > 0) {
      return rawValue.trim();
    }
    if (typeof rawValue === 'number') {
      return String(rawValue);
    }
  }
  return null;
};

/**
 * Hàm phân giải và xác định URL đối tượng đích từ thông tin thông báo
 * Hỗ trợ fallback thông minh dựa trên type và metadata khi targetUrl chưa được định cấu hình
 */
export const resolveNotificationTargetUrl = (
  notificationItem: AppNotificationItem
): string => {
  // 1. Nếu thông báo đã có targetUrl cụ thể và hợp lệ
  if (notificationItem.targetUrl && notificationItem.targetUrl.trim().length > 0) {
    const trimmedUrl = notificationItem.targetUrl.trim();

    // Thay thế placeholder :id nếu có trong template URL
    if (trimmedUrl.includes(':id')) {
      const entityId = extractMetadataIdentifier(notificationItem.metadata, [
        'id',
        'offerId',
        'offerCode',
        'candidateId',
        'interviewId',
        'postingId',
        'jobId',
      ]);
      if (entityId) {
        return trimmedUrl.replace(':id', encodeURIComponent(entityId));
      }
    }
    return trimmedUrl;
  }

  const { type, metadata } = notificationItem;

  // 2. Phân giải theo loại đối tượng thông báo (AC 1)
  switch (type) {
    case 'OFFER': {
      const offerId = extractMetadataIdentifier(metadata, ['offerId', 'offerCode', 'id']);
      return offerId
        ? buildNotificationRoute.offerApprovalDetail(offerId)
        : buildNotificationRoute.offerApprovalList();
    }

    case 'CANDIDATE': {
      const candidateId = extractMetadataIdentifier(metadata, ['candidateId', 'id']);
      return candidateId
        ? buildNotificationRoute.candidateDetail(candidateId)
        : NOTIFICATION_ROUTE_PATHS.CANDIDATE_LIST;
    }

    case 'INTERVIEW': {
      // Phụ trách bởi Duy Mạnh / Tuấn Minh - Mở màn hình lịch phỏng vấn
      const interviewId = extractMetadataIdentifier(metadata, ['interviewId', 'id']);
      return interviewId
        ? buildNotificationRoute.interviewDetail(interviewId)
        : buildNotificationRoute.interviewSchedule();
    }

    case 'JOB_POSTING': {
      const postingId = extractMetadataIdentifier(metadata, ['postingId', 'id']);
      const jobId = extractMetadataIdentifier(metadata, ['jobId']);
      if (postingId) {
        return buildNotificationRoute.jobPostingReview(postingId);
      }
      if (jobId) {
        return buildNotificationRoute.requisitionDetail(jobId);
      }
      return NOTIFICATION_ROUTE_PATHS.JOB_POSTING_LIST;
    }

    case 'SLA_WARNING': {
      const candidateId = extractMetadataIdentifier(metadata, ['candidateId', 'id']);
      return candidateId
        ? buildNotificationRoute.candidateDetail(candidateId)
        : NOTIFICATION_ROUTE_PATHS.CANDIDATE_LIST;
    }

    case 'SYSTEM':
    default:
      return NOTIFICATION_ROUTE_PATHS.DASHBOARD;
  }
};
