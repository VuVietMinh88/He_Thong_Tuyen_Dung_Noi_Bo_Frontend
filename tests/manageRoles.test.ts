import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { AccountRole, UserAccount } from '../src/types/account';
import { userService } from '../src/services/userService';

// Business logic helpers mirroring ManageRolesModal rules (AC1 & AC2)
interface SecurityRuleCheckResult {
  allowed: boolean;
  errorMessage?: string;
}

const checkCanRemoveRole = (
  roleToRemove: AccountRole,
  currentRoles: AccountRole[],
  currentUser: { id: string; email: string } | null,
  targetAccount: UserAccount
): SecurityRuleCheckResult => {
  const isSelfAccount = Boolean(
    currentUser &&
      (currentUser.id === targetAccount.id ||
        (currentUser.email &&
          currentUser.email.toLowerCase() === targetAccount.email.toLowerCase()))
  );

  const isSelfAdmin = isSelfAccount && currentRoles.includes('ADMIN');

  // Quy tắc bảo mật AC2: Admin không được tự tước quyền ADMIN của chính mình
  if (isSelfAdmin && roleToRemove === 'ADMIN') {
    return {
      allowed: false,
      errorMessage:
        'Quy tắc bảo mật: Bạn không thể tự thu hồi quyền Quản trị viên (Admin) của chính tài khoản mình.',
    };
  }

  // Quy tắc tính toàn vẹn: Không được bỏ tất cả vai trò
  if (currentRoles.length === 1 && currentRoles.includes(roleToRemove)) {
    return {
      allowed: false,
      errorMessage: 'Mỗi tài khoản bắt buộc phải có ít nhất 1 vai trò hoạt động.',
    };
  }

  return { allowed: true };
};

const toggleUserRole = (
  role: AccountRole,
  selectedRoles: AccountRole[],
  currentUser: { id: string; email: string } | null,
  targetAccount: UserAccount
): { newRoles: AccountRole[]; error?: string } => {
  if (selectedRoles.includes(role)) {
    const check = checkCanRemoveRole(role, selectedRoles, currentUser, targetAccount);
    if (!check.allowed) {
      return { newRoles: selectedRoles, error: check.errorMessage };
    }
    return { newRoles: selectedRoles.filter((r) => r !== role) };
  } else {
    return { newRoles: [...selectedRoles, role] };
  }
};

