export type EmailTemplateType =
  | 'APPLICATION_CONFIRMATION'
  | 'INTERVIEW_INVITATION'
  | 'POST_INTERVIEW_THANK_YOU'
  | 'REJECTION'
  | 'OFFER_LETTER';

export type EmailTemplateStage =
  | 'NEW'
  | 'SCREENING'
  | 'INTERVIEWING'
  | 'OFFER'
  | 'REJECTED';

export interface EmailTemplateItem {
  id: string;
  type: EmailTemplateType;
  name: string;
  stage: EmailTemplateStage;
  stageLabel: string;
  description: string;
  subject: string;
  body: string;
  isAutoSend: boolean; // Công tắc bật/tắt gửi tự động (AC 3)
  applicableRoles: string[];
  updatedAt: string;
  updatedBy?: string;
}

export type EmailVariableCategory =
  | 'CANDIDATE'
  | 'JOB'
  | 'INTERVIEW'
  | 'OFFER'
  | 'SENDER';

export interface EmailVariable {
  key: string;
  name: string;
  category: EmailVariableCategory;
  categoryLabel: string;
  description: string;
  exampleValue: string;
}

export interface SampleCandidateData {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  jobTitle: string;
  departmentName: string;
  companyName: string;
  companyAddress: string;
  interviewTime: string;
  interviewType: string;
  interviewLocation: string;
  interviewers: string;
  interviewRound: string;
  offerSalary: string;
  startDate: string;
  offerDeadline: string;
  recruiterName: string;
  recruiterEmail: string;
  recruiterPhone: string;
}

export const LOCAL_STORAGE_EMAIL_TEMPLATES_KEY = 'smart_recruitment_email_templates';

/**
 * Danh sách các biến động hỗ trợ chèn vào tiêu đề và nội dung thư (AC 2)
 */
