import React, { useEffect, useState } from 'react';
import type { UserAccount } from '../../types/account';
import { ROLE_DISPLAY_NAMES, STATUS_DISPLAY_NAMES } from '../../types/account';
import { departmentService, type DepartmentOption } from '../../services/department.service';
import {
  normalizeAccountPhone,
  validateAccountProfile,
} from '../../utils/accountValidation';

interface EditAccountModalProps {
  isOpen: boolean;
  account: UserAccount | null;
  onClose: () => void;
  onSave: (updatedAccount: UserAccount) => Promise<void> | void;
}

const EditAccountForm: React.FC<{
  account: UserAccount;
  onClose: () => void;
  onSave: (updatedAccount: UserAccount) => Promise<void> | void;
}> = ({ account, onClose, onSave }) => {
  const [fullName, setFullName] = useState(account.fullName);
  const [phone, setPhone] = useState(account.phone ?? '');
  const [displayTitle, setDisplayTitle] = useState(account.displayTitle ?? '');
  const [departmentId, setDepartmentId] = useState(account.departmentId ?? '');
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [departmentError, setDepartmentError] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    departmentService.getActiveDepartments()
      .then((result) => {
        if (isCurrent) setDepartments(result);
      })
      .catch((loadError: unknown) => {
        if (isCurrent) {
          setDepartmentError(loadError instanceof Error
            ? loadError.message
            : 'Không tải được danh sách phòng ban.');
        }
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = fullName.trim();
    const normalizedPhone = normalizeAccountPhone(phone);
    const validationError = validateAccountProfile({ fullName, phone, displayTitle });
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onSave({
        ...account,
        fullName: normalizedName,
        phone: normalizedPhone || null,
        displayTitle: displayTitle.trim() || null,
        departmentId: departmentId || null,
        department: departments.find((department) => department.id === departmentId)?.name
          ?? (departmentId === account.departmentId ? account.department : ''),
      });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error
        ? submitError.message
        : 'Không thể cập nhật tài khoản. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit}>
      {error && (
        <div aria-live="assertive" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700" role="alert">
          {error}
        </div>
      )}
      <div>
        <label className="text-sm font-semibold text-slate-700" htmlFor="edit-full-name">
          Họ và tên
        </label>
        <input
          autoComplete="name"
          className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
          disabled={isSubmitting}
          id="edit-full-name"
          maxLength={255}
          onChange={(event) => setFullName(event.target.value)}
          required
          value={fullName}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-slate-700" htmlFor="edit-phone">
            Số điện thoại
          </label>
          <input
            autoComplete="tel"
            className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
            disabled={isSubmitting}
            id="edit-phone"
            maxLength={20}
            onChange={(event) => setPhone(event.target.value)}
            type="tel"
            value={phone}
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700" htmlFor="edit-display-title">
            Chức danh
          </label>
          <input
            className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
            disabled={isSubmitting}
            id="edit-display-title"
            maxLength={120}
            onChange={(event) => setDisplayTitle(event.target.value)}
            value={displayTitle}
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-semibold text-slate-700" htmlFor="edit-department">
          Phòng ban
        </label>
        <select
          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
          disabled={isSubmitting || Boolean(departmentError)}
          id="edit-department"
          onChange={(event) => setDepartmentId(event.target.value)}
          value={departmentId}
        >
          <option value="">Chưa phân phòng ban</option>
          {departmentId && !departments.some((department) => department.id === departmentId) && (
            <option value={departmentId}>{account.department || 'Phòng ban hiện tại'}</option>
          )}
          {departments.map((department) => (
            <option key={department.id} value={department.id}>{department.name}</option>
          ))}
        </select>
        {departmentError && <p className="mt-1 text-xs text-amber-700">{departmentError}</p>}
      </div>

      <dl className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-slate-500">Email</dt>
          <dd className="mt-1 break-all font-medium text-slate-800">{account.email}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Vai trò</dt>
          <dd className="mt-1 font-medium text-slate-800">
            {(account.roles?.length ? account.roles : [account.role])
              .map((role) => ROLE_DISPLAY_NAMES[role])
              .join(', ')}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Trạng thái</dt>
          <dd className="mt-1 font-medium text-slate-800">{STATUS_DISPLAY_NAMES[account.status]}</dd>
        </div>
      </dl>
      <p className="text-xs text-slate-500">
        Vai trò và trạng thái được quản lý riêng để gửi đúng yêu cầu tới API Backend.
      </p>

      <footer className="flex justify-end gap-3 border-t border-slate-100 pt-4">
        <button
          className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          disabled={isSubmitting}
          onClick={onClose}
          type="button"
        >
          Hủy
        </button>
        <button
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </footer>
    </form>
  );
};

const EditAccountModal: React.FC<EditAccountModalProps> = ({
  isOpen,
  account,
  onClose,
  onSave,
}) => {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !account) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        data-session-draft-id={account.id}
        data-session-draft-type="edit-account"
        aria-labelledby="edit-account-title"
        aria-modal="true"
        className="my-auto w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"
        role="dialog"
      >
        <header className="mb-5 flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900" id="edit-account-title">
              Chỉnh sửa thông tin tài khoản
            </h2>
            <p className="mt-1 text-xs text-slate-500">{account.id}</p>
          </div>
          <button
            aria-label="Đóng"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </header>
        <EditAccountForm key={account.id} account={account} onClose={onClose} onSave={onSave} />
      </section>
    </div>
  );
};

export default EditAccountModal;
