import React, { useState } from 'react';
import { type AccountRole, type UserAccount, ROLE_DISPLAY_NAMES } from '../../types/account';

interface EditAccountModalProps {
  isOpen: boolean;
  account: UserAccount | null;
  onClose: () => void;
  onSave: (updatedAccount: UserAccount) => void;
}

interface InnerFormProps {
  account: UserAccount;
  onClose: () => void;
  onSave: (updatedAccount: UserAccount) => void;
}

const EditAccountFormContent: React.FC<InnerFormProps> = ({ account, onClose, onSave }) => {
  const [fullName, setFullName] = useState(account.fullName);
  const [department, setDepartment] = useState(account.department);
  const [role, setRole] = useState<AccountRole>(account.role);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setValidationError('Họ và tên không được để trống.');
      return;
    }

    if (!department.trim()) {
      setValidationError('Phòng ban không được để trống.');
      return;
    }

    onSave({
      ...account,
      fullName: fullName.trim(),
      department: department.trim(),
      role,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      {validationError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
          {validationError}
        </div>
      )}

      {/* Email (Readonly) */}
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-700">
          Email công vụ (Không thể thay đổi)
        </label>
        <input
          type="text"
          value={account.email}
          disabled
          className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed"
        />
      </div>

      {/* Họ tên */}
      <div>
        <label htmlFor="edit-fullname" className="mb-1 block text-xs font-semibold text-slate-700">
          Họ và tên <span className="text-rose-500">*</span>
        </label>
        <input
          id="edit-fullname"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          required
        />
      </div>

      {/* Phòng ban */}
      <div>
        <label htmlFor="edit-department" className="mb-1 block text-xs font-semibold text-slate-700">
          Phòng ban <span className="text-rose-500">*</span>
        </label>
        <input
          id="edit-department"
          type="text"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          required
        />
      </div>

      {/* Vai trò */}
      <div>
        <label htmlFor="edit-role" className="mb-1 block text-xs font-semibold text-slate-700">
          Vai trò hệ thống <span className="text-rose-500">*</span>
        </label>
        <select
          id="edit-role"
          value={role}
          onChange={(e) => setRole(e.target.value as AccountRole)}
          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          {(Object.keys(ROLE_DISPLAY_NAMES) as AccountRole[]).map((roleKey) => (
            <option key={roleKey} value={roleKey}>
              {ROLE_DISPLAY_NAMES[roleKey]}
            </option>
          ))}
        </select>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
        >
          Hủy
        </button>
        <button
          type="submit"
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        >
          Lưu thay đổi
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
  if (!isOpen || !account) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-900/10">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Chỉnh sửa thông tin tài khoản
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Mã tài khoản: {account.id}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            aria-label="Đóng modal"
          >
            ✕
          </button>
        </div>

        {/* Keyed component resets state cleanly on account change without useEffect */}
        <EditAccountFormContent
          key={account.id}
          account={account}
          onClose={onClose}
          onSave={onSave}
        />
      </div>
    </div>
  );
};

export default EditAccountModal;