export const AVAILABLE_EMAIL_VARIABLES: EmailVariable[] = [
  // 1. Thông tin ứng viên
  {
    key: '{TEN_UNG_VIEN}',
    name: 'Tên ứng viên',
    category: 'CANDIDATE',
    categoryLabel: 'Thông tin ứng viên',
    description: 'Họ và tên đầy đủ của ứng viên',
    exampleValue: 'Nguyễn Văn An',
  },
  {
    key: '{EMAIL_UNG_VIEN}',
    name: 'Email ứng viên',
    category: 'CANDIDATE',
    categoryLabel: 'Thông tin ứng viên',
    description: 'Địa chỉ hòm thư điện tử của ứng viên',
    exampleValue: 'an.nguyen@example.com',
  },
  {
    key: '{SO_DIEN_THOAI}',
    name: 'Số điện thoại',
    category: 'CANDIDATE',
    categoryLabel: 'Thông tin ứng viên',
    description: 'Số điện thoại liên lạc của ứng viên',
    exampleValue: '0901 234 567',
  },

  // 2. Thông tin vị trí & công ty
  {
    key: '{VI_TRI_UNG_TUYEN}',
    name: 'Vị trí tuyển dụng',
    category: 'JOB',
    categoryLabel: 'Vị trí & Công ty',
    description: 'Chức danh công việc ứng viên ứng tuyển',
    exampleValue: 'Senior Frontend Developer',
  },
  {
    key: '{PHONG_BAN}',
    name: 'Phòng ban tuyển dụng',
    category: 'JOB',
    categoryLabel: 'Vị trí & Công ty',
    description: 'Khối hoặc phòng ban chuyên môn',
    exampleValue: 'Khối Công nghệ & Phần mềm',
  },
  {
    key: '{TEN_CONG_TY}',
    name: 'Tên công ty',
    category: 'JOB',
    categoryLabel: 'Vị trí & Công ty',
    description: 'Tên chính thức của doanh nghiệp',
    exampleValue: 'Hệ thống Tuyển Dụng Thông Minh FPT',
  },
  {
    key: '{DIA_CHI_CONG_TY}',
    name: 'Địa chỉ công ty',
    category: 'JOB',
    categoryLabel: 'Vị trí & Công ty',
    description: 'Trụ sở văn phòng làm việc',
    exampleValue: 'Tòa nhà FPT, Phố Duy Tân, Cầu Giấy, Hà Nội',
  },

  // 3. Thông tin lịch phỏng vấn
  {
    key: '{THOI_GIAN_PHONG_VAN}',
    name: 'Thời gian phỏng vấn',
    category: 'INTERVIEW',
    categoryLabel: 'Lịch phỏng vấn',
    description: 'Ngày và giờ diễn ra buổi phỏng vấn',
    exampleValue: '09:30 - Thứ Năm, ngày 22/10/2026',
  },
  {
    key: '{HINH_THUC_PHONG_VAN}',
    name: 'Hình thức phỏng vấn',
    category: 'INTERVIEW',
    categoryLabel: 'Lịch phỏng vấn',
    description: 'Trực tiếp tại văn phòng hoặc Trực tuyến',
    exampleValue: 'Trực tuyến (Google Meet)',
  },
  {
    key: '{DIA_DIEM_PHONG_VAN}',
    name: 'Địa điểm / Link họp',
    category: 'INTERVIEW',
    categoryLabel: 'Lịch phỏng vấn',
    description: 'Phòng họp hoặc đường link liên kết họp trực tuyến',
    exampleValue: 'https://meet.google.com/abc-xyz-123',
  },
  {
    key: '{NGUOI_PHONG_VAN}',
    name: 'Người phỏng vấn',
    category: 'INTERVIEW',
    categoryLabel: 'Lịch phỏng vấn',
    description: 'Thành viên hội đồng phỏng vấn phụ trách',
    exampleValue: 'Nguyễn Văn Hùng (Tech Lead), Trần Thu Hà (HR Manager)',
  },
  {
    key: '{VONG_PHONG_VAN}',
    name: 'Vòng phỏng vấn',
    category: 'INTERVIEW',
    categoryLabel: 'Lịch phỏng vấn',
    description: 'Tên vòng phỏng vấn chuyên môn',
    exampleValue: 'Vòng 2: Phỏng vấn Kỹ thuật & Chuyên môn',
  },

  // 4. Chế độ đãi ngộ & Offer
  {
    key: '{MUC_LUONG_OFFER}',
    name: 'Mức lương đề xuất',
    category: 'OFFER',
    categoryLabel: 'Đãi ngộ & Offer',
    description: 'Mức lương thỏa thuận ghi trong thư đề xuất',
    exampleValue: '35.000.000 VNĐ / tháng (Gross)',
  },
  {
    key: '{NGAY_BAT_DAU}',
    name: 'Ngày nhận việc dự kiến',
    category: 'OFFER',
    categoryLabel: 'Đãi ngộ & Offer',
    description: 'Ngày đầu tiên bắt đầu đi làm (Onboarding)',
    exampleValue: '01/11/2026',
  },
  {
    key: '{HAN_PHAN_HOI}',
    name: 'Hạn phản hồi offer',
    category: 'OFFER',
    categoryLabel: 'Đãi ngộ & Offer',
    description: 'Thời hạn cuối cùng để ứng viên xác nhận thư mời nhận việc',
    exampleValue: '17:00 ngày 26/10/2026',
  },

  // 5. Thông tin người phụ trách
  {
    key: '{NGUOI_LIEN_HE}',
    name: 'Tên người liên hệ (HR)',
    category: 'SENDER',
    categoryLabel: 'Người liên hệ',
    description: 'Tên chuyên viên hoặc ban tuyển dụng gửi thư',
    exampleValue: 'Ban Tuyển dụng Nhân tài',
  },
  {
    key: '{EMAIL_LIEN_HE}',
    name: 'Email tuyển dụng',
    category: 'SENDER',
    categoryLabel: 'Người liên hệ',
    description: 'Hòm thư tiếp nhận phản hồi',
    exampleValue: 'tuyendung@smart-recruitment.vn',
  },
  {
    key: '{SO_DIEN_THOAI_LIEN_HE}',
    name: 'Hotline tuyển dụng',
    category: 'SENDER',
    categoryLabel: 'Người liên hệ',
    description: 'Đường dây nóng hỗ trợ ứng viên',
    exampleValue: '024 7300 8888',
  },
];

