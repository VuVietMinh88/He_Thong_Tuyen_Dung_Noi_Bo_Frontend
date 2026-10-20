import React, { useState, useEffect } from 'react';
import type { UserAccount } from '../../types/account';
import { ROLE_DISPLAY_NAMES } from '../../types/account';
import { tokenService } from '../../services/token.service';
import { userService } from '../../services/userService';

interface LockAccountModalProps {
  isOpen: boolean;
  account: UserAccount | null;
  onClose: () => void;
  onConfirmLock: (userId: string, reason: string) => Promise<void> | void;
}

// Danh sách các lý do khóa mẫu giúp Admin thao tác nhanh chóng
const QUICK_LOCK_REASONS = [
  'Nghỉ việc / Chấm dứt hợp đồng lao động',
  'Tạm đình chỉ công tác theo quyết định kỷ luật',
  'Vi phạm quy định & chính sách an toàn thông tin',
  'Chuyển công tác sang đơn vị thành viên khác',
  'Tài khoản không hoạt động quá hạn quy định',
];

const MIN_REASON_LENGTH = 5;
const MAX_REASON_LENGTH = 500;

interface LockAccountFormContentProps {
  account: UserAccount;
  onClose: () => void;
  onConfirmLock: (userId: string, reason: string) => Promise<void> | void;
}