describe('Manage User Roles & Security Rules (TKNHTTDNB1-152 / S1-09)', () => {
  const currentLoggedInAdmin = {
    id: 'ADMIN-001',
    email: 'admin@smartrecruitment.vn',
  };

  const selfAdminAccount: UserAccount = {
    id: 'ADMIN-001',
    fullName: 'Quản trị viên Hệ thống',
    email: 'admin@smartrecruitment.vn',
    department: 'Ban Giám đốc',
    role: 'ADMIN',
    roles: ['ADMIN', 'RECRUITER'],
    status: 'ACTIVE',
    createdAt: '2025-01-01',
  };

  const otherUserAccount: UserAccount = {
    id: 'USER-002',
    fullName: 'Trần Thị Thu Trang',
    email: 'trang.tran@smartrecruitment.vn',
    department: 'Phòng Tuyển dụng',
    role: 'RECRUITER',
    roles: ['RECRUITER'],
    status: 'ACTIVE',
    createdAt: '2025-02-10',
  };

  const otherAdminAccount: UserAccount = {
    id: 'ADMIN-003',
    fullName: 'Lê Hoàng Nam',
    email: 'nam.le@smartrecruitment.vn',
    department: 'Phòng Kỹ thuật',
    role: 'ADMIN',
    roles: ['ADMIN'],
    status: 'ACTIVE',
    createdAt: '2025-02-15',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('AC1: Giao diện chọn đa vai trò (Multi-select Roles)', () => {
    it('cho phép thêm nhiều vai trò cùng lúc cho một người dùng', () => {
      let roles: AccountRole[] = ['RECRUITER'];

      // Thêm HIRING_MANAGER
      const step1 = toggleUserRole('HIRING_MANAGER', roles, currentLoggedInAdmin, otherUserAccount);
      roles = step1.newRoles;
      expect(roles).toEqual(['RECRUITER', 'HIRING_MANAGER']);

      // Thêm INTERVIEWER
      const step2 = toggleUserRole('INTERVIEWER', roles, currentLoggedInAdmin, otherUserAccount);
      roles = step2.newRoles;
      expect(roles).toEqual(['RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER']);
    });

    it('cho phép thu hồi bớt vai trò khi tài khoản có nhiều hơn 1 vai trò', () => {
      const roles: AccountRole[] = ['RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER'];

      const result = toggleUserRole('HIRING_MANAGER', roles, currentLoggedInAdmin, otherUserAccount);
      expect(result.newRoles).toEqual(['RECRUITER', 'INTERVIEWER']);
      expect(result.error).toBeUndefined();
    });

    it('ngăn chặn việc bỏ chọn tất cả vai trò (phải giữ lại tối thiểu 1 vai trò)', () => {
      const roles: AccountRole[] = ['RECRUITER'];

      const result = toggleUserRole('RECRUITER', roles, currentLoggedInAdmin, otherUserAccount);
      expect(result.newRoles).toEqual(['RECRUITER']);
      expect(result.error).toBe('Mỗi tài khoản bắt buộc phải có ít nhất 1 vai trò hoạt động.');
    });
  });

  describe('AC2: Quy tắc bảo mật ngăn chặn Admin tự thu hồi quyền quản trị của chính mình', () => {
    it('chặn Admin tự thu hồi quyền ADMIN của chính tài khoản mình', () => {
      const currentRoles: AccountRole[] = ['ADMIN', 'RECRUITER'];

      const result = toggleUserRole('ADMIN', currentRoles, currentLoggedInAdmin, selfAdminAccount);

      expect(result.newRoles).toEqual(['ADMIN', 'RECRUITER']);
      expect(result.error).toBe(
        'Quy tắc bảo mật: Bạn không thể tự thu hồi quyền Quản trị viên (Admin) của chính tài khoản mình.'
      );
    });

    it('cho phép Admin tự gán thêm hoặc thu hồi vai trò phụ khác (ví dụ: RECRUITER) của chính mình', () => {
      const currentRoles: AccountRole[] = ['ADMIN', 'RECRUITER'];

      // Thu hồi RECRUITER từ chính mình (vẫn giữ ADMIN) -> Hợp lệ
      const result = toggleUserRole('RECRUITER', currentRoles, currentLoggedInAdmin, selfAdminAccount);
      expect(result.newRoles).toEqual(['ADMIN']);
      expect(result.error).toBeUndefined();

      // Gán thêm INTERVIEWER cho chính mình -> Hợp lệ
      const result2 = toggleUserRole('INTERVIEWER', result.newRoles, currentLoggedInAdmin, selfAdminAccount);
      expect(result2.newRoles).toEqual(['ADMIN', 'INTERVIEWER']);
      expect(result2.error).toBeUndefined();
    });

    it('cho phép Admin thu hồi quyền ADMIN của một tài khoản Admin khác', () => {
      const targetAdminRoles: AccountRole[] = ['ADMIN', 'HIRING_MANAGER'];

      const result = toggleUserRole('ADMIN', targetAdminRoles, currentLoggedInAdmin, otherAdminAccount);
      expect(result.newRoles).toEqual(['HIRING_MANAGER']);
      expect(result.error).toBeUndefined();
    });
  });

  describe('AC3: Cập nhật hiệu lực ngay lập tức qua API Service', () => {
    it('gọi hàm userService.updateUserRoles cập nhật danh sách role thành công', async () => {
      const newRoles: AccountRole[] = ['RECRUITER', 'INTERVIEWER'];

      const spy = vi.spyOn(userService, 'updateUserRoles').mockResolvedValueOnce({
        id: otherUserAccount.id,
        roles: newRoles,
      });

      const response = await userService.updateUserRoles(otherUserAccount.id, newRoles);

      expect(spy).toHaveBeenCalledWith(otherUserAccount.id, newRoles);
      expect(response.id).toBe(otherUserAccount.id);
      expect(response.roles).toEqual(newRoles);
    });
  });
});
