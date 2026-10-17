/**
 * Phân loại các thông báo trong hệ thống tuyển dụng thông minh
 * Jira Subtask: TKNHTTDNB1-541 - Thiết kế chuông và danh sách thông báo (Story TKNHTTDNB1-79)
 */
export type NotificationType =
  | 'OFFER'
  | 'INTERVIEW'
  | 'CANDIDATE'
  | 'SLA_WARNING'
  | 'JOB_POSTING'
  | 'SYSTEM';

/**
 * Mức độ ưu tiên của thông báo
 */
export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

/**
 * Tab lọc danh sách thông báo
 */
export type NotificationFilterTab = 'ALL' | 'UNREAD';

/**
 * Cấu trúc một thông báo trong hệ thống
 */
export interface AppNotificationItem {
  notificationId: string;
  title: string;
  content: string;
  type: NotificationType;
  priority?: NotificationPriority;
  isRead: boolean;
  createdAt: string;
  targetUrl?: string;
  senderName?: string;
  senderAvatar?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Props cho component NotificationBell (Chuông thông báo)
 */
export interface NotificationBellProps {
  initialNotifications?: AppNotificationItem[];
  onNotificationClick?: (notificationItem: AppNotificationItem) => void;
  onOpenDropdownChange?: (isOpen: boolean) => void;
  containerClassName?: string;
  dropdownPlacement?: 'bottom-right' | 'bottom-left';
}

/**
 * Props cho component NotificationDropdown (Giao diện thả xuống)
 */
export interface NotificationDropdownProps {
  isOpen: boolean;
  notificationList: AppNotificationItem[];
  unreadNotificationCount: number;
  activeFilterTab: NotificationFilterTab;
  onFilterTabChange: (filterTab: NotificationFilterTab) => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onNotificationClick: (notificationItem: AppNotificationItem) => void;
  onClose: () => void;
  className?: string;
}

/**
 * Props cho từng item thông báo trong danh sách
 */
export interface NotificationItemProps {
  notificationItem: AppNotificationItem;
  onMarkAsRead: (notificationId: string) => void;
  onItemClick: (notificationItem: AppNotificationItem) => void;
}