const LockAccountFormContent: React.FC<LockAccountFormContentProps> = ({
  account,
  onClose,
  onConfirmLock,
}) => {
  const [reason, setReason] = useState<string>('');
  const [handoverUserId, setHandoverUserId] = useState<string>('');
  const [handoverNotes, setHandoverNotes] = useState<string>('');
  const [candidateUsers, setCandidateUsers] = useState<UserAccount[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
  const [usersError, setUsersError] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Kiểm tra tài khoản chính mình (Admin không thể tự khóa chính mình)
  const currentUser = tokenService.getUserData();
  const isSelf = Boolean(
    currentUser &&
      (currentUser.id === account.id ||
        (currentUser.email &&
          currentUser.email.toLowerCase() === account.email.toLowerCase()))
  );

  // Fetch danh sách người dùng để bàn giao công việc
  useEffect(() => {
    let isCurrent = true;
    setIsLoadingUsers(true);
    setUsersError('');

    userService
      .getUsers({ limit: 100 })
      .then((response) => {
        if (!isCurrent) return;
        // Loại bỏ chính tài khoản sắp bị khóa
        const availableUsers = response.users.filter(
          (u) => u.id !== account.id && u.status === 'ACTIVE'
        );
        setCandidateUsers(availableUsers);
      })
      .catch((err) => {
        if (!isCurrent) return;
        setUsersError(
          err instanceof Error
            ? err.message
            : 'Không thể tải danh sách nhân sự để bàn giao công việc.'
        );
      })
      .finally(() => {
        if (!isCurrent) return;
        setIsLoadingUsers(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [account.id]);

  const assignedJobsList = account.assignedJobs || [];
  const activeJobsCount = account.activeJobsCount ?? assignedJobsList.length;

  const handleSelectQuickReason = (quickReason: string) => {
    setReason(quickReason);
    setErrorMessage('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isSelf) {
      setErrorMessage(
        'Quy tắc bảo mật: Bạn không thể tự khóa tài khoản quản trị của chính mình.'
      );
      return;
    }

    // Yêu cầu chọn người nhận bàn giao công việc
    if (!handoverUserId) {
      setErrorMessage(
        'Vui lòng chọn nhân sự tiếp nhận bàn giao công việc trước khi khóa tài khoản.'
      );
      return;
    }

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setErrorMessage('Lý do khóa tài khoản là bắt buộc. Vui lòng nhập lý do cụ thể.');
      return;
    }

    if (trimmedReason.length < MIN_REASON_LENGTH) {
      setErrorMessage(
        `Lý do khóa tài khoản quá ngắn. Vui lòng nhập tối thiểu ${MIN_REASON_LENGTH} ký tự.`
      );
      return;
    }

    const handoverUser = candidateUsers.find((u) => u.id === handoverUserId);
    const handoverTag = handoverUser
      ? `[Bàn giao cho: ${handoverUser.fullName}]`
      : '';
    const notesTag = handoverNotes.trim() ? ` - Nội dung: ${handoverNotes.trim()}` : '';

    // Đảm bảo tổng độ dài reason không vượt quá 500 ký tự theo hợp đồng Backend
    let fullReason = `${trimmedReason} ${handoverTag}${notesTag}`.trim();
    if (fullReason.length > MAX_REASON_LENGTH) {
      fullReason = fullReason.slice(0, MAX_REASON_LENGTH);
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await onConfirmLock(account.id, fullReason);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Không thể khóa tài khoản. Vui lòng kiểm tra lại kết nối và thử lại.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Thông tin tài khoản sắp bị khóa */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-800">{account.fullName}</p>
            <p className="text-xs text-slate-500">{account.email}</p>
          </div>
          <div className="text-right">
            <span className="inline-block rounded-md bg-white border border-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700 shadow-2xs">
              {account.department || 'Chưa phân phòng'}
            </span>
            <p className="mt-0.5 text-[11px] font-semibold text-indigo-600">
              {ROLE_DISPLAY_NAMES[account.role]}
            </p>
          </div>
        </div>
      </div>

      {/* Cảnh báo an toàn nếu là tài khoản của chính mình */}
      {isSelf && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
          <span className="text-base leading-none">🚫</span>
          <div>
            <p className="font-bold">Hành động bị chặn bởi quy tắc bảo mật:</p>
            <p className="mt-0.5">
              Bạn đang cố gắng khóa chính tài khoản của mình. Hệ thống từ chối hành động này để tránh mất quyền quản trị viên.
            </p>
          </div>
        </div>
      )}

      {/* Cảnh báo vị trí tuyển dụng phụ trách */}
      {activeJobsCount > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-4 text-amber-900 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="text-lg leading-none">⚠️</span>
            <div className="flex-1">
              <h3 className="text-xs font-bold uppercase tracking-wide text-amber-800">
                Nhân sự đang phụ trách {activeJobsCount} vị trí tuyển dụng
              </h3>
              <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                Tất cả quy trình sàng lọc và lịch phỏng vấn đang diễn ra cần được chuyển giao cho nhân sự khác tiếp quản.
              </p>
              {assignedJobsList.length > 0 && (
                <ul className="mt-2 space-y-1 rounded-lg bg-white/70 p-2.5 border border-amber-200/60 text-xs">
                  {assignedJobsList.map((jobTitle, index) => (
                    <li key={index} className="flex items-center gap-1.5 text-amber-900">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                      <span className="font-medium">{jobTitle}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1: Chọn người nhận bàn giao công việc */}
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
          <label
            htmlFor="handover-user-select"
            className="block text-xs font-bold uppercase tracking-wide text-indigo-950 mb-1"
          >
            1. Người nhận bàn giao công việc <span className="text-rose-600">*</span>
          </label>
          <p className="text-xs text-indigo-800/80 mb-2.5">
            Chọn một nhân sự đang hoạt động trong hệ thống để tiếp nhận công việc và vị trí phụ trách.
          </p>

          <select
            id="handover-user-select"
            value={handoverUserId}
            onChange={(e) => {
              setHandoverUserId(e.target.value);
              if (errorMessage) setErrorMessage('');
            }}
            disabled={isSubmitting || isSelf || isLoadingUsers}
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
          >
            <option value="">-- Chọn nhân sự nhận bàn giao --</option>
            {candidateUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName} ({u.email}) - {u.department || 'Chưa phân phòng'} [{ROLE_DISPLAY_NAMES[u.role]}]
              </option>
            ))}
          </select>

          {isLoadingUsers && (
            <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              Đang tải danh sách nhân sự từ hệ thống...
            </p>
          )}

          {usersError && (
            <p className="mt-1.5 text-xs font-medium text-rose-600">{usersError}</p>
          )}

          <div className="mt-3">
            <label
              htmlFor="handover-notes-textarea"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Ghi chú nội dung bàn giao <span className="text-slate-400 font-normal">(Tùy chọn)</span>
            </label>
            <textarea
              id="handover-notes-textarea"
              rows={2}
              value={handoverNotes}
              onChange={(e) => setHandoverNotes(e.target.value)}
              disabled={isSubmitting || isSelf}
              placeholder="VD: Bàn giao các tin tuyển dụng phòng IT và 5 ứng viên đang chờ duyệt..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 resize-none"
            />
          </div>
        </div>

        {/* Step 2: Lý do khóa tài khoản */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="lock-reason-textarea"
              className="text-xs font-bold uppercase tracking-wide text-slate-700"
            >
              2. Lý do khóa tài khoản <span className="text-rose-600">*</span>
            </label>
            <span
              className={`text-[11px] font-medium ${
                reason.length > MAX_REASON_LENGTH
                  ? 'text-rose-600 font-bold'
                  : 'text-slate-400'
              }`}
            >
              {reason.length}/{MAX_REASON_LENGTH} ký tự
            </span>
          </div>

          <textarea
            id="lock-reason-textarea"
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (errorMessage) setErrorMessage('');
            }}
            disabled={isSubmitting || isSelf}
            maxLength={MAX_REASON_LENGTH}
            required
            placeholder="Nhập chi tiết lý do khóa tài khoản (bắt buộc: Nghỉ việc, Chuyển công tác, Vi phạm chính sách,...)"
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 disabled:bg-slate-100 disabled:cursor-not-allowed resize-none transition"
          />
        </div>

        {/* Gợi ý lý do khóa nhanh */}
        {!isSelf && (
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Gợi ý lý do khóa nhanh:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_LOCK_REASONS.map((quickReason) => (
                <button
                  key={quickReason}
                  type="button"
                  onClick={() => handleSelectQuickReason(quickReason)}
                  disabled={isSubmitting}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                >
                  + {quickReason}
                </button>
              ))}
            </div>
          </div>
        )}

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
            disabled={isSubmitting || isSelf}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-rose-200 transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
          >
            {isSubmitting ? (
              <>
                <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Đang xử lý khóa...</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Xác nhận bàn giao &amp; Khóa</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export const LockAccountModal: React.FC<LockAccountModalProps> = ({
  isOpen,
  account,
  onClose,
  onConfirmLock,
}) => {
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

  return (
    <div
      role="dialog"
      data-session-draft-id={account.id}
      data-session-draft-type="lock-account"
      aria-modal="true"
      aria-labelledby="lock-account-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs transition-opacity animate-fade-in"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10 sm:p-7 max-h-[92vh] overflow-y-auto">
        {/* Header với biểu tượng bàn giao và khóa */}
        <div className="flex items-start gap-4 border-b border-slate-100 pb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 ring-4 ring-amber-50">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2
                id="lock-account-modal-title"
                className="text-lg font-bold text-slate-900"
              >
                Bàn giao công việc &amp; Khóa tài khoản
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                aria-label="Đóng cửa sổ"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Chỉ định nhân sự tiếp nhận công việc trước khi thu hồi quyền truy cập của tài khoản này.
            </p>
          </div>
        </div>

        <LockAccountFormContent
          key={account.id}
          account={account}
          onClose={onClose}
          onConfirmLock={onConfirmLock}
        />
      </div>
    </div>
  );
};

export default LockAccountModal;
