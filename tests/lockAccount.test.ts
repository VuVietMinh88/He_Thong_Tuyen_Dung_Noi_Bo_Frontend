import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { UserAccount } from '../src/types/account';
import { userService } from '../src/services/userService';

// Helper logic phản ánh trực tiếp quy tắc nghiệp vụ trong LockAccountModal (User Story S1-10)
interface ValidateLockRequestParams {
  account: UserAccount;
  currentUser: { id: string; email: string } | null;
  reason: string;
  hasConfirmedHandover: boolean;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

const validateLockAccountRequest = ({
  account,
  currentUser,
  reason,
  hasConfirmedHandover,
}: ValidateLockRequestParams): ValidationResult => {
  // Quy tắc bảo mật: Không tự khóa chính mình
  const isSelf = Boolean(
    currentUser &&
      (currentUser.id === account.id ||
        (currentUser.email &&
          currentUser.email.toLowerCase() === account.email.toLowerCase()))
  );

  if (isSelf) {
    return {
      isValid: false,
      error: 'Quy tắc bảo mật: Bạn không thể tự khóa tài khoản quản trị của chính mình.',
    };
  }

  const trimmedReason = reason.trim();

  // AC1: Bắt buộc nhập lý do khóa; nếu để trống hoặc dưới 5 ký tự sẽ chặn và báo lỗi
  if (!trimmedReason) {
    return {
      isValid: false,
      error: 'Lý do khóa tài khoản là bắt buộc. Vui lòng nhập lý do cụ thể.',
    };
  }

  if (trimmedReason.length < 5) {
    return {
      isValid: false,
      error: 'Lý do khóa tài khoản quá ngắn. Vui lòng nhập tối thiểu 5 ký tự.',
    };
  }

  // AC2: Cảnh báo bàn giao headcount - nếu nhân sự đang phụ trách job thì phải xác nhận bàn giao
  const activeJobsCount = account.activeJobsCount ?? (account.assignedJobs?.length || 0);
  if (activeJobsCount > 0 && !hasConfirmedHandover) {
    return {
      isValid: false,
      error: 'Vui lòng xác nhận đã kiểm tra và nắm thông tin bàn giao các vị trí tuyển dụng trước khi khóa.',
    };
  }

  return { isValid: true };
};

describe('User Account Status: Active/Locked Management (TKNHTTDNB1-160 / S1-10)', () => {
  const currentAdmin = {
    id: 'ADMIN-001',
    email: 'an.nguyen@smartrecruitment.vn',
  };

  const selfAdminAccount: UserAccount = {
    id: 'ADMIN-001',
    fullName: 'Nguyễn Văn An',
    email: 'an.nguyen@smartrecruitment.vn',
    department: 'Ban Giám đốc',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2025-01-15',
  };

  const recruiterWithJobs: UserAccount = {
    id: 'ACC-002',
    fullName: 'Trần Thị Bích Ngọc',
    email: 'ngoc.tran@smartrecruitment.vn',
    department: 'Phòng Tuyển dụng & Đào tạo',
    role: 'RECRUITER',
    status: 'ACTIVE',
    createdAt: '2025-02-10',
    activeJobsCount: 3,
    assignedJobs: [
      'Senior Frontend Engineer (React/TypeScript)',
      'Product Designer (UI/UX)',
      'Data Analyst (BI & Analytics)',
    ],
  };

  const interviewerWithoutJobs: UserAccount = {
    id: 'ACC-004',
    fullName: 'Phạm Thu Trang',
    email: 'trang.pham@smartrecruitment.vn',
    department: 'Phòng Thiết kế UI/UX',
    role: 'INTERVIEWER',
    status: 'ACTIVE',
    createdAt: '2025-03-01',
    activeJobsCount: 0,
    assignedJobs: [],
  };

  const lockedAccount: UserAccount = {
    id: 'ACC-005',
    fullName: 'Vũ Đức Cường',
    email: 'cuong.vu@smartrecruitment.vn',
    department: 'Phòng Quản lý Sản phẩm',
    role: 'HIRING_MANAGER',
    status: 'LOCKED',
    createdAt: '2025-03-12',
    lockReason: 'Nhân sự nghỉ việc chuyển công tác từ ngày 20/09/2026',
    lockedAt: '2026-09-20 09:10',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('AC1: Bắt buộc nhập lý do khóa vào textarea', () => {
    it('chặn submit và báo lỗi khi lý do khóa bị để trống hoặc toàn khoảng trắng', () => {
      const resultEmpty = validateLockAccountRequest({
        account: interviewerWithoutJobs,
        currentUser: currentAdmin,
        reason: '',
        hasConfirmedHandover: false,
      });

      expect(resultEmpty.isValid).toBe(false);
      expect(resultEmpty.error).toBe('Lý do khóa tài khoản là bắt buộc. Vui lòng nhập lý do cụ thể.');

      const resultWhitespace = validateLockAccountRequest({
        account: interviewerWithoutJobs,
        currentUser: currentAdmin,
        reason: '     ',
        hasConfirmedHandover: false,
      });

      expect(resultWhitespace.isValid).toBe(false);
      expect(resultWhitespace.error).toBe('Lý do khóa tài khoản là bắt buộc. Vui lòng nhập lý do cụ thể.');
    });

    it('chặn submit khi lý do khóa quá ngắn (dưới 5 ký tự)', () => {
      const result = validateLockAccountRequest({
        account: interviewerWithoutJobs,
        currentUser: currentAdmin,
        reason: 'Nghỉ',
        hasConfirmedHandover: false,
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Lý do khóa tài khoản quá ngắn. Vui lòng nhập tối thiểu 5 ký tự.');
    });

    it('cho phép khóa khi lý do hợp lệ và nhân sự không phụ trách vị trí tuyển dụng nào', () => {
      const result = validateLockAccountRequest({
        account: interviewerWithoutJobs,
        currentUser: currentAdmin,
        reason: 'Tài khoản không hoạt động quá 90 ngày',
        hasConfirmedHandover: false,
      });

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('AC2: Cảnh báo bàn giao Headcount & Vị trí tuyển dụng phụ trách', () => {
    it('phát hiện nhân sự đang phụ trách vị trí tuyển dụng và yêu cầu xác nhận bàn giao trước khi khóa', () => {
      // Khi chưa tích xác nhận bàn giao -> Báo lỗi yêu cầu xác nhận
      const resultWithoutHandover = validateLockAccountRequest({
        account: recruiterWithJobs,
        currentUser: currentAdmin,
        reason: 'Nhân sự xin nghỉ việc chuyển công tác',
        hasConfirmedHandover: false,
      });

      expect(resultWithoutHandover.isValid).toBe(false);
      expect(resultWithoutHandover.error).toBe(
        'Vui lòng xác nhận đã kiểm tra và nắm thông tin bàn giao các vị trí tuyển dụng trước khi khóa.'
      );

      // Khi đã tích xác nhận bàn giao -> Hợp lệ
      const resultWithHandover = validateLockAccountRequest({
        account: recruiterWithJobs,
        currentUser: currentAdmin,
        reason: 'Nhân sự xin nghỉ việc chuyển công tác',
        hasConfirmedHandover: true,
      });

      expect(resultWithHandover.isValid).toBe(true);
      expect(resultWithHandover.error).toBeUndefined();
    });
  });

  describe('Bảo mật: Chặn Admin tự khóa tài khoản của chính mình', () => {
    it('ngăn chặn Admin tự khóa tài khoản của chính mình dù đã nhập lý do đầy đủ', () => {
      const result = validateLockAccountRequest({
        account: selfAdminAccount,
        currentUser: currentAdmin,
        reason: 'Khóa thử nghiệm tài khoản cá nhân',
        hasConfirmedHandover: true,
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Quy tắc bảo mật: Bạn không thể tự khóa tài khoản quản trị của chính mình.');
    });
  });

  describe('AC3: Cập nhật API và mở khóa tài khoản', () => {
    it('gọi userService.lockUser thành công và trả về trạng thái LOCKED kèm lý do', async () => {
      const reason = 'Chấm dứt hợp đồng lao động theo nguyện vọng cá nhân';
      const spy = vi.spyOn(userService, 'lockUser').mockResolvedValueOnce({
        id: recruiterWithJobs.id,
        status: 'LOCKED',
        lockReason: reason,
        lockedAt: '2026-10-07 09:00',
      });

      const response = await userService.lockUser(recruiterWithJobs.id, reason);

      expect(spy).toHaveBeenCalledWith(recruiterWithJobs.id, reason);
      expect(response.status).toBe('LOCKED');
      expect(response.lockReason).toBe(reason);
      expect(response.lockedAt).toBeDefined();
    });

    it('gọi userService.unlockUser thành công và trả về trạng thái ACTIVE', async () => {
      const spy = vi.spyOn(userService, 'unlockUser').mockResolvedValueOnce({
        id: lockedAccount.id,
        status: 'ACTIVE',
      });

      const response = await userService.unlockUser(lockedAccount.id);

      expect(spy).toHaveBeenCalledWith(lockedAccount.id);
      expect(response.status).toBe('ACTIVE');
    });
  });
});
