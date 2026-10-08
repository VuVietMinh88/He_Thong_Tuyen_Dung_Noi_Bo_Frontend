import React, { useEffect, useRef, useState } from 'react';
import { type AccountRole, ROLE_DISPLAY_NAMES } from '../../types/account';
import { CreateAccountError, userService } from '../../services/user.service';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

interface FormValues {
  fullName: string;
  email: string;
  department: string;
  role: AccountRole | '';
}

const INITIAL_VALUES: FormValues = {
  fullName: '',
  email: '',
  department: '',
  role: '',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLock = useRef(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const updateField = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError('');
  };

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof FormValues, string>> = {};
    const normalizedEmail = values.email.trim();

    if (!values.fullName.trim()) nextErrors.fullName = 'Vui lòng nhập họ và tên.';
    if (!normalizedEmail) {
      nextErrors.email = 'Vui lòng nhập email.';
    } else if (!EMAIL_PATTERN.test(normalizedEmail)) {
      nextErrors.email = 'Email không đúng định dạng.';
    }
    if (!values.department.trim()) nextErrors.department = 'Vui lòng nhập phòng ban.';
    if (!values.role) nextErrors.role = 'Vui lòng chọn vai trò.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitLock.current || !validate() || !values.role) return;

    submitLock.current = true;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await userService.createAccount({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        department: values.department.trim(),
        role: values.role,
      });
      setValues(INITIAL_VALUES);
      setErrors({});
      onSuccess('Tạo tài khoản thành công. Hệ thống đã gửi email kích hoạt kèm mật khẩu tạm đến người dùng.');
      onClose();
    } catch (error: unknown) {
      if (error instanceof CreateAccountError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Đã xảy ra lỗi không xác định. Vui lòng thử lại.');
      }
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

  const fieldClass = (field: keyof FormValues) =>
    `mt-1 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:ring-2 ${
      errors[field]
        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100'
        : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <section
        aria-labelledby="create-account-title"
        aria-modal="true"
        className="my-auto w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
        role="dialog"
      >
        <header className="mb-5 flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 id="create-account-title" className="text-xl font-bold text-slate-900">
              Tạo tài khoản nhân sự
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Thông tin kích hoạt sẽ được gửi đến email người dùng.
            </p>
          </div>
          <button
            aria-label="Đóng cửa sổ tạo tài khoản"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </header>

        <form className="space-y-4" noValidate onSubmit={handleSubmit}>
          {submitError && (
            <div
              aria-live="assertive"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
              role="alert"
            >
              {submitError}
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="create-full-name">
              Họ và tên <span className="text-rose-600">*</span>
            </label>
            <input
              autoComplete="name"
              className={fieldClass('fullName')}
              id="create-full-name"
              maxLength={150}
              onChange={(event) => updateField('fullName', event.target.value)}
              required
              value={values.fullName}
            />
            {errors.fullName && <p className="mt-1 text-xs text-rose-600">{errors.fullName}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="create-email">
              Email <span className="text-rose-600">*</span>
            </label>
            <input
              autoComplete="email"
              className={fieldClass('email')}
              id="create-email"
              maxLength={254}
              onChange={(event) => updateField('email', event.target.value)}
              required
              type="email"
              value={values.email}
            />
            {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="create-department">
              Phòng ban <span className="text-rose-600">*</span>
            </label>
            <input
              className={fieldClass('department')}
              id="create-department"
              maxLength={120}
              onChange={(event) => updateField('department', event.target.value)}
              required
              value={values.department}
            />
            {errors.department && <p className="mt-1 text-xs text-rose-600">{errors.department}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="create-role">
              Vai trò hệ thống <span className="text-rose-600">*</span>
            </label>
            <select
              className={fieldClass('role')}
              id="create-role"
              onChange={(event) => updateField('role', event.target.value)}
              required
              value={values.role}
            >
              <option value="">Chọn vai trò</option>
              {(Object.keys(ROLE_DISPLAY_NAMES) as AccountRole[]).map((role) => (
                <option key={role} value={role}>{ROLE_DISPLAY_NAMES[role]}</option>
              ))}
            </select>
            {errors.role && <p className="mt-1 text-xs text-rose-600">{errors.role}</p>}
          </div>

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
              className="inline-flex min-w-36 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting && (
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                />
              )}
              {isSubmitting ? 'Đang lưu...' : 'Tạo tài khoản'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
};

export default CreateAccountModal;
