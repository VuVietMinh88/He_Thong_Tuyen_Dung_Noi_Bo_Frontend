import axiosClient from '../utils/axiosClient';
import type { AppNotificationItem } from '../types/notification';

const STORAGE_KEY_NOTIFICATIONS = 'smart_recruit_notifications_storage';

let inMemoryNotifications: AppNotificationItem[] = [];

/**
 * Dữ liệu thông báo mẫu thực tế theo quy trình tuyển dụng
 */
const DEFAULT_INITIAL_NOTIFICATIONS: AppNotificationItem[] = [
  {
    notificationId: 'notif-offer-001',
    title: 'Đề nghị tuyển dụng chờ phê duyệt',
    content: 'Đề nghị tuyển dụng OFF-2026-8899 cho ứng viên Trần Minh Đức (Senior Frontend) đang chờ bạn xét duyệt.',
    type: 'OFFER',
    priority: 'HIGH',
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 phút trước
    targetUrl: '/offers/OFF-2026-8899/approval',
    senderName: 'Nguyễn Phương Anh',
    metadata: {
      offerCode: 'OFF-2026-8899',
      candidateName: 'Trần Minh Đức',
      salary: 48000000,
    },
  },
  {
    notificationId: 'notif-sla-002',
    title: 'Cảnh báo vi phạm thời hạn SLA',
    content: 'Hồ sơ ứng viên Nguyễn Văn An (Vị trí Backend Engineer) đã ở vòng Sơ loại quá 3 ngày.',
    type: 'SLA_WARNING',
    priority: 'URGENT',
    isRead: false,
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(), // 35 phút trước
    targetUrl: '/candidates',
    senderName: 'Hệ thống Quản lý SLA',
    metadata: {
      candidateId: 'can-overdue-01',
      stage: 'SCREENING',
    },
  },
  {
    notificationId: 'notif-interview-003',
    title: 'Lịch phỏng vấn chuyên môn mới',
    content: 'Bạn có một buổi phỏng vấn kỹ thuật với ứng viên Đặng Quốc Anh vào 09:30 ngày mai.',
    type: 'INTERVIEW',
    priority: 'MEDIUM',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 giờ trước
    targetUrl: '/interviews',
    senderName: 'Bộ phận Tuyển dụng',
    metadata: {
      interviewId: 'int-2026-99',
      time: '09:30',
    },
  },
  {
    notificationId: 'notif-candidate-004',
    title: 'Hồ sơ ứng tuyển mới',
    content: 'Ứng viên Lê Thị Mai vừa nộp hồ sơ ứng tuyển vị trí Product Owner qua Website công ty.',
    type: 'CANDIDATE',
    priority: 'LOW',
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 ngày trước
    targetUrl: '/candidates',
    senderName: 'Cổng Tuyển Dụng',
    metadata: {
      candidateName: 'Lê Thị Mai',
      source: 'WEBSITE',
    },
  },
  {
    notificationId: 'notif-job-005',
    title: 'Tin tuyển dụng đã được phê duyệt',
    content: 'Tin tuyển dụng "Senior Cloud DevOps Engineer" đã được Trưởng phòng phê duyệt và đăng tải.',
    type: 'JOB_POSTING',
    priority: 'MEDIUM',
    isRead: true,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 ngày trước
    targetUrl: '/job-postings',
    senderName: 'Trưởng phòng Nhân sự',
    metadata: {
      postingId: 'jp-devops-001',
    },
  },
];

/**
 * Trích xuất danh sách thông báo từ localStorage hoặc inMemory fallback
 */
const getStoredNotifications = (): AppNotificationItem[] => {
  try {
    if (typeof localStorage !== 'undefined') {
      const storedJson = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      if (storedJson) {
        return JSON.parse(storedJson) as AppNotificationItem[];
      }
    }
  } catch {
    // Bỏ qua lỗi truy cập storage
  }

  if (inMemoryNotifications.length === 0) {
    inMemoryNotifications = [...DEFAULT_INITIAL_NOTIFICATIONS];
  }
  return inMemoryNotifications;
};

/**
 * Lưu danh sách thông báo vào bộ nhớ
 */
