import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import type { ToggleSwitchProps } from '../../types/notification';

/**
 * Component công tắc gạt Bật/Tắt (Toggle Switch)
 * Hỗ trợ trạng thái khóa cứng (Disabled + Checked) và hiển thị Tooltip giải thích khi rê chuột
 * Jira Subtask: TKNHTTDNB1-547 - Thiết kế trang tùy chọn nhận thông báo (Story TKNHTTDNB1-80)
 */
export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  id,
  checked,
  onChange,
  disabled = false,
  tooltipMessage = 'Đây là thông báo bắt buộc của hệ thống, không thể tắt.',
  ariaLabel,
  testId,
  className = '',
}) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState<boolean>(false);

  const handleSwitchClick = () => {
    // Ngăn chặn thao tác đổi trạng thái khi công tắc đang bị khóa bắt buộc theo quy định hệ thống
    if (disabled) return;
    if (onChange) {
      onChange(!checked);
    }
  };

  const handleSwitchKeyDown = (keyboardEvent: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (keyboardEvent.key === ' ' || keyboardEvent.key === 'Enter') {
      keyboardEvent.preventDefault();
      if (onChange) {
        onChange(!checked);
      }
    }
  };

  const shouldDisplayTooltip = disabled && Boolean(tooltipMessage);

  return (
    <div
      data-testid={testId ? `${testId}-wrapper` : 'toggle-switch-wrapper'}
      className={`relative inline-flex items-center justify-center ${className}`}
      onMouseEnter={() => shouldDisplayTooltip && setIsTooltipVisible(true)}
      onMouseLeave={() => shouldDisplayTooltip && setIsTooltipVisible(false)}
      onFocus={() => shouldDisplayTooltip && setIsTooltipVisible(true)}
      onBlur={() => shouldDisplayTooltip && setIsTooltipVisible(false)}
    >
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        aria-label={ariaLabel}
        data-testid={testId}
        disabled={disabled}
        onClick={handleSwitchClick}
        onKeyDown={handleSwitchKeyDown}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out select-none ${
          disabled
            ? checked
              ? 'bg-indigo-300/90 dark:bg-indigo-900/60 cursor-not-allowed opacity-85 shadow-inner'
              : 'bg-gray-200 dark:bg-gray-800 cursor-not-allowed opacity-50'
            : checked
            ? 'bg-indigo-600 dark:bg-indigo-500 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900'
            : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-650 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900'
        }`}
      >
        <span
          className={`pointer-events-none flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        >
          {disabled && (
            <Lock
              className="h-2.5 w-2.5 text-indigo-700 dark:text-indigo-300"
              aria-hidden="true"
            />
          )}
        </span>
      </button>

      {/* Tooltip giải thích khi rê chuột vào Toggle bị khóa cứng (AC 2) */}
      {shouldDisplayTooltip && isTooltipVisible && (
        <div
          role="tooltip"
          data-testid="mandatory-tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs z-50 rounded-xl bg-gray-900 px-3 py-1.5 text-center text-xs font-semibold text-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 pointer-events-none dark:bg-gray-850 dark:border dark:border-gray-700"
        >
          <span>{tooltipMessage}</span>
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900 dark:border-t-gray-850"
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
};

export default ToggleSwitch;
