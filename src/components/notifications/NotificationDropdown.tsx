import React, { memo } from 'react';
import {
  CheckCheck,
  Check,
  Clock,
  Inbox,
  Gift,
  Calendar,
  UserCheck,
  AlertTriangle,
  Briefcase,
  Bell,
  X,
  ExternalLink,
} from 'lucide-react';
import type {
  NotificationDropdownProps,
  NotificationItemProps,
  NotificationType,
} from '../../types/notification';
import {
  formatRelativeTimeVietnamese,
  NOTIFICATION_TYPE_STYLES,
} from '../../utils/notificationHelper';

/**
 * Render icon tương ứng theo loại thông báo
 */
const renderNotificationTypeIcon = (type: NotificationType) => {
  switch (type) {
    case 'OFFER':
      return <Gift className="h-4 w-4" />;
    case 'INTERVIEW':
      return <Calendar className="h-4 w-4" />;
    case 'CANDIDATE':
      return <UserCheck className="h-4 w-4" />;
    case 'SLA_WARNING':
      return <AlertTriangle className="h-4 w-4" />;
    case 'JOB_POSTING':
      return <Briefcase className="h-4 w-4" />;
    case 'SYSTEM':
    default:
      return <Bell className="h-4 w-4" />;
  }
};

/**
 * Từng item thông báo đơn lẻ trong danh sách
 * Tối ưu hóa render bằng memo (AC 4)
 */