/**
 * Danh sách ứng viên mẫu dùng cho Live Preview thời gian thực (AC 2)
 */
export const SAMPLE_CANDIDATES: SampleCandidateData[] = [
  {
    id: 'sample-01',
    candidateName: 'Nguyễn Văn An',
    candidateEmail: 'an.nguyen@example.com',
    candidatePhone: '0901 234 567',
    jobTitle: 'Senior Frontend Developer',
    departmentName: 'Khối Công nghệ & Phần mềm',
    companyName: 'Hệ thống Tuyển Dụng Thông Minh',
    companyAddress: 'Tòa nhà FPT, Phố Duy Tân, Cầu Giấy, Hà Nội',
    interviewTime: '09:30 - Thứ Năm, ngày 22/10/2026',
    interviewType: 'Trực tuyến (Google Meet)',
    interviewLocation: 'https://meet.google.com/abc-xyz-123',
    interviewers: 'Nguyễn Văn Hùng (Tech Lead), Trần Thu Hà (HR Manager)',
    interviewRound: 'Vòng 2: Phỏng vấn Kỹ thuật & Chuyên môn',
    offerSalary: '35.000.000 VNĐ / tháng (Gross)',
    startDate: '01/11/2026',
    offerDeadline: '17:00 ngày 26/10/2026',
    recruiterName: 'Ban Tuyển dụng Nhân tài',
    recruiterEmail: 'tuyendung@smart-recruitment.vn',
    recruiterPhone: '024 7300 8888',
  },
  {
    id: 'sample-02',
    candidateName: 'Trần Thị Mai',
    candidateEmail: 'mai.tran@example.com',
    candidatePhone: '0988 765 432',
    jobTitle: 'Product Manager (B2B SaaS)',
    departmentName: 'Phòng Phát triển Sản phẩm',
    companyName: 'Hệ thống Tuyển Dụng Thông Minh',
    companyAddress: 'Tòa nhà Innovation, Khu Công Nghệ Cao, TP. Thủ Đức, TP.HCM',
    interviewTime: '14:00 - Thứ Sáu, ngày 23/10/2026',
    interviewType: 'Trực tiếp tại văn phòng',
    interviewLocation: 'Phòng họp VIP Diamond, Tầng 12',
    interviewers: 'Lê Hoàng Nam (Head of Product), Vũ Thùy Linh (HRBP)',
    interviewRound: 'Vòng 3: Phỏng vấn Giám đốc Sản phẩm',
    offerSalary: '45.000.000 VNĐ / tháng (Gross)',
    startDate: '15/11/2026',
    offerDeadline: '17:00 ngày 28/10/2026',
    recruiterName: 'Phòng Tuyển dụng FPT Smart',
    recruiterEmail: 'careers@smart-recruitment.vn',
    recruiterPhone: '028 7300 9999',
  },
  {
    id: 'sample-03',
    candidateName: 'Lê Quốc Bảo',
    candidateEmail: 'bao.le@example.com',
    candidatePhone: '0912 345 678',
    jobTitle: 'DevOps / Cloud Engineer',
    departmentName: 'Trung tâm Hạ tầng & Điện toán đám mây',
    companyName: 'Hệ thống Tuyển Dụng Thông Minh',
    companyAddress: 'Tòa nhà FPT, Phố Duy Tân, Cầu Giấy, Hà Nội',
    interviewTime: '10:00 - Thứ Hai, ngày 26/10/2026',
    interviewType: 'Trực tuyến (Microsoft Teams)',
    interviewLocation: 'https://teams.microsoft.com/l/meetup-join/cloud-interview',
    interviewers: 'Hoàng Minh Tuấn (Cloud Architect)',
    interviewRound: 'Vòng 1: Phỏng vấn Kỹ thuật Sơ bộ',
    offerSalary: '38.000.000 VNĐ / tháng (Gross)',
    startDate: '01/12/2026',
    offerDeadline: '17:00 ngày 30/10/2026',
    recruiterName: 'Ban Tuyển dụng Nhân tài',
    recruiterEmail: 'tuyendung@smart-recruitment.vn',
    recruiterPhone: '024 7300 8888',
  },
];

