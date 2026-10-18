/**
 * Kiểu dữ liệu và hằng số cho Nhật ký gửi email (Email Audit Log)
 * Jira Task: TKNHTTDNB1-535 / TKNHTTDNB1-78 (User Story S8-02)
 */

export type EmailAuditStatus = 'SENT' | 'FAILED' | 'PENDING';

export type EmailAuditFilterStatus = 'ALL' | 'SENT' | 'FAILED';

export interface EmailAuditLogItem {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle?: string;
  templateId?: string;
  templateType: string;
  templateName: string;
  subject: string;
  body: string;
  senderName: string;
  senderEmail: string;
  status: EmailAuditStatus;
  sentAt: string; // ISO 8601 string
  errorMessage?: string;
  errorCode?: string;
  retryCount: number;
  lastRetryAt?: string;
  attachments?: Array<{
    name: string;
    size: string;
  }>;
}

export const LOCAL_STORAGE_EMAIL_AUDIT_LOGS_KEY = 'smart_recruitment_email_audit_logs';

/**
 * Định dạng ngày giờ chuẩn theo múi giờ Việt Nam (Asia/Ho_Chi_Minh) dạng: HH:mm - DD/MM/YYYY (AC 1)
 */
export const formatVietnamDateTime = (dateString: string): string => {
  if (!dateString) return '--:-- - --/--/----';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const timeStr = timeFormatter.format(date);
    const dateStr = dateFormatter.format(date);

    return `${timeStr} - ${dateStr}`;
  } catch {
    return dateString;
  }
};

/**
 * Dữ liệu nhật ký gửi email mẫu phục vụ kiểm thử và trải nghiệm ban đầu
 */
