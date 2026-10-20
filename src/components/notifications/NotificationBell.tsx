import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell } from 'lucide-react';
import type {
  AppNotificationItem,
  NotificationBellProps,
  NotificationFilterTab,
} from '../../types/notification';
import { notificationService } from '../../services/notificationService';
import { useNotificationRouting } from '../../hooks/useNotificationRouting';
import { NotificationDropdown } from './NotificationDropdown';

/**
 * Component Chuông thông báo (Notification Bell) đặt trên Header/Topbar
 * Jira Subtask: TKNHTTDNB1-541 & TKNHTTDNB1-542 (Story TKNHTTDNB1-79)
 */
export const NotificationBell: React.FC<NotificationBellProps> = ({
  initialNotifications,
  onNotificationClick,
  onOpenDropdownChange,
  containerClassName = '',
  dropdownPlacement = 'bottom-right',
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // State quản lý danh sách thông báo & trạng thái mở đóng
  const [notificationList, setNotificationList] = useState<AppNotificationItem[]>(
    initialNotifications || []
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [activeFilterTab, setActiveFilterTab] = useState<NotificationFilterTab>('ALL');

  // Tải danh sách thông báo ban đầu nếu không truyền prop
  useEffect(() => {
    if (initialNotifications && initialNotifications.length > 0) {
      setNotificationList(initialNotifications);
      return;
    }

    let isSubscribed = true;
    notificationService
      .getNotificationList()
      .then((loadedNotifications) => {
        if (isSubscribed) {
          setNotificationList(loadedNotifications);
        }
      })
      .catch(() => {
        // Fallback giữ nguyên danh sách rỗng
      });

    return () => {
      isSubscribed = false;
    };
  }, [initialNotifications]);

  // Đóng dropdown khi click bên ngoài (Click Outside) hoặc bấm phím Escape (AC 2)
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleDocumentMouseDown = (mouseEvent: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(mouseEvent.target as Node)
      ) {
        setIsDropdownOpen(false);
        if (onOpenDropdownChange) {
          onOpenDropdownChange(false);
        }
      }
    };

    const handleDocumentKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') {
        setIsDropdownOpen(false);
        if (onOpenDropdownChange) {
          onOpenDropdownChange(false);
        }
      }
    };

    document.addEventListener('mousedown', handleDocumentMouseDown);
    document.addEventListener('keydown', handleDocumentKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown);
      document.removeEventListener('keydown', handleDocumentKeyDown);
    };
  }, [isDropdownOpen, onOpenDropdownChange]);

  // Tính số lượng thông báo chưa đọc (AC 1)
  const unreadNotificationCount = notificationList.filter(
    (notificationItem) => !notificationItem.isRead
  ).length;

  // Bật/tắt trạng thái mở Dropdown
  const handleToggleDropdown = useCallback(() => {
    setIsDropdownOpen((previousState) => {
      const nextState = !previousState;
      if (onOpenDropdownChange) {
        onOpenDropdownChange(nextState);
      }
      return nextState;
    });
  }, [onOpenDropdownChange]);

  const handleCloseDropdown = useCallback(() => {
    setIsDropdownOpen(false);
    if (onOpenDropdownChange) {
      onOpenDropdownChange(false);
    }
  }, [onOpenDropdownChange]);

  // Đánh dấu một thông báo là đã đọc (AC 3)
  const handleMarkAsRead = useCallback(
    (notificationId: string) => {
      setNotificationList((previousList) =>
        previousList.map((notificationItem) => {
          if (notificationItem.notificationId === notificationId) {
            return { ...notificationItem, isRead: true };
          }
          return notificationItem;
        })
      );

      // Đồng bộ vào service
      notificationService.markNotificationAsRead(notificationId).catch(() => {
        // Xử lý lỗi ngầm
      });
    },
    []
  );

  // Đánh dấu tất cả thông báo là đã đọc (AC 3)
  const handleMarkAllAsRead = useCallback(() => {
    setNotificationList((previousList) =>
      previousList.map((notificationItem) => ({ ...notificationItem, isRead: true }))
    );

    // Đồng bộ vào service
    notificationService.markAllNotificationsAsRead().catch(() => {
      // Xử lý lỗi ngầm
    });
  }, []);

  // Tích hợp hook điều hướng thông báo và kiểm soát phân quyền (AC 1, AC 2, AC 3)
  const { handleNotificationClick: routeToTargetObject } = useNotificationRouting({
    onNotificationRead: handleMarkAsRead,
    onSuccess: () => {
      setIsDropdownOpen(false);
    },
  });

  // Xử lý click vào item thông báo (AC 1, AC 2, AC 3)
  const handleNotificationItemClick = useCallback(
    async (notificationItem: AppNotificationItem) => {
      // Đánh dấu đã đọc trước để giảm số lượng Badge ngay lập tức (AC 2)
      handleMarkAsRead(notificationItem.notificationId);

      if (onNotificationClick) {
        onNotificationClick(notificationItem);
        return;
      }

      await routeToTargetObject(notificationItem);
    },
    [handleMarkAsRead, onNotificationClick, routeToTargetObject]
  );

  return (
    <div
      ref={dropdownRef}
      data-testid="notification-bell-container"
      className={`relative inline-block ${containerClassName}`}
    >
      {/* Nút Chuông Thông Báo (AC 1) */}
      <button
        type="button"
        data-testid="btn-notification-bell"
        onClick={handleToggleDropdown}
        aria-label={`Thông báo (${unreadNotificationCount} chưa đọc)`}
        aria-expanded={isDropdownOpen}
        aria-haspopup="dialog"
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all cursor-pointer ${
          isDropdownOpen
            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm dark:border-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-300'
            : 'border-gray-200 bg-white text-gray-700 shadow-2xs hover:bg-gray-50 hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750'
        }`}
      >
        <Bell className="h-5 w-5" />

        {/* Badge hiển thị chính xác số lượng thông báo chưa đọc khi > 0 (AC 1) */}
        {unreadNotificationCount > 0 && (
          <span
            data-testid="badge-notification-count"
            className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white shadow-md ring-2 ring-white dark:ring-gray-900 animate-in zoom-in-75 duration-200"
          >
            {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
          </span>
        )}
      </button>

      {/* Giao diện thả xuống (Dropdown) danh sách thông báo (AC 2) */}
      <NotificationDropdown
        isOpen={isDropdownOpen}
        notificationList={notificationList}
        unreadNotificationCount={unreadNotificationCount}
        activeFilterTab={activeFilterTab}
        onFilterTabChange={setActiveFilterTab}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onNotificationClick={handleNotificationItemClick}
        onClose={handleCloseDropdown}
        className={dropdownPlacement === 'bottom-left' ? 'left-0 right-auto' : 'right-0 left-auto'}
      />
    </div>
  );
};

export default NotificationBell;
