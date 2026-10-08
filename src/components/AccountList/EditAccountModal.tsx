import React, { useState, useEffect } from 'react';
import type { AccountRole, UserAccount, EditAccountFormData } from '../../types/account';
import { ROLE_DISPLAY_NAMES, STATUS_DISPLAY_NAMES, SYSTEM_DEPARTMENTS } from '../../types/account';

interface EditAccountModalProps {
  isOpen: boolean;
  account: UserAccount | null;
  onClose: () => void;
  onSave: (updatedAccount: UserAccount) => Promise<void> | void;
}

interface FormErrors {
  fullName?: string;
  department?: string;
  submitError?: string;
}

interface EditAccountFormContentProps {
  account: UserAccount;
  onClose: () => void;
  onSave: (updatedAccount: UserAccount) => Promise<void> | void;
}

const EditAccountFormContent: React.FC<EditAccountFormContentProps> = ({
  account,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<EditAccountFormData>({
    fullName: account.fullName,
    department: account.department,
    role: account.role,
    status: account.status,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Validate form fields according to business rules
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const trimmedFullName = formData.fullName.trim();
    if (!trimmedFullName) {
      newErrors.fullName = 'Họ và tên bắt buộc phải nhập.';
    } else if (trimmedFullName.length < 2) {
      newErrors.fullName = 'Họ và tên phải có tối thiểu 2 ký tự.';
    } else if (trimmedFullName.length > 100) {
      newErrors.fullName = 'Họ và tên không được vượt quá 100 ký tự.';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Vui lòng chọn hoặc nhập phòng ban công tác.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, submitError: undefined }));

    try {
      // Simulate API network latency if mock or invoke parent onSave
      await new Promise((resolve) => setTimeout(resolve, 600));

      await onSave({
        ...account,
        fullName: formData.fullName.trim(),
        department: formData.department.trim(),
        role: formData.role,
        status: formData.status,
      });

      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Không thể cập nhật tài khoản. Vui lòng thử lại sau.';
      setErrors((prev) => ({ ...prev, submitError: errorMessage }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleDescription = (role: AccountRole): string => {
    switch (role) {
      case 'ADMIN':
        return 'Toàn quyền cấu hình hệ thống, quản lý tài khoản và phân quyền.';
      case 'RECRUITER':
        return 'Quản lý tin tuyển dụng, sàng lọc ứng viên và điều phối quy trình.';
      case 'HIRING_MANAGER':
        return 'Tạo và duyệt yêu cầu tuyển dụng, tham gia đánh giá vòng chuyên môn.';
      case 'INTERVIEWER':
        return 'Tham gia phỏng vấn ứng viên và gửi phiếu đánh giá phỏng vấn.';
      default:
        return '';
    }
  };

  const isStatusChangedToLocked =
    account.status === 'ACTIVE' && formData.status === 'LOCKED';

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Global submit error alert */}
      {errors.submitError && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-700">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errors.submitError}</span>
        </div>
      )}

      {/* Field 1: Email (Readonly) */}
      <div>
        <label className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
          <span>Email công vụ (Tên tài khoản)</span>
          <span className="inline-flex items-center gap-1 font-normal normal-case text-slate-400">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Không thể thay đổi
          </span>
        </label>
        <div className="relative">
          <input
            type="email"
            value={account.email}
            disabled
            className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100/80 px-3.5 py-2.5 text-sm font-medium text-slate-600 shadow-inner"
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
            🔒
          </div>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          Email được sử dụng làm định danh duy nhất trong hệ thống và cơ chế SSO.
        </p>
      </div>

      {/* Field 2: Họ và tên */}
      <div>
        <label htmlFor="edit-fullName" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
          Họ và tên <span className="text-rose-500">*</span>
        </label>
        <input
          id="edit-fullName"
          type="text"
          disabled={isSubmitting}
          value={formData.fullName}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, fullName: e.target.value }));
            if (errors.fullName) {
              setErrors((prev) => ({ ...prev, fullName: undefined }));
            }
          }}
          placeholder="Nhập họ và tên đầy đủ..."
          className={[
            "w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-800 transition focus:outline-none focus:ring-2",
            errors.fullName
              ? "border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-100"
              : "border-slate-300 bg-white focus:border-indigo-500 focus:ring-indigo-100",
            isSubmitting ? "bg-slate-50 cursor-not-allowed" : "",
          ].join(" ")}
        />
        {errors.fullName && (
          <p className="mt-1 text-xs font-medium text-rose-600">
            {errors.fullName}
          </p>
        )}
      </div>

      {/* Field 3: Phòng ban */}
      <div>
        <label htmlFor="edit-department" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
          Phòng ban trực thuộc <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <select
            id="edit-department"
            disabled={isSubmitting}
            value={formData.department}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, department: e.target.value }));
              if (errors.department) {
                setErrors((prev) => ({ ...prev, department: undefined }));
              }
            }}
            className={[
              "w-full appearance-none rounded-xl border px-3.5 py-2.5 pr-9 text-sm text-slate-800 transition focus:outline-none focus:ring-2",
              errors.department
                ? "border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-100"
                : "border-slate-300 bg-white focus:border-indigo-500 focus:ring-indigo-100",
              isSubmitting ? "bg-slate-50 cursor-not-allowed" : "",
            ].join(" ")}
          >
            <option value="">-- Chọn phòng ban --</option>
            {SYSTEM_DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
            {/* Giữ phòng ban hiện tại nếu không nằm trong danh sách chuẩn */}
            {!SYSTEM_DEPARTMENTS.includes(formData.department) && formData.department && (
              <option value={formData.department}>{formData.department}</option>
            )}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
        {errors.department && (
          <p className="mt-1 text-xs font-medium text-rose-600">
            {errors.department}
          </p>
        )}
      </div>

      {/* Field 4: Vai trò hệ thống */}
      <div>
        <label htmlFor="edit-role" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
          Vai trò phân quyền <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <select
            id="edit-role"
            disabled={isSubmitting}
            value={formData.role}
            onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value as AccountRole }))}
            className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 pr-9 text-sm text-slate-800 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            {(Object.keys(ROLE_DISPLAY_NAMES) as AccountRole[]).map((roleKey) => (
              <option key={roleKey} value={roleKey}>
                {ROLE_DISPLAY_NAMES[roleKey]}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
        <div className="mt-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200/80">
          <span className="font-semibold text-slate-700">Quyền hạn vai trò:</span>{' '}
          {getRoleDescription(formData.role)}
        </div>
      </div>

      {/* Field 5: Trạng thái tài khoản */}
      <div>
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
          Trạng thái hoạt động <span className="text-rose-500">*</span>
        </span>
        <div className="grid grid-cols-2 gap-3">
          <label
            className={[
              "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition",
              formData.status === 'ACTIVE'
                ? "border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-500/20"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              isSubmitting ? "pointer-events-none opacity-60" : "",
            ].join(" ")}
          >
            <input
              type="radio"
              name="account-status"
              value="ACTIVE"
              checked={formData.status === 'ACTIVE'}
              onChange={() => setFormData((prev) => ({ ...prev, status: 'ACTIVE' }))}
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <p className="text-sm font-semibold">{STATUS_DISPLAY_NAMES.ACTIVE}</p>
              <p className="text-[11px] text-slate-500">Cho phép đăng nhập bình thường</p>
            </div>
          </label>

          <label
            className={[
              "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition",
              formData.status === 'LOCKED'
                ? "border-rose-500 bg-rose-50/50 text-rose-900 ring-2 ring-rose-500/20"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              isSubmitting ? "pointer-events-none opacity-60" : "",
            ].join(" ")}
          >
            <input
              type="radio"
              name="account-status"
              value="LOCKED"
              checked={formData.status === 'LOCKED'}
              onChange={() => setFormData((prev) => ({ ...prev, status: 'LOCKED' }))}
              className="h-4 w-4 text-rose-600 focus:ring-rose-500"
            />
            <div>
              <p className="text-sm font-semibold">{STATUS_DISPLAY_NAMES.LOCKED}</p>
              <p className="text-[11px] text-slate-500">Chặn quyền truy cập hệ thống</p>
            </div>
          </label>
        </div>

        {/* Warning banner when locking an active account */}
        {isStatusChangedToLocked && (
          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <span className="text-base leading-none">⚠️</span>
            <div>
              <p className="font-semibold">Cảnh báo khóa tài khoản:</p>
              <p className="mt-0.5">
                Khi khóa, người dùng này sẽ không thể đăng nhập hoặc thao tác trên hệ thống. Tất cả các phiên làm việc hiện tại sẽ bị vô hiệu hóa.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons (Lưu & Hủy) */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Hủy bỏ
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-indigo-400"
        >
          {isSubmitting ? (
            <>
              <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Đang lưu...</span>
            </>
          ) : (
            <span>Lưu thay đổi</span>
          )}
        </button>
      </div>
    </form>
  );
};

export const EditAccountModal: React.FC<EditAccountModalProps> = ({
  isOpen,
  account,
  onClose,
  onSave,
}) => {
  // Handle ESC key press to close modal cleanly
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

  // Get initials for avatar badge
  const initials = account.fullName
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || 'TK';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs transition-opacity animate-fade-in"
    >
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10 sm:p-7 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-sm font-bold text-white shadow-sm">
              {initials}
            </div>
            <div>
              <h2 id="modal-title" className="text-lg font-bold text-slate-900">
                Chỉnh sửa thông tin tài khoản
              </h2>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 font-mono">
                <span>Mã: {account.id}</span>
                <span>•</span>
                <span>Tạo ngày: {account.createdAt}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition focus:outline-none focus:ring-2 focus:ring-slate-300"
            aria-label="Đóng cửa sổ"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Form Content */}
        <div className="mt-5">
          <EditAccountFormContent
            key={account.id}
            account={account}
            onClose={onClose}
            onSave={onSave}
          />
        </div>
      </div>
    </div>
  );
};

export default EditAccountModal;