export const INITIAL_EMAIL_AUDIT_LOGS: EmailAuditLogItem[] = [
  {
    id: 'log-01',
    candidateId: 'sample-01',
    candidateName: 'Nguyễn Văn An',
    candidateEmail: 'an.nguyen@example.com',
    jobTitle: 'Senior Frontend Developer',
    templateId: 'tpl-app-confirmation',
    templateType: 'APPLICATION_CONFIRMATION',
    templateName: 'Xác nhận tiếp nhận hồ sơ ứng tuyển',
    subject: '[Hệ thống Tuyển Dụng Thông Minh] Xác nhận tiếp nhận hồ sơ ứng tuyển vị trí Senior Frontend Developer - Nguyễn Văn An',
    body: `Chào bạn Nguyễn Văn An,\n\nBan Tuyển dụng Hệ thống Tuyển Dụng Thông Minh xin gửi lời cảm ơn chân thành vì bạn đã quan tâm và nộp hồ sơ ứng tuyển vị trí Senior Frontend Developer tại Khối Công nghệ & Phần mềm.\n\nHồ sơ của bạn đã được chuyển đến bộ phận chuyên môn xem xét. Chúng tôi sẽ phản hồi trong vòng 3 - 5 ngày làm việc.\n\nTrân trọng,\nBan Tuyển dụng Nhân tài`,
    senderName: 'Trần Thu Hà',
    senderEmail: 'ha.tran@smart-recruitment.vn',
    status: 'SENT',
    sentAt: '2026-10-18T08:30:00Z',
    retryCount: 0,
  },
  {
    id: 'log-02',
    candidateId: 'sample-02',
    candidateName: 'Trần Thị Mai',
    candidateEmail: 'mai.tran@invalid-domain-test.vn',
    jobTitle: 'Product Manager (B2B SaaS)',
    templateId: 'tpl-interview-invitation',
    templateType: 'INTERVIEW_INVITATION',
    templateName: 'Thư mời tham gia phỏng vấn',
    subject: '[Hệ thống Tuyển Dụng Thông Minh] Thư mời tham gia Vòng 2: Phỏng vấn Kỹ thuật & Chuyên môn - Vị trí Product Manager',
    body: `Chào bạn Trần Thị Mai,\n\nChúng tôi trân trọng kính mời bạn tham gia buổi phỏng vấn trực tiếp cùng Hội đồng Tuyển dụng vào lúc 14:00 - Thứ Sáu, ngày 23/10/2026 tại Phòng họp VIP Diamond, Tầng 12.\n\nVui lòng phản hồi trước 24 giờ diễn ra phỏng vấn.\n\nTrân trọng,\nBan Tuyển dụng Nhân tài`,
    senderName: 'Nguyễn Văn Hùng',
    senderEmail: 'hung.nguyen@smart-recruitment.vn',
    status: 'FAILED',
    sentAt: '2026-10-18T09:15:00Z',
    errorMessage: 'Máy chủ hòm thư người nhận từ chối kết nối (SMTP Error 550: Mailbox unavailable / Domain not found)',
    errorCode: 'SMTP_550_DOMAIN_NOT_FOUND',
    retryCount: 1,
    lastRetryAt: '2026-10-18T09:20:00Z',
  },
  {
    id: 'log-03',
    candidateId: 'sample-03',
    candidateName: 'Lê Quốc Bảo',
    candidateEmail: 'bao.le@example.com',
    jobTitle: 'DevOps / Cloud Engineer',
    templateId: 'tpl-interview-invitation',
    templateType: 'INTERVIEW_INVITATION',
    templateName: 'Thư mời tham gia phỏng vấn',
    subject: '[Hệ thống Tuyển Dụng Thông Minh] Thư mời tham gia Vòng 1: Phỏng vấn Kỹ thuật Sơ bộ - Vị trí DevOps Engineer',
    body: `Chào bạn Lê Quốc Bảo,\n\nBan Tuyển dụng trân trọng mời bạn tham gia phỏng vấn trực tuyến qua Microsoft Teams vào 10:00 - Thứ Hai, ngày 26/10/2026.\nLink tham gia: https://teams.microsoft.com/l/meetup-join/cloud-interview\n\nTrân trọng,\nBan Tuyển dụng Nhân tài`,
    senderName: 'Trần Thu Hà',
    senderEmail: 'ha.tran@smart-recruitment.vn',
    status: 'SENT',
    sentAt: '2026-10-17T14:45:00Z',
    retryCount: 0,
  },
  {
    id: 'log-04',
    candidateId: 'sample-04',
    candidateName: 'Phạm Minh Tuấn',
    candidateEmail: 'tuan.pham@timeout-mail-server.com',
    jobTitle: 'Backend Golang Developer',
    templateId: 'tpl-rejection',
    templateType: 'REJECTION',
    templateName: 'Thư từ chối ứng viên lịch sự & Chuyên nghiệp',
    subject: '[Hệ thống Tuyển Dụng Thông Minh] Thư cảm ơn & Thông báo kết quả ứng tuyển vị trí Backend Golang Developer',
    body: `Kính gửi Phạm Minh Tuấn,\n\nLời đầu tiên, Ban Tuyển dụng xin gửi lời cảm ơn chân thành vì bạn đã dành thời gian tham gia ứng tuyển. Sau quá trình cân nhắc kỹ lưỡng, chúng tôi rất tiếc phải thông báo hiện tại hồ sơ của bạn chưa phù hợp nhất với các tiêu chí đặc thù của dự án đợt này.\n\nThông tin của bạn đã được lưu trữ trong Talent Pool để ưu tiên liên hệ cho các cơ hội phù hợp sắp tới.\n\nTrân trọng,\nBan Tuyển dụng`,
    senderName: 'Lê Hoàng Nam',
    senderEmail: 'nam.le@smart-recruitment.vn',
    status: 'FAILED',
    sentAt: '2026-10-17T16:20:00Z',
    errorMessage: 'Quá thời gian chờ phản hồi từ cổng chuyển tiếp thư điện tử (Connection timeout after 30000ms)',
    errorCode: 'SMTP_GATEWAY_TIMEOUT',
    retryCount: 0,
  },
  {
    id: 'log-05',
    candidateId: 'sample-01',
    candidateName: 'Nguyễn Văn An',
    candidateEmail: 'an.nguyen@example.com',
    jobTitle: 'Senior Frontend Developer',
    templateId: 'tpl-thank-you',
    templateType: 'POST_INTERVIEW_THANK_YOU',
    templateName: 'Thư cảm ơn sau buổi phỏng vấn',
    subject: '[Hệ thống Tuyển Dụng Thông Minh] Thư cảm ơn sau buổi phỏng vấn chuyên môn - Nguyễn Văn An',
    body: `Chào bạn Nguyễn Văn An,\n\nBan Tuyển dụng xin gửi lời cảm ơn bạn đã dành thời gian tham gia buổi phỏng vấn hôm nay. Kết quả chính thức sẽ được gửi tới bạn qua email trong vòng 3 ngày làm việc tới.\n\nTrân trọng,\nTrần Thu Hà`,
    senderName: 'Trần Thu Hà',
    senderEmail: 'ha.tran@smart-recruitment.vn',
    status: 'SENT',
    sentAt: '2026-10-18T11:00:00Z',
    retryCount: 0,
  },
  {
    id: 'log-06',
    candidateId: 'sample-05',
    candidateName: 'Hoàng Thùy Linh',
    candidateEmail: 'linh.hoang@example.com',
    jobTitle: 'UI/UX Product Designer',
    templateId: 'tpl-offer',
    templateType: 'OFFER_LETTER',
    templateName: 'Thư mời nhận việc & Đề xuất công việc (Job Offer)',
    subject: '[Hệ thống Tuyển Dụng Thông Minh] Thư mời nhận việc - Vị trí UI/UX Product Designer - Hoàng Thùy Linh',
    body: `Thân gửi Hoàng Thùy Linh,\n\nBan Giám đốc rất ấn tượng với năng lực và kinh nghiệm của bạn và trân trọng gửi tới bạn thư mời gia nhập công ty với vị trí UI/UX Product Designer.\nMức lương đề xuất: 32.000.000 VNĐ / tháng.\nNgày bắt đầu: 01/11/2026.\n\nVui lòng phản hồi xác nhận trước 17:00 ngày 25/10/2026.\n\nTrân trọng,\nBan Tuyển dụng Nhân tài`,
    senderName: 'Lê Hoàng Nam',
    senderEmail: 'nam.le@smart-recruitment.vn',
    status: 'SENT',
    sentAt: '2026-10-18T10:15:00Z',
    attachments: [
      { name: 'Thu_Moi_Nhan_Viec_HoangThuyLinh.pdf', size: '1.2 MB' },
      { name: 'Chinh_Sach_Phuc_Loi_2026.pdf', size: '2.4 MB' },
    ],
    retryCount: 0,
  },
];

/**
 * Lấy danh sách nhật ký gửi email từ LocalStorage (hoặc khởi tạo mặc định)
 */
export const getStoredEmailAuditLogs = (): EmailAuditLogItem[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_EMAIL_AUDIT_LOGS_KEY);
    if (!raw) return INITIAL_EMAIL_AUDIT_LOGS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_EMAIL_AUDIT_LOGS;
  } catch {
    return INITIAL_EMAIL_AUDIT_LOGS;
  }
};

/**
 * Lưu danh sách nhật ký gửi email vào LocalStorage
 */
export const saveStoredEmailAuditLogs = (logs: EmailAuditLogItem[]): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_EMAIL_AUDIT_LOGS_KEY, JSON.stringify(logs));
  } catch {
    // Bỏ qua lỗi hạn mức lưu trữ
  }
};

/**
 * Khôi phục danh sách nhật ký về dữ liệu ban đầu
 */
export const resetStoredEmailAuditLogs = (): EmailAuditLogItem[] => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_EMAIL_AUDIT_LOGS_KEY);
  } catch {
    // Bỏ qua lỗi
  }
  return INITIAL_EMAIL_AUDIT_LOGS;
};

