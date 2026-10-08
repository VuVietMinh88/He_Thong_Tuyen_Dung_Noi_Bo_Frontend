import React from 'react';
import type { UserAccount } from '../../types/account';

export interface ToggleStatusButtonProps {
  /** Thông tin tài khoản cần thực hiện khóa / mở khóa */
  account: UserAccount;
  /** Cờ kiểm tra nếu đây là chính tài khoản của Admin đang đăng nhập */
  isSelf?: boolean;
  /** Trạng thái đang gọi API cập nhật */
  isLoading?: boolean;
  /** Callback kích hoạt mở Modal khóa tài khoản (yêu cầu nhập lý do & cảnh báo headcount) */
  onRequestLock: (account: UserAccount) => void;
  /** Callback kích hoạt mở Dialog / Modal xác nhận mở khóa tài khoản */
  onRequestUnlock: (account: UserAccount) => void;
  /** Kích thước của nút bấm: 'sm' (cho bảng) hoặc 'md' (cho trang chi tiết) */
  size?: 'sm' | 'md';
  /** Tùy biến thêm class CSS nếu cần */
  className?: string;
}

/**
 * Component nút bấm "Khóa / Mở khóa" tài khoản người dùng
 * Đáp ứng Jira Task: TKNHTTDNB1-161 (Story 19)
 */
export const ToggleStatusButton: React.FC<ToggleStatusButtonProps> = ({
  account,
  isSelf = false,
  isLoading = false,
  onRequestLock,
  onRequestUnlock,
  size = 'sm',
  className = '',
}) => {
  const isLocked = account.status === 'LOCKED';

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (isLoading || (isSelf && !isLocked)) {
      return;
    }

    if (isLocked) {
      // Khi bấm "Mở khóa": Kích hoạt dialog xác nhận mở khóa
      onRequestUnlock(account);
    } else {
      // Khi bấm "Khóa": Kích hoạt Modal bắt buộc nhập lý do & cảnh báo headcount
      onRequestLock(account);
    }
  };

  // Xác định tooltip hiển thị
  const getTooltipTitle = (): string => {
    if (isLoading) {
      return 'Đang xử lý yêu cầu...';
    }
    if (isSelf && !isLocked) {
      return 'Quy tắc bảo mật: Không thể tự khóa tài khoản quản trị của chính mình';
    }
    return isLocked
      ? `Mở khóa tài khoản cho ${account.fullName}`
      : `Khóa tài khoản ${account.fullName} (yêu cầu nhập lý do)`;
  };

  const sizeClasses =
    size === 'md'
      ? 'px-3.5 py-2 text-sm gap-2 rounded-xl'
      : 'px-2.5 py-1.5 text-xs gap-1.5 rounded-lg';

  // Khi tài khoản đang BỊ KHÓA -> Hiển thị nút Mở khóa (Xanh / Emerald)
  if (isLocked) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        title={getTooltipTitle()}
        aria-label={`Mở khóa tài khoản ${account.fullName}`}
        className={[
          'inline-flex items-center font-medium transition shadow-xs select-none',
          'border border-emerald-200 bg-emerald-50 text-emerald-700',
          'hover:bg-emerald-100 hover:border-emerald-300 hover:text-emerald-800',
          'focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
          'disabled:cursor-wait disabled:opacity-70',
          sizeClasses,
          className,
        ].join(' ')}
      >
        {isLoading ? (
          <>
            <svg
              className="h-3.5 w-3.5 animate-spin text-emerald-600"
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
            <span>Đang mở...</span>
          </>
        ) : (
          <>
            {/* Icon Ổ khóa mở */}
            <svg
              className="h-3.5 w-3.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
              />
            </svg>
            <span>Mở khóa</span>
          </>
        )}
      </button>
    );
  }

  // Khi tài khoản đang HOẠT ĐỘNG -> Hiển thị nút Khóa (Đỏ / Rose)
  const isLockDisabled = isSelf || isLoading;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLockDisabled}
      title={getTooltipTitle()}
      aria-label={`Khóa tài khoản ${account.fullName}`}
      className={[
        'inline-flex items-center font-medium transition shadow-xs select-none',
        isSelf
          ? 'border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
          : [
              'border border-rose-200 bg-rose-50 text-rose-700',
              'hover:bg-rose-100 hover:border-rose-300 hover:text-rose-800',
              'focus:outline-none focus:ring-2 focus:ring-rose-500/20',
              'disabled:cursor-wait disabled:opacity-70',
            ].join(' '),
        sizeClasses,
        className,
      ].join(' ')}
    >
      {isLoading ? (
        <>
          <svg
            className="h-3.5 w-3.5 animate-spin text-rose-600"
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
          <span>Đang khóa...</span>
        </>
      ) : (
        <>
          {/* Icon Ổ khóa đang khóa */}
          <svg
            className="h-3.5 w-3.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span>Khóa</span>
        </>
      )}
    </button>
  );
};

export default ToggleStatusButton;
