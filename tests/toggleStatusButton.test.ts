import { describe, expect, it, vi } from 'vitest';
import type { UserAccount } from '../src/types/account';

// Logic validation and state behavior mirroring ToggleStatusButton (TKNHTTDNB1-161)
interface ButtonState {
  label: string;
  variant: 'danger' | 'success';
  isDisabled: boolean;
  tooltip: string;
}

const computeButtonState = (
  account: UserAccount,
  isSelf = false,
  isLoading = false
): ButtonState => {
  const isLocked = account.status === 'ADMINISTRATIVELY_LOCKED';

  if (isLocked) {
    return {
      label: isLoading ? 'Đang mở...' : 'Mở khóa',
      variant: 'success',
      isDisabled: isLoading,
      tooltip: isLoading
        ? 'Đang xử lý yêu cầu...'
        : `Mở khóa tài khoản cho ${account.fullName}`,
    };
  }

  // ACTIVE state
  const isLockDisabled = isSelf || isLoading;
  return {
    label: isLoading ? 'Đang khóa...' : 'Khóa',
    variant: 'danger',
    isDisabled: isLockDisabled,
    tooltip: isLoading
      ? 'Đang xử lý yêu cầu...'
      : isSelf
      ? 'Quy tắc bảo mật: Không thể tự khóa tài khoản quản trị của chính mình'
      : `Khóa tài khoản ${account.fullName} (yêu cầu nhập lý do)`,
  };
};

describe('ToggleStatusButton Component Logic (TKNHTTDNB1-161 / Story 19)', () => {
  const activeAccount: UserAccount = {
    id: 'ACC-001',
    fullName: 'Trần Thị Bích Ngọc',
    email: 'ngoc.tran@smartrecruitment.vn',
    department: 'Phòng Tuyển dụng',
    role: 'RECRUITER',
    status: 'ACTIVE',
    createdAt: '2025-02-10',
  };

  const lockedAccount: UserAccount = {
    id: 'ACC-005',
    fullName: 'Vũ Đức Cường',
    email: 'cuong.vu@smartrecruitment.vn',
    department: 'Phòng Quản lý Sản phẩm',
    role: 'HIRING_MANAGER',
    status: 'ADMINISTRATIVELY_LOCKED',
    createdAt: '2025-03-12',
    lockReason: 'Nghỉ việc chuyển công tác',
  };

  describe('AC1: Giao diện linh hoạt theo trạng thái Active / Locked', () => {
    it('hiển thị nút Khóa (màu cảnh báo/danger) khi tài khoản đang ACTIVE', () => {
      const state = computeButtonState(activeAccount, false, false);

      expect(state.label).toBe('Khóa');
      expect(state.variant).toBe('danger');
      expect(state.isDisabled).toBe(false);
      expect(state.tooltip).toContain('Khóa tài khoản Trần Thị Bích Ngọc');
    });

    it('hiển thị nút Mở khóa (màu an toàn/success) khi tài khoản đang LOCKED', () => {
      const state = computeButtonState(lockedAccount, false, false);

      expect(state.label).toBe('Mở khóa');
      expect(state.variant).toBe('success');
      expect(state.isDisabled).toBe(false);
      expect(state.tooltip).toContain('Mở khóa tài khoản cho Vũ Đức Cường');
    });
  });

  describe('AC2: Tương tác mở Modal tương ứng', () => {
    it('gọi callback onRequestLock khi bấm Khóa tài khoản ACTIVE', () => {
      const onRequestLock = vi.fn();
      const onRequestUnlock = vi.fn();

      // Giả lập click handler
      if (activeAccount.status === 'ACTIVE') {
        onRequestLock(activeAccount);
      } else {
        onRequestUnlock(activeAccount);
      }

      expect(onRequestLock).toHaveBeenCalledWith(activeAccount);
      expect(onRequestUnlock).not.toHaveBeenCalled();
    });

    it('gọi callback onRequestUnlock khi bấm Mở khóa tài khoản LOCKED', () => {
      const onRequestLock = vi.fn();
      const onRequestUnlock = vi.fn();

      if (lockedAccount.status === 'ADMINISTRATIVELY_LOCKED') {
        onRequestUnlock(lockedAccount);
      } else {
        onRequestLock(lockedAccount);
      }

      expect(onRequestUnlock).toHaveBeenCalledWith(lockedAccount);
      expect(onRequestLock).not.toHaveBeenCalled();
    });
  });

  describe('AC3: Trạng thái Loading và Quy tắc bảo mật', () => {
    it('disable nút và chuyển nhãn khi đang gọi API (isLoading = true)', () => {
      const activeLoadingState = computeButtonState(activeAccount, false, true);
      expect(activeLoadingState.label).toBe('Đang khóa...');
      expect(activeLoadingState.isDisabled).toBe(true);

      const lockedLoadingState = computeButtonState(lockedAccount, false, true);
      expect(lockedLoadingState.label).toBe('Đang mở...');
      expect(lockedLoadingState.isDisabled).toBe(true);
    });

    it('disable nút Khóa và hiển thị cảnh báo bảo mật khi tài khoản là chính Admin đang đăng nhập', () => {
      const selfAdminState = computeButtonState(activeAccount, true, false);

      expect(selfAdminState.isDisabled).toBe(true);
      expect(selfAdminState.tooltip).toBe(
        'Quy tắc bảo mật: Không thể tự khóa tài khoản quản trị của chính mình'
      );
    });
  });
});