/**
 * 5 Mẫu email chuẩn theo các giai đoạn cốt lõi (AC 1)
 */
export const DEFAULT_EMAIL_TEMPLATES: EmailTemplateItem[] = [
  // 1. Xác nhận đã nhận hồ sơ (AC 1)
  {
    id: 'tpl-app-confirmation',
    type: 'APPLICATION_CONFIRMATION',
    name: 'Xác nhận tiếp nhận hồ sơ ứng tuyển',
    stage: 'NEW',
    stageLabel: 'Hồ sơ mới / Nộp đơn',
    description: 'Tự động gửi ngay khi ứng viên nộp hồ sơ thành công vào hệ thống, tạo ấn tượng chuyên nghiệp ban đầu',
    isAutoSend: true,
    applicableRoles: ['ADMIN', 'HR_MANAGER', 'RECRUITER'],
    updatedAt: '2026-10-18T10:00:00.000Z',
    updatedBy: 'Hệ thống tự động',
    subject: '[{TEN_CONG_TY}] Xác nhận tiếp nhận hồ sơ ứng tuyển vị trí {VI_TRI_UNG_TUYEN} - {TEN_UNG_VIEN}',
    body: `Chào bạn {TEN_UNG_VIEN},

Ban Tuyển dụng {TEN_CONG_TY} xin gửi lời cảm ơn chân thành vì bạn đã quan tâm và nộp hồ sơ ứng tuyển vị trí {VI_TRI_UNG_TUYEN} tại {PHONG_BAN}.

Chúng tôi xin thông báo hồ sơ của bạn đã được tiếp nhận thành công vào hệ thống dữ liệu tuyển dụng. Đội ngũ chuyên môn sẽ xem xét kỹ lưỡng thông tin, kỹ năng và kinh nghiệm của bạn dựa trên yêu cầu của vị trí trong vòng 3 - 5 ngày làm việc.

Nếu hồ sơ đáp ứng các tiêu chuẩn đợt này, Ban Tuyển dụng sẽ chủ động liên hệ trực tiếp với bạn qua email này hoặc số điện thoại {SO_DIEN_THOAI} để mời tham gia vòng trao đổi tiếp theo.

Chúc bạn luôn dồi dào năng lượng và may mắn!

Trân trọng,
{NGUOI_LIEN_HE}
{TEN_CONG_TY}
Email: {EMAIL_LIEN_HE}
Hotline: {SO_DIEN_THOAI_LIEN_HE}`,
  },

  // 2. Thư mời phỏng vấn (AC 1)
  {
    id: 'tpl-interview-invitation',
    type: 'INTERVIEW_INVITATION',
    name: 'Thư mời tham gia phỏng vấn',
    stage: 'INTERVIEWING',
    stageLabel: 'Phỏng vấn',
    description: 'Gửi thư mời phỏng vấn chính thức gồm thời gian, địa điểm, link họp online và thành phần người phỏng vấn',
    isAutoSend: true,
    applicableRoles: ['ADMIN', 'HR_MANAGER', 'RECRUITER'],
    updatedAt: '2026-10-18T10:00:00.000Z',
    updatedBy: 'Hệ thống tự động',
    subject: '[{TEN_CONG_TY}] Thư mời tham gia {VONG_PHONG_VAN} - Vị trí {VI_TRI_UNG_TUYEN}',
    body: `Chào bạn {TEN_UNG_VIEN},

Lời đầu tiên, Ban Tuyển dụng {TEN_CONG_TY} xin chúc mừng bạn đã xuất sắc vượt qua vòng xét duyệt hồ sơ cho vị trí {VI_TRI_UNG_TUYEN} tại {PHONG_BAN}.

Chúng tôi trân trọng kính mời bạn tham gia buổi phỏng vấn trực tiếp cùng Hội đồng Tuyển dụng với thông tin chi tiết như sau:

• Vòng phỏng vấn: {VONG_PHONG_VAN}
• Thời gian: {THOI_GIAN_PHONG_VAN}
• Hình thức: {HINH_THUC_PHONG_VAN}
• Địa điểm / Đường link: {DIA_DIEM_PHONG_VAN}
• Hội đồng phỏng vấn: {NGUOI_PHONG_VAN}

Vui lòng chuẩn bị thiết bị kết nối ổn định và phản hồi lại email này để xác nhận sự tham gia của bạn trước 24 giờ diễn ra buổi phỏng vấn. Nếu bạn cần điều chỉnh lịch hẹn vì lý do bất khả kháng, xin vui lòng thông báo sớm qua hotline {SO_DIEN_THOAI_LIEN_HE}.

Rất mong được gặp gỡ và trao đổi cùng bạn!

Trân trọng,
{NGUOI_LIEN_HE}
{TEN_CONG_TY}
Email: {EMAIL_LIEN_HE}
Hotline: {SO_DIEN_THOAI_LIEN_HE}`,
  },

  // 3. Cảm ơn sau phỏng vấn (AC 1)
  {
    id: 'tpl-post-interview-thank-you',
    type: 'POST_INTERVIEW_THANK_YOU',
    name: 'Thư cảm ơn sau buổi phỏng vấn',
    stage: 'INTERVIEWING',
    stageLabel: 'Sau phỏng vấn',
    description: 'Gửi thư cảm ơn sau khi hoàn thành buổi phỏng vấn, thông báo thời gian dự kiến trả kết quả để duy trì trải nghiệm tốt',
    isAutoSend: false,
    applicableRoles: ['ADMIN', 'HR_MANAGER', 'RECRUITER'],
    updatedAt: '2026-10-18T10:00:00.000Z',
    updatedBy: 'Hệ thống tự động',
    subject: '[{TEN_CONG_TY}] Lời cảm ơn sau buổi phỏng vấn vị trí {VI_TRI_UNG_TUYEN} - {TEN_UNG_VIEN}',
    body: `Chào bạn {TEN_UNG_VIEN},

Hội đồng phỏng vấn và Ban Tuyển dụng {TEN_CONG_TY} xin gửi lời cảm ơn chân thành vì bạn đã dành thời gian quý báu tham gia buổi phỏng vấn vị trí {VI_TRI_UNG_TUYEN} vừa qua.

Chúng tôi rất ấn tượng trước phong cách làm việc chuyên nghiệp cũng như những chia sẻ tâm huyết của bạn trong buổi trao đổi. Hiện tại, Hội đồng đang tổng hợp đánh giá và cân nhắc phương án tối ưu nhất.

Kết quả chính thức của vòng phỏng vấn sẽ được gửi tới bạn qua email trong vòng 3 - 5 ngày làm việc tới. Nếu có bất kỳ câu hỏi nào trong thời gian này, bạn đừng ngần ngại phản hồi lại email này.

Chúc bạn một tuần làm việc tràn đầy năng lượng và hiệu quả!

Trân trọng,
{NGUOI_LIEN_HE}
{TEN_CONG_TY}
Email: {EMAIL_LIEN_HE}
Hotline: {SO_DIEN_THOAI_LIEN_HE}`,
  },

  // 4. Thư từ chối (AC 1)
  {
    id: 'tpl-rejection',
    type: 'REJECTION',
    name: 'Thư từ chối ứng viên lịch sự & Chuyên nghiệp',
    stage: 'REJECTED',
    stageLabel: 'Từ chối / Talent Pool',
    description: 'Từ chối một cách nhã nhặn, tôn trọng, giải thích lý do khéo léo và đề nghị lưu hồ sơ vào Talent Pool để duy trì thiện cảm',
    isAutoSend: false,
    applicableRoles: ['ADMIN', 'HR_MANAGER', 'RECRUITER'],
    updatedAt: '2026-10-18T10:00:00.000Z',
    updatedBy: 'Hệ thống tự động',
    subject: '[{TEN_CONG_TY}] Thông báo kết quả ứng tuyển vị trí {VI_TRI_UNG_TUYEN} - {TEN_UNG_VIEN}',
    body: `Chào bạn {TEN_UNG_VIEN},

Lời đầu tiên, Ban Tuyển dụng {TEN_CONG_TY} xin gửi lời tri ân chân thành vì sự quan tâm và nỗ lực của bạn trong suốt quá trình ứng tuyển vị trí {VI_TRI_UNG_TUYEN} tại {PHONG_BAN}.

Sau khi cân nhắc kỹ lưỡng dựa trên các yêu cầu đặc thù của dự án ở giai đoạn hiện tại, chúng tôi rất tiếc phải thông báo chưa thể đồng hành cùng bạn trong đợt tuyển dụng lần này. Đây là một quyết định khó khăn đối với Hội đồng Tuyển dụng.

Chúng tôi đánh giá rất cao năng lực và tinh thần cầu tiến của bạn. Xin phép được lưu giữ hồ sơ của bạn trong Hệ thống Dữ liệu Nhân tài (Talent Pool) của {TEN_CONG_TY}. Khi có vị trí mới phù hợp hơn trong tương lai, chúng tôi sẽ chủ động liên hệ trước với bạn.

Chúc bạn luôn giữ vững niềm đam mê và gặt hái nhiều thành công rực rỡ trên con đường sự nghiệp!

Trân trọng,
{NGUOI_LIEN_HE}
{TEN_CONG_TY}
Email: {EMAIL_LIEN_HE}`,
  },

  // 5. Thư đề xuất công việc (Job Offer) (AC 1)
  {
    id: 'tpl-offer-letter',
    type: 'OFFER_LETTER',
    name: 'Thư mời nhận việc & Đề xuất công việc (Job Offer)',
    stage: 'OFFER',
    stageLabel: 'Đề xuất công việc (Offer)',
    description: 'Thư chúc mừng và gửi lời mời gia nhập công ty kèm mức lương, ngày bắt đầu và thời hạn phản hồi',
    isAutoSend: false,
    applicableRoles: ['ADMIN', 'HR_MANAGER'],
    updatedAt: '2026-10-18T10:00:00.000Z',
    updatedBy: 'Hệ thống tự động',
    subject: '[{TEN_CONG_TY}] Thư mời nhận việc (Job Offer) - Vị trí {VI_TRI_UNG_TUYEN} - {TEN_UNG_VIEN}',
    body: `Chào bạn {TEN_UNG_VIEN},

Ban Lãnh đạo và toàn thể đội ngũ {TEN_CONG_TY} xin nồng nhiệt chúc mừng bạn đã xuất sắc vượt qua toàn bộ các vòng tuyển chọn cho vị trí {VI_TRI_UNG_TUYEN} tại {PHONG_BAN}!

Chúng tôi rất ấn tượng trước năng lực chuyên môn, tư duy sáng tạo và tinh thần nhiệt huyết của bạn, và tin tưởng rằng sự góp mặt của bạn sẽ mang lại nhiều bước phát triển đột phá cho tổ chức.

Chúng tôi trân trọng gửi tới bạn lời mời gia nhập cùng các điều khoản đãi ngộ chính như sau:

• Chức danh công việc: {VI_TRI_UNG_TUYEN}
• Đơn vị công tác: {PHONG_BAN}
• Địa điểm làm việc: {DIA_CHI_CONG_TY}
• Mức đãi ngộ đề xuất: {MUC_LUONG_OFFER}
• Ngày nhận việc dự kiến (Onboarding): {NGAY_BAT_DAU}
• Hạn phản hồi xác nhận: {HAN_PHAN_HOI}

Chi tiết các chính sách phúc lợi, bảo hiểm, thưởng hiệu quả công việc và quy trình tiếp nhận được đính kèm trong tệp tài liệu Offer chính thức gửi kèm thư này.

Xin vui lòng ký tên và phản hồi xác nhận đồng ý nhận việc trước {HAN_PHAN_HOI}. Nếu cần thảo luận thêm bất kỳ chi tiết nào, xin hãy liên hệ trực tiếp với chúng tôi qua hotline {SO_DIEN_THOAI_LIEN_HE}.

Chào mừng bạn chính thức gia nhập gia đình {TEN_CONG_TY}!

Trân trọng,
{NGUOI_LIEN_HE}
{TEN_CONG_TY}
Email: {EMAIL_LIEN_HE}
Hotline: {SO_DIEN_THOAI_LIEN_HE}`,
  },
];

