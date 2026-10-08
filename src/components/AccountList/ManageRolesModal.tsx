import React, { useState, useEffect } from 'react';
import type { AccountRole, UserAccount } from '../../types/account';
import { ROLE_DISPLAY_NAMES, ROLE_DESCRIPTIONS } from '../../types/account';
import { tokenService } from '../../services/token.service';

interface ManageRolesModalProps {
  isOpen: boolean;
  account: UserAccount | null;
  onClose: () => void;
  onSaveRoles: (userId: string, newRoles: AccountRole[]) => Promise<void> | void;
}

const AVAILABLE_ROLES = Object.keys(ROLE_DISPLAY_NAMES) as AccountRole[];

interface FormContentProps {
  account: UserAccount;
  onClose: () => void;
  onSaveRoles: (userId: string, newRoles: AccountRole[]) => Promise<void> | void;
}

const ManageRolesFormContent: React.FC<FormContentProps> = ({
  account,
  onClose,
  onSaveRoles,
}) => {
  // Lấy danh sách vai trò ban đầu của người dùng
  const initialRoles: AccountRole[] =
    account.roles && account.roles.length > 0
      ? account.roles
      : [account.role];

  const [selectedRoles, setSelectedRoles] = useState<AccountRole[]>(initialRoles);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Xác định người dùng hiện tại đang đăng nhập từ token
  const currentUser = tokenService.getUserData();
  const isSelfAccount = Boolean(
    currentUser &&
    (currentUser.id === account.id ||
      (currentUser.email && currentUser.email.toLowerCase() === account.email.toLowerCase()))
  );

  // Kiểm tra quy tắc bảo mật: Admin không thể tự tước quyền ADMIN của chính mình
  const isSelfAdmin = isSelfAccount && initialRoles.includes('ADMIN');

  const handleToggleRole = (role: AccountRole) => {
    // Chặn nếu admin đang cố tình bỏ check quyền ADMIN của chính mình
    if (isSelfAdmin && role === 'ADMIN') {
      setErrorMessage(
        'Quy tắc bảo mật: Bạn không thể tự thu hồi quyền Quản trị viên (Admin) của chính tài khoản mình.'
      );
      return;
    }

    setErrorMessage('');
    setSelectedRoles((prevRoles) => {
      if (prevRoles.includes(role)) {
        // Không cho phép bỏ chọn hết tất cả vai trò
        if (prevRoles.length === 1) {
          setErrorMessage('Mỗi tài khoản bắt buộc phải có ít nhất 1 vai trò hoạt động.');
          return prevRoles;
        }
        return prevRoles.filter((r) => r !== role);
      } else {
        return [...prevRoles, role];
      }
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (selectedRoles.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất 1 vai trò cho người dùng.');
      return;
    }

    if (isSelfAdmin && !selectedRoles.includes('ADMIN')) {
      setErrorMessage(
        'Quy tắc bảo mật: Không thể lưu khi tài khoản hiện tại của bạn không còn quyền Quản trị viên (Admin).'
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await onSaveRoles(account.id, selectedRoles);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Không thể cập nhật danh sách vai trò. Vui lòng thử lại sau.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadgeStyle = (role: AccountRole): string => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'HR_MANAGER':
        return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'RECRUITER':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'HIRING_MANAGER':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'INTERVIEWER':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'APPROVER':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Banner cảnh báo an toàn cho chính Admin */}
      {isSelfAdmin && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 shadow-xs">
          <span className="text-base leading-none">🛡️</span>
          <div>
            <p className="font-bold">Quy tắc an toàn bảo mật:</p>
            <p className="mt-0.5">
              Bạn đang quản lý quyền của <strong>chính tài khoản đang đăng nhập</strong>. Hệ thống đã khóa không cho phép bỏ quyền <strong>Admin</strong> để đảm bảo bạn không bị mất quyền quản trị viên.
            </p>
          </div>
        </div>
      )}

      {/* Thông báo lỗi validation */}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Danh sách checkbox chọn đa vai trò */}
      <div>
        <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-700">
          <span>Danh sách vai trò hệ thống</span>
          <span className="font-normal normal-case text-slate-500">
            Đã chọn: <strong className="text-indigo-600">{selectedRoles.length}</strong> vai trò
          </span>
        </div>

        <div className="space-y-2.5">
          {AVAILABLE_ROLES.map((role) => {
            const isChecked = selectedRoles.includes(role);
            const isRoleDisabled = isSelfAdmin && role === 'ADMIN';

            return (
              <label
                key={role}
                className={[
                  "flex items-start gap-3 rounded-xl border p-3.5 transition select-none cursor-pointer",
                  isChecked
                    ? "border-indigo-500 bg-indigo-50/40 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50",
                  isRoleDisabled
                    ? "cursor-not-allowed bg-slate-50/80 border-slate-200 opacity-90"
                    : "",
                  isSubmitting ? "pointer-events-none opacity-60" : "",
                ].join(" ")}
              >
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isRoleDisabled || isSubmitting}
                    onChange={() => handleToggleRole(role)}
                    className="h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">
                      {ROLE_DISPLAY_NAMES[role]}
                    </span>
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${getRoleBadgeStyle(
                        role
                      )}`}
                    >
                      {role}
                    </span>
                    {isRoleDisabled && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                        🔒 Bắt buộc giữ lại
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    {ROLE_DESCRIPTIONS[role]}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Hủy bỏ
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
        >
          {isSubmitting ? (
            <>
              <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Đang lưu vai trò...</span>
            </>
          ) : (
            <span>Lưu vai trò</span>
          )}
        </button>
      </div>
    </form>
  );
};

export const ManageRolesModal: React.FC<ManageRolesModalProps> = ({
  isOpen,
  account,
  onClose,
  onSaveRoles,
}) => {
  // Đóng modal khi bấm ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !account) {
    return null;
  }

  const currentUser = tokenService.getUserData();
  const isSelf = Boolean(
    currentUser &&
    (currentUser.id === account.id ||
      (currentUser.email && currentUser.email.toLowerCase() === account.email.toLowerCase()))
  );

  return (
    <div
      role="dialog"
      data-session-draft-id={account.id}
      data-session-draft-type="manage-roles"
      aria-modal="true"
      aria-labelledby="manage-roles-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs transition-opacity animate-fade-in"
    >
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10 sm:p-7 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="manage-roles-modal-title" className="text-lg font-bold text-slate-900">
                Phân quyền vai trò người dùng
              </h2>
              {isSelf && (
                <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-800">
                  Tài khoản của bạn
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Gán hoặc thu hồi vai trò cho <strong className="text-slate-900">{account.fullName}</strong> ({account.email})
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            aria-label="Đóng cửa sổ"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nội dung form */}
        <div className="mt-5">
          <ManageRolesFormContent
            key={account.id}
            account={account}
            onClose={onClose}
            onSaveRoles={onSaveRoles}
          />
        </div>
      </div>
    </div>
  );
};

export default ManageRolesModal;
