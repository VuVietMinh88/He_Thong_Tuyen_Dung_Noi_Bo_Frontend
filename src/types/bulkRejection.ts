import type { CandidateStage } from './candidate';

export const LOCAL_STORAGE_SENT_REJECTIONS_KEY = 'smart_recruitment_sent_rejections';
export const LOCAL_STORAGE_BULK_HISTORY_KEY = 'smart_recruitment_bulk_rejection_history';

export type BulkRejectionItemStatus = 'SUCCESS' | 'SKIPPED' | 'FAILED';

export interface BulkRejectionItemResult {
  candidateId: string;
  applicationId?: string;
  candidateName: string;
  email: string;
  jobTitle?: string;
  departmentName?: string;
  status: BulkRejectionItemStatus;
  message: string;
  sentAt?: string;
  previousRejectionDate?: string;
  errorDetails?: string;
  emailSubject?: string;
  emailBody?: string;
}

export interface BulkRejectionBatchResult {
  batchId: string;
  totalProcessed: number;
  successCount: number;
  skippedCount: number;
  failedCount: number;
  processedAt: string;
  items: BulkRejectionItemResult[];
}

export interface SendBulkRejectionCandidateParam {
  candidateId: string;
  applicationId?: string;
  candidateName: string;
  email: string;
  jobTitle?: string;
  departmentName?: string;
  customEmailSubject?: string;
  customEmailBody?: string;
  isDuplicate?: boolean;
  previousSentAt?: string;
}

export interface SendBulkRejectionPayload {
  batchTitle?: string;
  templateId?: string;
  reason: string;
  customNote?: string;
  allowDuplicateRejection?: boolean;
  overrideReason?: string;
  companyName?: string;
  recruiterName?: string;
  candidates: SendBulkRejectionCandidateParam[];
}

export interface StoredSentRejectionRecord {
  candidateId: string;
  email: string;
  jobTitle?: string;
  reason: string;
  sentAt: string;
  overrideReason?: string;
  emailSubject?: string;
  emailBody?: string;
}

export interface BulkRejectionCandidateItem {
  id: string;
  applicationId?: string;
  fullName: string;
  email: string;
  phone?: string;
  appliedJobTitle?: string;
  departmentName?: string;
  currentStage?: CandidateStage;
  appliedAt?: string;
  interviewDate?: string;
  hasReceivedRejectionEmail?: boolean;
  rejectionSentAt?: string;
  previousRejectionReason?: string;
}

export interface RejectionEmailTemplate {
  id: string;
  name: string;
  stageType: 'SCREENING' | 'INTERVIEW' | 'FINAL' | 'CUSTOM';
  description: string;
  defaultSubject: string;
  defaultBody: string;
}

/**
 * 4 Mẫu thư từ chối chuẩn hóa, chuyên nghiệp & lịch sự (AC 2)
 */
