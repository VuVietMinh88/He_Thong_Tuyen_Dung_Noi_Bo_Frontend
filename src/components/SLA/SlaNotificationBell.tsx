import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, CheckCheck, Clock, ExternalLink, Flag, ShieldAlert, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { CandidateProfile } from '../../types/candidate';
import type { SlaDailyReminder, SlaSettings } from '../../types/sla';
import { slaService } from '../../services/slaService';

export interface SlaNotificationBellProps {
  candidates?: CandidateProfile[];
  settings?: SlaSettings;
  onSelectCandidate?: (candidateId: string) => void;
  className?: string;
}

export const SlaNotificationBell: React.FC<SlaNotificationBellProps> = ({
  candidates = [],
  settings,
  onSelectCandidate,
  className = '',
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [reminders, setReminders] = useState<SlaDailyReminder[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Đồng bộ và quét kiểm tra SLA định kỳ (chống nhắc trùng trong cùng 1 ngày - AC 3)
  const refreshReminders = useCallback(() => {
    if (candidates && candidates.length > 0) {
      const updated = slaService.runDailySlaCheck(candidates, settings);
      setReminders(updated);
    } else {
      setReminders(slaService.getStoredDailyReminders());
    }
  }, [candidates, settings]);

  useEffect(() => {
    refreshReminders();
  }, [refreshReminders]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = reminders.filter((r) => !r.isRead).length;

  const handleMarkAllAsRead = () => {
    slaService.markAllRemindersAsRead();
    setReminders((prev) => prev.map((r) => ({ ...r, isRead: true })));
  };

  const handleViewCandidate = (candidateId: string, reminderId: string) => {
    slaService.markReminderAsRead(reminderId);
    setReminders((prev) =>
      prev.map((r) => (r.id === reminderId ? { ...r, isRead: true } : r))
    );
    setIsOpen(false);
    if (onSelectCandidate) {
      onSelectCandidate(candidateId);
    } else {
      navigate(`/candidates/${candidateId}`);
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Nút Chuông thông báo */}
      <button
        type="button"
        id="sla-notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Thông báo nhắc việc hồ sơ quá hạn SLA"
        aria-expanded={isOpen}
        className="relative inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors focus:outline-hidden focus:ring-2 focus:ring-rose-500"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            data-testid="sla-bell-badge"
            className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-extrabold text-white bg-rose-600 rounded-full ring-2 ring-white dark:ring-gray-900 animate-pulse"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu nhắc việc */}
      {isOpen && (
        <div
          data-testid="sla-reminders-dropdown"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-gray-900 shadow-xl ring-1 ring-black/10 dark:ring-white/10 z-50 overflow-hidden border border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Nhắc việc SLA quá hạn
              </h3>
              {unreadCount > 0 && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                  {unreadCount} mới
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  title="Đánh dấu tất cả là đã đọc"
                  className="p-1 text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded flex items-center gap-1 font-medium"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Đọc hết
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Danh sách thông báo */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {reminders.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <Clock className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Không có hồ sơ nào quá hạn hôm nay
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs mx-auto">
                  Tất cả hồ sơ ứng viên đang được xử lý trong hạn SLA quy định.
                </p>
              </div>
            ) : (
              reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className={`p-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 ${
                    !reminder.isRead ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                          {reminder.candidateName}
                        </span>
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-200 shrink-0">
                          <Flag className="w-2.5 h-2.5" />
                          Quá {reminder.overdueDays} ngày
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1.5">
                        {reminder.appliedJobTitle} • Giai đoạn: <strong>{reminder.stageName}</strong>
                      </p>
                      <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                        {reminder.message}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
                        <span>Nhắc ngày: {reminder.reminderDate}</span>
                        <button
                          type="button"
                          onClick={() => handleViewCandidate(reminder.candidateId, reminder.id)}
                          className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          Xử lý ngay <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-gray-50/70 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 text-center text-[11px] text-gray-500 dark:text-gray-400">
            Tác vụ nhắc việc chạy định kỳ 1 lần/ngày lúc <strong>{settings?.reminderTime || '09:00'}</strong> (không nhắc trùng).
          </div>
        </div>
      )}
    </div>
  );
};

export default SlaNotificationBell;