const NotificationRowItem: React.FC<NotificationItemProps> = memo(
  ({ notificationItem, onMarkAsRead, onItemClick }) => {
    const typeStyle =
      NOTIFICATION_TYPE_STYLES[notificationItem.type] || NOTIFICATION_TYPE_STYLES.SYSTEM;
    const isUnread = !notificationItem.isRead;

    const handleRowClick = () => {
      if (isUnread) {
        onMarkAsRead(notificationItem.notificationId);
      }
      onItemClick(notificationItem);
    };

    const handleMarkReadButtonClick = (clickEvent: React.MouseEvent<HTMLButtonElement>) => {
      clickEvent.stopPropagation();
      onMarkAsRead(notificationItem.notificationId);
    };

    return (
      <div
        data-testid={`notification-item-${notificationItem.notificationId}`}
        onClick={handleRowClick}
        className={`group relative flex items-start gap-3.5 p-3.5 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0 dark:border-gray-800/80 ${
          isUnread
            ? 'bg-indigo-50/50 hover:bg-indigo-50/80 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40'
            : 'bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-850/50'
        }`}
      >
        {/* Icon theo loại thông báo (AC 2) */}
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${typeStyle.iconBg} ${typeStyle.iconColor} shadow-2xs`}
        >
          {renderNotificationTypeIcon(notificationItem.type)}
        </div>

        {/* Nội dung thông báo & Thời gian (AC 2) */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${typeStyle.badgeBg} ${typeStyle.badgeText}`}
            >
              {typeStyle.label}
            </span>
            <span className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1 font-medium">
              <Clock className="h-3 w-3" />
              {formatRelativeTimeVietnamese(notificationItem.createdAt)}
            </span>
          </div>

          {/* Tiêu đề: In đậm nếu chưa đọc, in thường nếu đã đọc (AC 2) */}
          <h4
            data-testid={`notification-title-${notificationItem.notificationId}`}
            className={`text-xs leading-snug line-clamp-1 ${
              isUnread
                ? 'font-extrabold text-gray-900 dark:text-white'
                : 'font-medium text-gray-700 dark:text-gray-300'
            }`}
          >
            {notificationItem.title}
          </h4>

          {/* Nội dung chi tiết */}
          <p
            data-testid={`notification-content-${notificationItem.notificationId}`}
            className={`mt-0.5 text-xs line-clamp-2 leading-relaxed ${
              isUnread
                ? 'text-gray-800 dark:text-gray-200 font-medium'
                : 'text-gray-500 dark:text-gray-400 font-normal'
            }`}
          >
            {notificationItem.content}
          </p>

          {/* Người gửi hoặc liên kết nếu có */}
          {notificationItem.senderName && (
            <span className="mt-1 block text-[10px] text-gray-400 dark:text-gray-500">
              Từ: {notificationItem.senderName}
            </span>
          )}
        </div>

        {/* Trạng thái chưa đọc (Chấm xanh) và Nút đánh dấu đã đọc (AC 2 & AC 3) */}
        <div className="absolute right-3 top-3.5 flex flex-col items-center gap-2">
          {isUnread && (
            <span
              data-testid="unread-dot"
              className="h-2.5 w-2.5 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-gray-900 shadow-xs"
              title="Thông báo chưa đọc"
            />
          )}

          {/* Nút hành động đánh dấu đã đọc từng thông báo (AC 3) */}
          {isUnread && (
            <button
              type="button"
              data-testid={`btn-mark-read-${notificationItem.notificationId}`}
              onClick={handleMarkReadButtonClick}
              title="Đánh dấu đã đọc"
              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-gray-800 dark:hover:text-indigo-400 transition-all cursor-pointer shadow-2xs"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          )}

          {notificationItem.targetUrl && (
            <ExternalLink className="h-3 w-3 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </div>
    );
  }
);
NotificationRowItem.displayName = 'NotificationRowItem';

/**
 * Component Dropdown danh sách thông báo
 * ĐƯỢC BỌC TRONG React.memo ĐỂ TRÁNH RE-RENDER TOÀN BỘ HEADER (AC 4)
 */
export const NotificationDropdown: React.FC<NotificationDropdownProps> = memo(
  ({
    isOpen,
    notificationList,
    unreadNotificationCount,
    activeFilterTab,
    onFilterTabChange,
    onMarkAsRead,
    onMarkAllAsRead,
    onNotificationClick,
    onClose,
    className = '',
  }) => {
    if (!isOpen) {
      return null;
    }

    // Lọc danh sách theo tab (Tất cả / Chưa đọc)
    const filteredNotificationList =
      activeFilterTab === 'UNREAD'
        ? notificationList.filter((notificationItem) => !notificationItem.isRead)
        : notificationList;

    return (
      <div
        role="dialog"
        aria-label="Danh sách thông báo"
        data-testid="notification-dropdown-container"
        className={`absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${className}`}
      >
        {/* 1. Header Dropdown: Tiêu đề + Đánh dấu tất cả đã đọc (AC 3) */}
        <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-800 bg-gradient-to-r from-gray-50/80 to-white dark:from-gray-800/40 dark:to-gray-900">
          <div className="flex items-center gap-2">
            <h3
              data-testid="dropdown-header-title"
              className="text-sm font-extrabold text-gray-900 dark:text-white"
            >
              Thông Báo
            </h3>
            {unreadNotificationCount > 0 && (
              <span
                data-testid="dropdown-unread-count"
                className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
              >
                {unreadNotificationCount} mới
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Nút Đánh dấu tất cả đã đọc (AC 3) */}
            {unreadNotificationCount > 0 && (
              <button
                type="button"
                data-testid="btn-mark-all-read"
                onClick={onMarkAllAsRead}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer"
                title="Đánh dấu tất cả thông báo là đã đọc"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Đọc tất cả</span>
              </button>
            )}

            <button
              type="button"
              data-testid="btn-close-dropdown"
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
              title="Đóng thông báo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 2. Tabs bộ lọc: Tất cả / Chưa đọc */}
        <div className="flex border-b border-gray-100 bg-gray-50/60 px-4 py-2 dark:border-gray-800/80 dark:bg-gray-850/40">
          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              data-testid="tab-filter-all"
              onClick={() => onFilterTabChange('ALL')}
              className={`rounded-lg px-3 py-1 font-bold transition-all cursor-pointer ${
                activeFilterTab === 'ALL'
                  ? 'bg-white text-indigo-700 shadow-2xs dark:bg-gray-800 dark:text-white'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Tất cả ({notificationList.length})
            </button>
            <button
              type="button"
              data-testid="tab-filter-unread"
              onClick={() => onFilterTabChange('UNREAD')}
              className={`rounded-lg px-3 py-1 font-bold transition-all cursor-pointer ${
                activeFilterTab === 'UNREAD'
                  ? 'bg-white text-indigo-700 shadow-2xs dark:bg-gray-800 dark:text-white'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Chưa đọc ({unreadNotificationCount})
            </button>
          </div>
        </div>

        {/* 3. Danh sách thông báo (Scroll Area - AC 2) */}
        <div
          data-testid="notification-dropdown-list"
          className="max-h-[380px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/60"
        >
          {filteredNotificationList.length === 0 ? (
            <div
              data-testid="notification-empty-state"
              className="flex flex-col items-center justify-center p-8 text-center text-xs text-gray-500 dark:text-gray-400"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 mb-2">
                <Inbox className="h-6 w-6" />
              </div>
              <p className="font-semibold text-gray-700 dark:text-gray-300">
                {activeFilterTab === 'UNREAD'
                  ? 'Bạn không có thông báo chưa đọc nào'
                  : 'Chưa có thông báo nào'}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400">
                Các cập nhật mới về offer, lịch phỏng vấn và ứng viên sẽ hiển thị tại đây.
              </p>
            </div>
          ) : (
            filteredNotificationList.map((notificationItem) => (
              <NotificationRowItem
                key={notificationItem.notificationId}
                notificationItem={notificationItem}
                onMarkAsRead={onMarkAsRead}
                onItemClick={onNotificationClick}
              />
            ))
          )}
        </div>

        {/* 4. Footer Dropdown */}
        <div className="flex items-center justify-center border-t border-gray-100 p-2.5 bg-gray-50/70 text-[11px] text-gray-500 dark:border-gray-800 dark:bg-gray-850/60 dark:text-gray-400">
          <span>Hệ Thống Tuyển Dụng Thông Minh • Thông báo tức thời</span>
        </div>
      </div>
    );
  }
);
NotificationDropdown.displayName = 'NotificationDropdown';

export default NotificationDropdown;