/**
 * Hàm thay thế các biến động bằng dữ liệu mẫu thật của ứng viên để xem trước (AC 2)
 */
export const renderEmailTemplateWithData = (
  text: string,
  data: SampleCandidateData,
): string => {
  if (!text) return '';
  return text
    .replace(/{TEN_UNG_VIEN}/g, data.candidateName)
    .replace(/{EMAIL_UNG_VIEN}/g, data.candidateEmail)
    .replace(/{SO_DIEN_THOAI}/g, data.candidatePhone)
    .replace(/{VI_TRI_UNG_TUYEN}/g, data.jobTitle)
    .replace(/{PHONG_BAN}/g, data.departmentName)
    .replace(/{TEN_CONG_TY}/g, data.companyName)
    .replace(/{DIA_CHI_CONG_TY}/g, data.companyAddress)
    .replace(/{THOI_GIAN_PHONG_VAN}/g, data.interviewTime)
    .replace(/{HINH_THUC_PHONG_VAN}/g, data.interviewType)
    .replace(/{DIA_DIEM_PHONG_VAN}/g, data.interviewLocation)
    .replace(/{NGUOI_PHONG_VAN}/g, data.interviewers)
    .replace(/{VONG_PHONG_VAN}/g, data.interviewRound)
    .replace(/{MUC_LUONG_OFFER}/g, data.offerSalary)
    .replace(/{NGAY_BAT_DAU}/g, data.startDate)
    .replace(/{HAN_PHAN_HOI}/g, data.offerDeadline)
    .replace(/{NGUOI_LIEN_HE}/g, data.recruiterName)
    .replace(/{EMAIL_LIEN_HE}/g, data.recruiterEmail)
    .replace(/{SO_DIEN_THOAI_LIEN_HE}/g, data.recruiterPhone);
};

/**
 * Lấy danh sách mẫu email đã lưu từ LocalStorage (hoặc khởi tạo mặc định nếu chưa có)
 */
export const getStoredEmailTemplates = (): EmailTemplateItem[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_EMAIL_TEMPLATES_KEY);
    if (!raw) return DEFAULT_EMAIL_TEMPLATES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_EMAIL_TEMPLATES;
  } catch {
    return DEFAULT_EMAIL_TEMPLATES;
  }
};

/**
 * Lưu danh sách mẫu email vào LocalStorage
 */
export const saveStoredEmailTemplates = (templates: EmailTemplateItem[]): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_EMAIL_TEMPLATES_KEY, JSON.stringify(templates));
  } catch {
    // Bỏ qua lỗi storage
  }
};

/**
 * Khôi phục lại mẫu email mặc định
 */
export const resetStoredEmailTemplates = (): EmailTemplateItem[] => {
  try {
    localStorage.setItem(
      LOCAL_STORAGE_EMAIL_TEMPLATES_KEY,
      JSON.stringify(DEFAULT_EMAIL_TEMPLATES),
    );
  } catch {
    // Bỏ qua
  }
  return DEFAULT_EMAIL_TEMPLATES;
};