export const DEFAULT_REJECTION_TEMPLATES: RejectionEmailTemplate[] = [
  {
    id: 'tpl-screening',
    name: 'Từ chối sau sàng lọc CV',
    stageType: 'SCREENING',
    description: 'Dành cho ứng viên chưa phù hợp yêu cầu vòng hồ sơ, động viên ứng tuyển cơ hội khác',
    defaultSubject: '[{CONG_TY}] Thư cảm ơn & Thông báo kết quả ứng tuyển vị trí {VI_TRI} - {HO_TEN}',
    defaultBody: `Chào bạn {HO_TEN},

Lời đầu tiên, Ban Tuyển dụng {CONG_TY} xin gửi lời cảm ơn chân thành vì bạn đã quan tâm và nộp hồ sơ ứng tuyển vị trí {VI_TRI} tại {PHONG_BAN}.

Chúng tôi rất trân trọng thời gian và sự nỗ lực bạn đã dành để chuẩn bị hồ sơ. Sau quá trình rà soát và đánh giá kỹ lưỡng dựa trên các tiêu chí chuyên môn cho đợt tuyển dụng lần này, chúng tôi rất tiếc phải thông báo hiện tại hồ sơ của bạn chưa thật sự phù hợp nhất với các yêu cầu cốt lõi của vị trí.

Dù chưa có cơ hội hợp tác trong đợt này, chúng tôi đánh giá cao tiềm năng của bạn và xin phép lưu giữ thông tin hồ sơ trong Hệ thống Dữ liệu Nhân tài (Talent Pool) của {CONG_TY}. Khi có các vị trí mới phù hợp hơn với kỹ năng và định hướng phát triển của bạn, chúng tôi sẽ chủ động liên hệ.

Chúc bạn luôn dồi dào sức khỏe, may mắn và gặt hái nhiều thành công rực rỡ trên con đường sự nghiệp!

Trân trọng,
{NGUOI_GUI}
{CONG_TY}`,
  },
  {
    id: 'tpl-interview',
    name: 'Từ chối sau phỏng vấn chuyên môn',
    stageType: 'INTERVIEW',
    description: 'Dành cho ứng viên đã tham gia phỏng vấn kỹ thuật, ghi nhận năng lực và đánh giá cao thời gian',
    defaultSubject: '[{CONG_TY}] Thông báo kết quả phỏng vấn vị trí {VI_TRI} - {HO_TEN}',
    defaultBody: `Chào bạn {HO_TEN},

Hội đồng phỏng vấn và Ban Tuyển dụng {CONG_TY} xin gửi lời cảm ơn sâu sắc vì bạn đã dành thời gian tham gia buổi phỏng vấn vị trí {VI_TRI} vừa qua.

Hội đồng đánh giá rất cao năng lực chuyên môn, thái độ làm việc nghiêm túc và những chia sẻ tâm huyết của bạn trong buổi trao đổi. Tuy nhiên, sau khi cân nhắc kỹ lưỡng giữa mục tiêu của dự án hiện tại và tổng thể các ứng viên tham gia, chúng tôi rất tiếc phải thông báo chưa thể đồng hành cùng bạn ở bước tiếp theo trong đợt tuyển dụng này.

Hồ sơ và kết quả đánh giá tích cực của bạn sẽ được lưu giữ bảo mật trong Hệ thống Nhân tài của chúng tôi để ưu tiên liên hệ cho các cơ hội tiếp theo phù hợp hơn.

Cảm ơn bạn một lần nữa vì sự quan tâm dành cho {CONG_TY}. Chúc bạn luôn giữ vững ngọn lửa đam mê nghề nghiệp và sớm tìm được cơ hội phát triển vượt bậc!

Trân trọng,
{NGUOI_GUI}
{CONG_TY}`,
  },
  {
    id: 'tpl-final',
    name: 'Từ chối sau vòng phỏng vấn cuối',
    stageType: 'FINAL',
    description: 'Dành cho ứng viên đã vào vòng cuối, bày tỏ sự trân trọng đặc biệt và duy trì kết nối mạng lưới',
    defaultSubject: '[{CONG_TY}] Thư cảm ơn quá trình ứng tuyển vị trí {VI_TRI} - {HO_TEN}',
    defaultBody: `Chào bạn {HO_TEN},

Ban Lãnh đạo và Phòng Tuyển dụng {CONG_TY} xin gửi lời tri ân chân thành nhất tới bạn vì sự đồng hành kiên trì qua các vòng phỏng vấn tuyển chọn vị trí {VI_TRI}.

Việc bạn đi đến vòng phỏng vấn cuối cùng đã minh chứng rõ nét cho năng lực xuất sắc và sự chuyên nghiệp của bạn. Đây là một quyết định vô cùng khó khăn đối với Hội đồng Tuyển dụng khi phải lựa chọn giữa các ứng viên tài năng. Rất tiếc, do một vài yếu tố đặc thù về giai đoạn hiện tại của tổ chức, chúng tôi chưa thể gửi lời đề nghị hợp tác (Offer) tới bạn lần này.

Chúng tôi vô cùng ấn tượng với bạn và mong muốn tiếp tục duy trì mối quan hệ kết nối mạng lưới nghề nghiệp bền chặt. Khi có cơ hội phù hợp trong tương lai, bạn sẽ là một trong những ứng viên ưu tiên hàng đầu của chúng tôi.

Kính chúc bạn luôn dồi dào sức khỏe, hạnh phúc và thành công vang dội trong mọi kế hoạch sắp tới!

Trân trọng,
{NGUOI_GUI}
{CONG_TY}`,
  },
  {
    id: 'tpl-custom',
    name: 'Mẫu tùy chỉnh riêng',
    stageType: 'CUSTOM',
    description: 'Tự do chỉnh sửa tiêu đề và nội dung thông điệp gửi đến ứng viên',
    defaultSubject: '[{CONG_TY}] Thông báo kết quả ứng tuyển vị trí {VI_TRI} - {HO_TEN}',
    defaultBody: `Chào bạn {HO_TEN},

Cảm ơn bạn đã quan tâm và ứng tuyển vị trí {VI_TRI} tại {CONG_TY}.

Rất tiếc thời điểm hiện tại chúng tôi chưa thể tiếp tục hồ sơ của bạn cho vị trí này. Chúng tôi xin phép lưu lại thông tin để liên hệ khi có cơ hội phù hợp trong tương lai.

Chúc bạn nhiều may mắn và luôn thành công!

Trân trọng,
{NGUOI_GUI}
{CONG_TY}`,
  },
];

