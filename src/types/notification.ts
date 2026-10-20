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
 * Metadata mở rộng đính kèm theo từng thông báo
 */
export interface NotificationMetadata {
  offerId?: string;
  offerCode?: string;
  candidateId?: string;
  candidateName?: string;
  interviewId?: string;
  jobId?: string;
  postingId?: string;
  departmentId?: string;
  departmentName?: string;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  statusCode?: number;
  [key: string]: unknown;
}

/**
 * Kết quả kiểm tra quyền truy cập đối tượng thông báo
 * Jira Subtask: TKNHTTDNB1-542 - Tích hợp mở đúng đối tượng từ thông báo
 */
export interface NotificationAccessCheckResult {
  hasAccess: boolean;
  errorMessage?: string;
  targetUrl?: string;
  denialReason?: 'DEPARTMENT_MISMATCH' | 'INSUFFICIENT_PERMISSIONS' | 'UNAUTHENTICATED' | 'FORBIDDEN';
}

/**
 * Tuỳ chọn xử lý điều hướng thông báo
 */
export interface NotificationRoutingHandlerOptions {
  onSuccess?: (notificationItem: AppNotificationItem, targetUrl: string) => void;
  onPermissionDenied?: (notificationItem: AppNotificationItem, errorMessage: string) => void;
  onError?: (notificationItem: AppNotificationItem, error: unknown) => void;
  onNotificationRead?: (notificationId: string) => void;
  skipPermissionCheck?: boolean;
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

/**
 * Phân loại danh mục sự kiện thông báo
 * Jira Subtask: TKNHTTDNB1-547 - Thiết kế trang tùy chọn nhận thông báo (Story TKNHTTDNB1-80)
 */
export type NotificationEventCategory =
  | 'REQUISITION'
  | 'POSITION'
  | 'INTERVIEW'
  | 'OFFER'
  | 'CANDIDATE'
  | 'SLA_SYSTEM';

/**
 * Cấu trúc một mục cấu hình tùy chọn nhận thông báo
 */
export interface NotificationSettingItem {
  eventId: string;
  eventName: string;
  eventDescription: string;
  category: NotificationEventCategory;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  isMandatoryInApp?: boolean;
  isMandatoryEmail?: boolean;
  mandatoryExplanation?: string;
}

/**
 * Props cho Component công tắc Bật/Tắt (Toggle/Switch Component)
 * Có hỗ trợ trạng thái khóa cứng (Disabled) và hiển thị Tooltip giải thích
 */
export interface ToggleSwitchProps {
  id?: string;
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  tooltipMessage?: string;
  ariaLabel?: string;
  testId?: string;
  className?: string;
}

/**
 * Props cho Component Bảng tùy chọn nhận thông báo
 */
export interface NotificationSettingsTableProps {
  settingsList: NotificationSettingItem[];
  onToggleInApp: (eventId: string, nextValue: boolean) => void;
  onToggleEmail: (eventId: string, nextValue: boolean) => void;
  searchQuery?: string;
  selectedCategory?: NotificationEventCategory | 'ALL';
  className?: string;
}

/**
 * Phản hồi API chuẩn từ máy chủ khi cập nhật hoặc lấy cấu hình thông báo
 * Jira Subtask: TKNHTTDNB1-548 - Tích hợp lưu và tải tùy chọn cá nhân (Story TKNHTTDNB1-80)
 */
export interface NotificationPreferencesApiResponse {
  success: boolean;
  message?: string;
  data: NotificationSettingItem[];
  updatedAt?: string;
}

/**
 * Cấu trúc lỗi từ chối của máy chủ khi phát hiện vi phạm quy định thông báo bắt buộc
 */
export interface NotificationPreferenceApiError {
  statusCode: number;
  message: string;
  errorCode?: 'MANDATORY_NOTIFICATION_LOCKED' | 'INVALID_PAYLOAD' | 'UNAUTHORIZED' | string;
  violatedEventId?: string;
}

/**
 * Return type cho Custom Hook useNotificationPreferences
 */
export interface UseNotificationPreferencesReturn {
  preferencesList: NotificationSettingItem[];
  isLoadingPreferences: boolean;
  isSavingPreferences: boolean;
  preferencesError: string | null;
  securityViolationMessage: string | null;
  hasUnsavedChanges: boolean;
  fetchUserNotificationPreferences: () => Promise<NotificationSettingItem[]>;
  updateNotificationSettings: (customSettingsList?: NotificationSettingItem[]) => Promise<boolean>;
  handleToggleInApp: (eventId: string, nextEnabledValue: boolean) => void;
  handleToggleEmail: (eventId: string, nextEnabledValue: boolean) => void;
  enableAllPreferences: () => void;
  disableOptionalPreferences: () => void;
  resetToDefaultPreferences: () => Promise<void>;
  rollbackPreferences: () => void;
  clearPreferencesError: () => void;
}