const persistNotifications = (notificationList: AppNotificationItem[]): void => {
  inMemoryNotifications = notificationList;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notificationList));
    }
  } catch {
    // Bỏ qua lỗi lưu storage
  }
};

/**
 * Service quản lý danh sách và trạng thái thông báo
 * Jira Subtask: TKNHTTDNB1-541 - Thiết kế chuông và danh sách thông báo
 */
export const notificationService = {
  /**
   * Lấy toàn bộ danh sách thông báo
   */
  async getNotificationList(): Promise<AppNotificationItem[]> {
    try {
      const apiResponse = await axiosClient.get<AppNotificationItem[]>('/notifications');
      return apiResponse.data;
    } catch {
      return getStoredNotifications();
    }
  },

  /**
   * Đếm số lượng thông báo chưa đọc
   */
  async getUnreadNotificationCount(): Promise<number> {
    try {
      const apiResponse = await axiosClient.get<{ unreadCount: number }>(
        '/notifications/unread-count'
      );
      return apiResponse.data.unreadCount;
    } catch {
      const stored = getStoredNotifications();
      return stored.filter((notificationItem) => !notificationItem.isRead).length;
    }
  },

  /**
   * Đánh dấu một thông báo là đã đọc (AC 3)
   */
  async markNotificationAsRead(notificationId: string): Promise<AppNotificationItem[]> {
    try {
      await axiosClient.put(`/notifications/${notificationId}/read`);
    } catch {
      // Fallback khi offline
    }

    const currentList = getStoredNotifications();
    const updatedList = currentList.map((notificationItem) => {
      if (notificationItem.notificationId === notificationId) {
        return {
          ...notificationItem,
          isRead: true,
        };
      }
      return notificationItem;
    });

    persistNotifications(updatedList);
    return updatedList;
  },

  /**
   * Đánh dấu tất cả thông báo là đã đọc (AC 3)
   */
  async markAllNotificationsAsRead(): Promise<AppNotificationItem[]> {
    try {
      await axiosClient.put('/notifications/mark-all-read');
    } catch {
      // Fallback khi offline
    }

    const currentList = getStoredNotifications();
    const updatedList = currentList.map((notificationItem) => ({
      ...notificationItem,
      isRead: true,
    }));

    persistNotifications(updatedList);
    return updatedList;
  },

  /**
   * Xóa một thông báo khỏi danh sách
   */
  async deleteNotification(notificationId: string): Promise<AppNotificationItem[]> {
    try {
      await axiosClient.delete(`/notifications/${notificationId}`);
    } catch {
      // Fallback khi offline
    }

    const currentList = getStoredNotifications();
    const updatedList = currentList.filter(
      (notificationItem) => notificationItem.notificationId !== notificationId
    );

    persistNotifications(updatedList);
    return updatedList;
  },

  /**
   * Thêm một thông báo mới vào đầu danh sách
   */
  async addNotification(
    newNotificationData: Omit<AppNotificationItem, 'notificationId' | 'createdAt'>
  ): Promise<AppNotificationItem> {
    const generatedNotification: AppNotificationItem = {
      ...newNotificationData,
      notificationId: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    try {
      const apiResponse = await axiosClient.post<AppNotificationItem>(
        '/notifications',
        generatedNotification
      );
      return apiResponse.data;
    } catch {
      const currentList = getStoredNotifications();
      const updatedList = [generatedNotification, ...currentList];
      persistNotifications(updatedList);
      return generatedNotification;
    }
  },

  /**
   * Đặt lại danh sách thông báo về mặc định (phục vụ viết test)
   */
  resetToDefaultNotifications(): AppNotificationItem[] {
    const clonedDefaults = JSON.parse(
      JSON.stringify(DEFAULT_INITIAL_NOTIFICATIONS)
    ) as AppNotificationItem[];
    persistNotifications(clonedDefaults);
    return clonedDefaults;
  },

  /**
   * Xóa sạch dữ liệu thông báo trong storage
   */
  clearAllNotifications(): void {
    inMemoryNotifications = [];
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY_NOTIFICATIONS);
      }
    } catch {
      // Bỏ qua lỗi dọn dẹp storage
    }
  },
};