export const STANDARDIZED_REJECTION_REASONS = [
  'Không phù hợp với tiêu chí kỹ thuật / chuyên môn',
  'Kinh nghiệm chưa đáp ứng yêu cầu dự án',
  'Mức đãi ngộ chưa đạt được sự thống nhất',
  'Thời gian có thể bắt đầu làm việc chưa phù hợp',
  'Vị trí tuyển dụng đã đủ chỉ tiêu',
  'Chưa phù hợp với văn hóa / phong cách làm việc của đội ngũ',
  'Lý do khác',
];

/**
 * Đọc danh sách các ứng viên đã nhận thư từ chối trong LocalStorage (AC 3)
 */
export const getStoredSentRejections = (): StoredSentRejectionRecord[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SENT_REJECTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/**
 * Lưu danh sách gửi thư từ chối vào LocalStorage (AC 3)
 */
export const saveStoredSentRejections = (records: StoredSentRejectionRecord[]): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_SENT_REJECTIONS_KEY, JSON.stringify(records));
  } catch {
    // Bỏ qua lỗi lưu storage
  }
};

/**
 * Xóa sạch lịch sử gửi thư từ chối (dùng trong unit test / reset)
 */
export const clearStoredSentRejections = (): void => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_SENT_REJECTIONS_KEY);
  } catch {
    // Bỏ qua
  }
};

/**
 * Kiểm tra xem một ứng viên đã từng nhận thư từ chối trước đó hay chưa (AC 3)
 */
export const checkIsDuplicateRejection = (
  candidate: BulkRejectionCandidateItem,
  storedRecords?: StoredSentRejectionRecord[],
): { isDuplicate: boolean; sentAt?: string; reason?: string } => {
  if (candidate.hasReceivedRejectionEmail) {
    return {
      isDuplicate: true,
      sentAt: candidate.rejectionSentAt || 'Trước đó',
      reason: candidate.previousRejectionReason,
    };
  }

  const records = storedRecords ?? getStoredSentRejections();
  const matched = records.find(
    (r) =>
      r.candidateId === candidate.id ||
      (r.email && r.email.toLowerCase() === candidate.email.toLowerCase()),
  );

  if (matched) {
    return {
      isDuplicate: true,
      sentAt: matched.sentAt ? new Date(matched.sentAt).toLocaleDateString('vi-VN') : 'Trước đó',
      reason: matched.reason,
    };
  }

  return { isDuplicate: false };
};

/**
 * Hàm cá nhân hóa nội dung email dựa trên dữ liệu thật của ứng viên (AC 2)
 */
export const renderPersonalizedTemplate = (
  templateText: string,
  candidate: BulkRejectionCandidateItem,
  companyName: string,
  recruiterName: string,
  customNote?: string,
): string => {
  let result = templateText
    .replace(/{HO_TEN}/g, candidate.fullName || 'Ứng viên')
    .replace(/{VI_TRI}/g, candidate.appliedJobTitle || 'Vị trí tuyển dụng')
    .replace(/{PHONG_BAN}/g, candidate.departmentName || 'Bộ phận chuyên môn')
    .replace(/{CONG_TY}/g, companyName)
    .replace(/{NGUOI_GUI}/g, recruiterName);

  if (customNote && customNote.trim()) {
    result += `\n\n[Ghi chú từ Ban Tuyển dụng]:\n${customNote.trim()}`;
  }

  return result;
};

/**
 * Đọc lịch sử các đợt gửi thư từ chối hàng loạt từ LocalStorage
 */
export const getStoredBulkHistory = (): BulkRejectionBatchResult[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_BULK_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/**
 * Lưu một đợt gửi vào lịch sử trong LocalStorage
 */
export const saveBulkBatchToHistory = (batch: BulkRejectionBatchResult): void => {
  try {
    const current = getStoredBulkHistory();
    const updated = [batch, ...current.filter((b) => b.batchId !== batch.batchId)];
    localStorage.setItem(LOCAL_STORAGE_BULK_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // Bỏ qua
  }
};

/**
 * Xóa sạch lịch sử các đợt gửi thư từ chối (dùng trong test)
 */
export const clearStoredBulkHistory = (): void => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_BULK_HISTORY_KEY);
  } catch {
    // Bỏ qua
  }
};


