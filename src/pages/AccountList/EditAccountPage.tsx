import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import type { AccountRole, UserAccount } from '../../types/account';
import {
  ROLE_DISPLAY_NAMES,
  ROLE_DESCRIPTIONS,
  STATUS_DISPLAY_NAMES,
} from '../../types/account';
import { userService } from '../../services/userService';
import { departmentService, type DepartmentOption } from '../../services/department.service';
import { tokenService } from '../../services/token.service';
import { useToast } from '../../components/notifications/useToast';
import {
  normalizeAccountPhone,
  validateAccountProfile,
} from '../../utils/accountValidation';

const AVAILABLE_ROLES = Object.keys(ROLE_DISPLAY_NAMES) as AccountRole[];

export interface EditAccountPageProps {
  /** Khi được sử dụng như modal component */
  account?: UserAccount | null;
  isOpen?: boolean;
  onClose?: () => void;
  onSave?: (updatedAccount: UserAccount) => Promise<void> | void;
}

export const EditAccountPage: React.FC<EditAccountPageProps> = ({
  account: initialAccount,
  isOpen,
  onClose,
  onSave,
}) => {
  const { id: routeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notify } = useToast();

  const isModalMode = isOpen !== undefined;
  const targetUserId = initialAccount?.id || routeId;

  const [account, setAccount] = useState<UserAccount | null>(initialAccount || null);
  const [isLoadingAccount, setIsLoadingAccount] = useState<boolean>(!initialAccount && Boolean(targetUserId));
  
  // Basic Info Form State
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [displayTitle, setDisplayTitle] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [departmentError, setDepartmentError] = useState<string>('');

  // Role Management State (moved inside here)
  const [selectedRoles, setSelectedRoles] = useState<AccountRole[]>([]);
  const [initialRoles, setInitialRoles] = useState<AccountRole[]>([]);

  // Feedback states
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Current logged in user for self-protection check
  const currentUser = tokenService.getUserData();
  const isSelfAccount = Boolean(
    account &&
    currentUser &&
    (currentUser.id === account.id ||
      (currentUser.email && currentUser.email.toLowerCase() === account.email.toLowerCase()))
  );
  const isSelfAdmin = isSelfAccount && initialRoles.includes('ADMIN');

  // Load account data if not passed as prop
  useEffect(() => {
    if (initialAccount) {
      setAccount(initialAccount);
      setFullName(initialAccount.fullName);
      setPhone(initialAccount.phone ?? '');
      setDisplayTitle(initialAccount.displayTitle ?? '');
      setDepartmentId(initialAccount.departmentId ?? '');
      const userRoles = initialAccount.roles && initialAccount.roles.length > 0
        ? initialAccount.roles
        : [initialAccount.role];
      setSelectedRoles(userRoles);
      setInitialRoles(userRoles);
      setIsLoadingAccount(false);
      return;
    }

    if (!targetUserId) {
      setIsLoadingAccount(false);
      return;
    }

    let isCurrent = true;
    setIsLoadingAccount(true);
    setErrorMessage('');

    userService.getUserById(targetUserId)
      .then((data) => {
        if (!isCurrent) return;
        setAccount(data);
        setFullName(data.fullName);
        setPhone(data.phone ?? '');
        setDisplayTitle(data.displayTitle ?? '');
        setDepartmentId(data.departmentId ?? '');
        const userRoles = data.roles && data.roles.length > 0
          ? data.roles
          : [data.role];
        setSelectedRoles(userRoles);
        setInitialRoles(userRoles);
      })
      .catch((err) => {
        if (!isCurrent) return;
        setErrorMessage(err instanceof Error ? err.message : 'Không tìm thấy tài khoản người dùng.');
      })
      .finally(() => {
        if (isCurrent) setIsLoadingAccount(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [targetUserId, initialAccount]);

  // Load departments
  useEffect(() => {
    let isCurrent = true;
    departmentService.getActiveDepartments()
      .then((result) => {
        if (isCurrent) setDepartments(result);
      })
      .catch((err) => {
        if (isCurrent) {
          setDepartmentError(err instanceof Error ? err.message : 'Không tải được danh sách phòng ban.');
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const handleToggleRole = (role: AccountRole) => {
    if (isSelfAdmin && role === 'ADMIN') {
      setErrorMessage(
        'Quy tắc bảo mật: Bạn không thể tự thu hồi quyền Quản trị viên (Admin) của chính tài khoản mình.'
      );
      return;
    }

    setErrorMessage('');
    setSelectedRoles((prev) => {
      if (prev.includes(role)) {
        if (prev.length === 1) {
          setErrorMessage('Mỗi tài khoản bắt buộc phải có ít nhất 1 vai trò hoạt động.');
          return prev;
        }
        return prev.filter((r) => r !== role);
      }
      return [...prev, role];
    });
  };

  const handleCancel = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/users');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!account) return;

    const normalizedName = fullName.trim();
    const normalizedPhone = normalizeAccountPhone(phone);
    const validationError = validateAccountProfile({ fullName, phone, displayTitle });
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    if (selectedRoles.length === 0) {
      setErrorMessage('Mỗi tài khoản bắt buộc phải có ít nhất 1 vai trò hoạt động.');
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
      // 1. Cập nhật thông tin cơ bản
      const updatedAccountPayload: UserAccount = {
        ...account,
        fullName: normalizedName,
        phone: normalizedPhone || null,
        displayTitle: displayTitle.trim() || null,
        departmentId: departmentId || null,
        department: departments.find((d) => d.id === departmentId)?.name
          ?? (departmentId === account.departmentId ? account.department : ''),
      };

      const savedAccount = await userService.updateUser(updatedAccountPayload);

      // 2. Cập nhật phân quyền vai trò nếu có thay đổi
      const rolesChanged =
        initialRoles.length !== selectedRoles.length ||
        initialRoles.some((r) => !selectedRoles.includes(r));

      if (rolesChanged) {
        await userService.updateUserRoles(account.id, initialRoles, selectedRoles);
        savedAccount.roles = selectedRoles;
        savedAccount.role = selectedRoles[0];
      }

      notify('Cập nhật tài khoản và phân quyền thành công!', 'success');

      if (onSave) {
        await onSave(savedAccount);
      }
      if (onClose) {
        onClose();
      } else {
        navigate('/users');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi cập nhật tài khoản. Vui lòng thử lại.';
      setErrorMessage(msg);
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
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (isModalMode && !isOpen) return null;

  const content = (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Page Header / Modal Header */}
      {!isModalMode ? (
        <div>
          <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
            <Link to="/users" className="hover:text-indigo-600 transition">
              Quản lý tài khoản
            </Link>
            <span>/</span>
            <span className="text-slate-800">Chỉnh sửa tài khoản</span>
          </nav>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Chỉnh sửa tài khoản người dùng
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Cập nhật thông tin định danh và phân quyền vai trò cho nhân sự trong hệ thống.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              ← Quay lại danh sách
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Chỉnh sửa thông tin &amp; Phân quyền
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Quản lý thông tin tài khoản và vai trò hệ thống
            </p>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoadingAccount ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 animate-pulse space-y-6">
          <div className="h-6 w-48 bg-slate-200 rounded" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
          </div>
          <div className="h-32 bg-slate-100 rounded-xl" />
        </div>
      ) : errorMessage && !account ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800">
          <p className="font-semibold">{errorMessage}</p>
          <button
            type="button"
            onClick={handleCancel}
            className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
          >
            Quay lại
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800 shadow-sm"
            >
              <span className="text-lg leading-none shrink-0" aria-hidden="true">
                ⚠️
              </span>
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Section 1: Thông tin cơ bản */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                1. Thông tin cơ bản
              </h2>
              <p className="text-xs text-slate-500">
                Thông tin định danh và phòng ban làm việc của nhân sự
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="edit-account-fullname"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  id="edit-account-fullname"
                  type="text"
                  required
                  maxLength={255}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-account-email"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Email công ty <span className="text-slate-400 font-normal">(Cố định)</span>
                </label>
                <input
                  id="edit-account-email"
                  type="email"
                  disabled
                  value={account?.email || ''}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm font-mono text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-account-phone"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Số điện thoại
                </label>
                <input
                  id="edit-account-phone"
                  type="tel"
                  maxLength={20}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="0987654321"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-account-displaytitle"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Chức danh công việc
                </label>
                <input
                  id="edit-account-displaytitle"
                  type="text"
                  maxLength={120}
                  value={displayTitle}
                  onChange={(e) => setDisplayTitle(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Ví dụ: Chuyên viên tuyển dụng cấp cao"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="edit-account-department"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Phòng ban trực thuộc
                </label>
                <select
                  id="edit-account-department"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  disabled={isSubmitting || Boolean(departmentError)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                >
                  <option value="">-- Chưa phân phòng ban --</option>
                  {departmentId && !departments.some((d) => d.id === departmentId) && (
                    <option value={departmentId}>
                      {account?.department || 'Phòng ban hiện tại'}
                    </option>
                  )}
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                {departmentError && (
                  <p className="mt-1 text-xs text-amber-700">{departmentError}</p>
                )}
              </div>
            </div>

            {/* Account Metadata preview */}
            {account && (
              <div className="flex flex-wrap items-center gap-4 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
                <div>
                  <span className="font-semibold text-slate-700">Trạng thái: </span>
                  <span className="font-medium text-slate-900">
                    {STATUS_DISPLAY_NAMES[account.status]}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Ngày tạo: </span>
                  <span>{new Date(account.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Phân quyền vai trò (Role Management) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7 space-y-5">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  2. Phân quyền vai trò hệ thống
                </h2>
                <p className="text-xs text-slate-500">
                  Chọn các vai trò để phân quyền truy cập chức năng cho tài khoản
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200">
                Đã chọn: {selectedRoles.length} vai trò
              </span>
            </div>

            {/* Security Notice for Self Admin */}
            {isSelfAdmin && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 shadow-xs">
                <span className="text-base leading-none">🛡️</span>
                <div>
                  <p className="font-bold">Quy tắc an toàn bảo mật:</p>
                  <p className="mt-0.5">
                    Bạn đang thao tác với <strong>chính tài khoản đang đăng nhập</strong>. Hệ thống đã khóa không cho phép bỏ quyền <strong>Admin</strong> để đảm bảo bạn không bị mất quyền quản trị viên.
                  </p>
                </div>
              </div>
            )}

            {/* List of Roles */}
            <div className="grid gap-3 sm:grid-cols-2">
              {AVAILABLE_ROLES.map((role) => {
                const isSelected = selectedRoles.includes(role);
                const isLockedSelfAdmin = isSelfAdmin && role === 'ADMIN';

                return (
                  <label
                    key={role}
                    className={`relative flex items-start gap-3.5 rounded-xl border p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/20 shadow-xs ring-1 ring-indigo-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    } ${isLockedSelfAdmin ? 'opacity-90 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isSubmitting || isLockedSelfAdmin}
                      onChange={() => handleToggleRole(role)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                    />

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-900">
                          {ROLE_DISPLAY_NAMES[role]}
                        </span>
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${getRoleBadgeStyle(
                            role
                          )}`}
                        >
                          {role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {ROLE_DESCRIPTIONS[role]}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Đang lưu thay đổi...</span>
                </>
              ) : (
                <span>Lưu thông tin &amp; Phân quyền</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );

  if (isModalMode) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs animate-fade-in"
      >
        <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10 sm:p-8">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 px-4 sm:px-6 lg:px-8">
      {content}
    </div>
  );
};

export default EditAccountPage;

