import React, { useState, useEffect } from 'react';
import type { UserAccount } from '../../types/account';
import { ROLE_DISPLAY_NAMES } from '../../types/account';

interface UnlockAccountModalProps {
  isOpen: boolean;
  account: UserAccount | null;
  onClose: () => void;
  onConfirmUnlock: (userId: string) => Promise<void> | void;
}

interface UnlockAccountContentProps {
  account: UserAccount;
  onClose: () => void;
  onConfirmUnlock: (userId: string) => Promise<void> | void;
}

const UnlockAccountContent: React.FC<UnlockAccountContentProps> = ({
  account,
  onClose,
  onConfirmUnlock,
}) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleUnlock = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await onConfirmUnlock(account.id);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Không thể mở khóa tài khoản. Vui lòng thử lại sau.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Thông tin tài khoản và lý do đã bị khóa trước đó */}
      <div className="mt-4 space-y-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <p className="text-sm font-bold text-slate-800">{account.fullName}</p>
          <p className="text-xs text-slate-500">{account.email}</p>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600">🏢 {account.department}</span>
            <span className="font-semibold text-indigo-600">
              {ROLE_DISPLAY_NAMES[account.role]}
            </span>
          </div>
        </div>

        {/* Hiển thị lý do bị khóa trước đó nếu có */}
        {account.lockReason && (
          <div className="rounded-xl border border-rose-200/80 bg-rose-50/60 p-3 text-xs text-rose-800">
            <p className="font-bold flex items-center gap-1.5">
              <span>🔒 Lý do đã khóa:</span>
            </p>
            <p className="mt-1 text-slate-700 italic">"{account.lockReason}"</p>
            {account.lockedAt && (
              <p className="mt-1 text-[11px] text-slate-500">
                Thời điểm khóa: {account.lockedAt}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Thông báo lỗi nếu có */}
      {errorMessage && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="mt-5 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 border border-amber-200">
        <p>
          Thao tác này gỡ khóa do quản trị viên đặt. Tài khoản chỉ đăng nhập được nếu không còn trạng thái hạn chế khác.
        </p>
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Hủy bỏ
        </button>

        <button
          type="button"
          onClick={handleUnlock}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Đang mở khóa...</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              <span>Xác nhận mở khóa</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export const UnlockAccountModal: React.FC<UnlockAccountModalProps> = ({
  isOpen,
  account,
  onClose,
  onConfirmUnlock,
}) => {
  // Đóng modal khi nhấn phím ESC
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
      data-session-draft-type="unlock-account"
      aria-modal="true"
      aria-labelledby="unlock-account-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs transition-opacity animate-fade-in"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10 sm:p-7">
        {/* Header với icon ổ khóa mở màu xanh lá */}
        <div className="flex items-start gap-4 border-b border-slate-100 pb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 ring-4 ring-emerald-50">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
              />
            </svg>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2
                id="unlock-account-modal-title"
                className="text-lg font-bold text-slate-900"
              >
                Mở khóa tài khoản
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
              Khôi phục quyền truy cập hệ thống cho nhân sự này.
            </p>
          </div>
        </div>

        {/* Nội dung form với key={account.id} */}
        <UnlockAccountContent
          key={account.id}
          account={account}
          onClose={onClose}
          onConfirmUnlock={onConfirmUnlock}
        />
      </div>
    </div>
  );
};

export default UnlockAccountModal;
