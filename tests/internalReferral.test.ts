import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  referralService,
  DuplicateReferralError,
  InvalidReferralFileError,
  formatVietnamDateTime,
} from '../src/services/referral.service';
import { REFERRAL_STATUS_CONFIG, type ReferralStatus } from '../src/types/referral';

const storage = new Map<string, string>();

describe('TKNHTTDNB1-348 / S4-07: Internal Candidate Referral System', () => {
  const mockUser = {
    id: 'usr-employee-01',
    fullName: 'Nguyễn Văn Minh',
    email: 'minh.nguyen@company.test',
  };

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('AC 1: Biểu mẫu giới thiệu ứng viên nội bộ & Tự động gắn nhãn', () => {
    it('tự động gắn nhãn INTERNAL_REFERRAL và thông tin người giới thiệu', async () => {
      const validPdfFile = new File(['%PDF-1.4 dummy content'], 'CV_UngVien_A.pdf', {
        type: 'application/pdf',
      });

      const payload = {
        jobPostingId: 'jp-demo-306',
        candidateName: 'Đặng Quốc Anh',
        candidateEmail: 'quocanh.dang@gmail.com',
        candidatePhone: '0912345678',
        referralNote: 'Bạn học đại học, 4 năm kinh nghiệm React, rất chủ động và phù hợp văn hóa.',
        cvFile: validPdfFile,
      };

      const result = await referralService.submitReferral(payload, mockUser);

      // 1. Kiểm tra nhãn nguồn tự động
      expect(result.source).toBe('INTERNAL_REFERRAL');

      // 2. Kiểm tra thông tin người giới thiệu tự động
      expect(result.referrerId).toBe(mockUser.id);
      expect(result.referrerName).toBe(mockUser.fullName);
      expect(result.referrerEmail).toBe(mockUser.email);

      // 3. Trạng thái khởi tạo chuẩn hóa là "Đã nhận"
      expect(result.status).toBe('RECEIVED');
      expect(result.candidateName).toBe('Đặng Quốc Anh');
      expect(result.cvFileName).toBe('CV_UngVien_A.pdf');
    });

    it('chấp nhận tệp định dạng .docx hợp lệ', async () => {
      const validDocxFile = new File(['dummy docx content'], 'CV_UngVien_B.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      const payload = {
        jobPostingId: 'jp-demo-307',
        candidateName: 'Hoàng Thị Mai',
        candidateEmail: 'mai.hoang@gmail.com',
        candidatePhone: '0987654321',
        referralNote: 'Đồng nghiệp cũ tại dự án Java, làm việc rất trách nhiệm.',
        cvFile: validDocxFile,
      };

      const result = await referralService.submitReferral(payload, mockUser);
      expect(result.cvFileName).toBe('CV_UngVien_B.docx');
      expect(result.status).toBe('RECEIVED');
    });

    it('từ chối tệp không đúng định dạng PDF hoặc DOCX (vd: .png, .exe)', async () => {
      const invalidFile = new File(['dummy image content'], 'avatar.png', {
        type: 'image/png',
      });

      const payload = {
        jobPostingId: 'jp-demo-306',
        candidateName: 'Nguyễn Văn C',
        candidateEmail: 'vanc.nguyen@gmail.com',
        candidatePhone: '0901234567',
        referralNote: 'Giới thiệu bạn cũ.',
        cvFile: invalidFile,
      };

      await expect(referralService.submitReferral(payload, mockUser)).rejects.toThrow(
        InvalidReferralFileError
      );
    });

    it('từ chối tệp vượt quá dung lượng tối đa 10MB', async () => {
      // Giả lập file lớn hơn 10MB (11MB)
      const oversizedFile = new File([''], 'Heavy_Portfolio.pdf', {
        type: 'application/pdf',
      });
      Object.defineProperty(oversizedFile, 'size', {
        value: 11 * 1024 * 1024,
      });

      const payload = {
        jobPostingId: 'jp-demo-306',
        candidateName: 'Nguyễn Văn D',
        candidateEmail: 'vand.nguyen@gmail.com',
        candidatePhone: '0901234567',
        referralNote: 'Giới thiệu bạn có portfolio nặng.',
        cvFile: oversizedFile,
      };

      await expect(referralService.submitReferral(payload, mockUser)).rejects.toThrow(
        InvalidReferralFileError
      );
    });
  });

  describe('AC 2: Validation & Kiểm tra Trùng lặp (Duplicate Referral Check)', () => {
    it('báo lỗi tiếng Việt khi ứng viên bị nộp trùng cùng vị trí bằng cùng một Email', async () => {
      const cvFile = new File(['dummy pdf'], 'CV.pdf', { type: 'application/pdf' });

      const payload = {
        jobPostingId: 'jp-demo-306',
        candidateName: 'Phạm Quỳnh Anh',
        candidateEmail: 'quynhanh.duplicate@gmail.com',
        candidatePhone: '0936123456',
        referralNote: 'Lần nộp đầu tiên.',
        cvFile,
      };

      // Nộp lần 1 thành công
      await referralService.submitReferral(payload, mockUser);

      // Nộp lần 2 cùng email vào cùng vị trí -> Báo DuplicateReferralError
      await expect(referralService.submitReferral(payload, mockUser)).rejects.toThrow(
        DuplicateReferralError
      );
    });

    it('cho phép nộp cùng một ứng viên nhưng cho hai vị trí công việc khác nhau', async () => {
      const cvFile = new File(['dummy pdf'], 'CV.pdf', { type: 'application/pdf' });

      // Nộp cho vị trí 1
      const ref1 = await referralService.submitReferral(
        {
          jobPostingId: 'jp-demo-306',
          candidateName: 'Trần Văn Đa Năng',
          candidateEmail: 'danang.tran@gmail.com',
          candidatePhone: '0912111222',
          referralNote: 'Phù hợp Frontend.',
          cvFile,
        },
        mockUser
      );

      // Nộp cho vị trí 2
      const ref2 = await referralService.submitReferral(
        {
          jobPostingId: 'jp-demo-307',
          candidateName: 'Trần Văn Đa Năng',
          candidateEmail: 'danang.tran@gmail.com',
          candidatePhone: '0912111222',
          referralNote: 'Cũng có kinh nghiệm Backend Java.',
          cvFile,
        },
        mockUser
      );

      expect(ref1.id).not.toBe(ref2.id);
      expect(ref1.jobPostingId).toBe('jp-demo-306');
      expect(ref2.jobPostingId).toBe('jp-demo-307');
    });

    it('kiểm tra bắt buộc các trường thông tin ứng viên', async () => {
      const cvFile = new File(['dummy pdf'], 'CV.pdf', { type: 'application/pdf' });

      // Thiếu vị trí
      await expect(
        referralService.submitReferral(
          {
            jobPostingId: '',
            candidateName: 'Nguyễn A',
            candidateEmail: 'a@gmail.com',
            candidatePhone: '0901234567',
            referralNote: 'Note',
            cvFile,
          },
          mockUser
        )
      ).rejects.toThrow('Vui lòng chọn vị trí tuyển dụng ứng tuyển.');

      // Thiếu Họ tên
      await expect(
        referralService.submitReferral(
          {
            jobPostingId: 'jp-demo-306',
            candidateName: '',
            candidateEmail: 'a@gmail.com',
            candidatePhone: '0901234567',
            referralNote: 'Note',
            cvFile,
          },
          mockUser
        )
      ).rejects.toThrow('Họ và tên ứng viên không được để trống.');

      // Thiếu Email
      await expect(
        referralService.submitReferral(
          {
            jobPostingId: 'jp-demo-306',
            candidateName: 'Nguyễn A',
            candidateEmail: '',
            candidatePhone: '0901234567',
            referralNote: 'Note',
            cvFile,
          },
          mockUser
        )
      ).rejects.toThrow('Email ứng viên không được để trống.');

      // Thiếu Số điện thoại
      await expect(
        referralService.submitReferral(
          {
            jobPostingId: 'jp-demo-306',
            candidateName: 'Nguyễn A',
            candidateEmail: 'a@gmail.com',
            candidatePhone: '',
            referralNote: 'Note',
            cvFile,
          },
          mockUser
        )
      ).rejects.toThrow('Số điện thoại ứng viên không được để trống.');

      // Thiếu Ghi chú giới thiệu
      await expect(
        referralService.submitReferral(
          {
            jobPostingId: 'jp-demo-306',
            candidateName: 'Nguyễn A',
            candidateEmail: 'a@gmail.com',
            candidatePhone: '0901234567',
            referralNote: '',
            cvFile,
          },
          mockUser
        )
      ).rejects.toThrow('Vui lòng nhập lý do giới thiệu và nhận xét mức độ phù hợp của ứng viên.');
    });
  });

  describe('AC 3: Chuẩn hóa 4 trạng thái tổng quát & Bảo vệ dữ liệu cá nhân', () => {
    it('chỉ hỗ trợ đúng 4 mức trạng thái chuẩn của hệ thống', () => {
      const standardStatuses: ReferralStatus[] = ['RECEIVED', 'IN_REVIEW', 'INTERVIEWING', 'COMPLETED'];

      expect(Object.keys(REFERRAL_STATUS_CONFIG).sort()).toEqual(standardStatuses.sort());

      expect(REFERRAL_STATUS_CONFIG.RECEIVED.label).toBe('Đã nhận');
      expect(REFERRAL_STATUS_CONFIG.IN_REVIEW.label).toBe('Đang xem xét');
      expect(REFERRAL_STATUS_CONFIG.INTERVIEWING.label).toBe('Mời phỏng vấn');
      expect(REFERRAL_STATUS_CONFIG.COMPLETED.label).toBe('Kết thúc');
    });

    it('định dạng thời gian theo chuẩn múi giờ Việt Nam (Asia/Ho_Chi_Minh)', () => {
      const utcDate = '2026-10-14T02:30:00.000Z'; // 02:30 UTC = 09:30 giờ Hà Nội (+7)
      const formatted = formatVietnamDateTime(utcDate);

      // Phải có định dạng giờ phút ngày tháng năm
      expect(formatted).toMatch(/09:30|09:30:00/);
      expect(formatted).toMatch(/14\/10\/2026/);
    });

    it('bảo vệ dữ liệu cá nhân: không chứa nhận xét nội bộ HR hay điểm số phỏng vấn', async () => {
      const referrals = await referralService.getMyReferrals(mockUser.email);

      referrals.forEach((item) => {
        // Kiểm tra không có trường nhạy cảm lộ ra ngoài
        expect(item).not.toHaveProperty('hrInternalNotes');
        expect(item).not.toHaveProperty('interviewScores');
        expect(item).not.toHaveProperty('interviewerNames');
        expect(item).not.toHaveProperty('rejectionDetailReason');
      });
    });
  });
});

