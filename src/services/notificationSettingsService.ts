import axiosClient from '../utils/axiosClient';
import type { NotificationSettingItem } from '../types/notification';

const STORAGE_KEY_NOTIFICATION_SETTINGS = 'smart_recruit_notification_preferences_storage';

/**
 * Danh sách cấu hình thông báo mặc định của hệ thống
 * Jira Subtask: TKNHTTDNB1-547 - Thiết kế trang tùy chọn nhận thông báo (Story TKNHTTDNB1-80)
 */
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettingItem[] = [
  {
    eventId: 'EVENT_PENDING_APPROVAL',
    eventName: 'Yêu cầu chờ duyệt',
    eventDescription:
      'Thông báo khi có phiếu yêu cầu tuyển dụng, đề xuất nhân sự hoặc đề nghị nhận việc (Offer) cần bạn xét duyệt.',
    category: 'REQUISITION',
    inAppEnabled: true,
    emailEnabled: true,
    isMandatoryInApp: true,
    isMandatoryEmail: true,
    mandatoryExplanation: 'Đây là thông báo bắt buộc của hệ thống, không thể tắt.',
  },
  {
    eventId: 'EVENT_POSITION_ASSIGNMENT',
    eventName: 'Phân công vị trí',
    eventDescription:
      'Thông báo khi bạn được chỉ định làm chuyên viên phụ trách hoặc người phỏng vấn cho vị trí tuyển dụng mới.',
    category: 'POSITION',
    inAppEnabled: true,
    emailEnabled: true,
    isMandatoryInApp: false,
    isMandatoryEmail: false,
  },
  {
    eventId: 'EVENT_INTERVIEW_INVITATION',
    eventName: 'Mời phỏng vấn',
    eventDescription:
      'Thông báo lịch phỏng vấn mới, cập nhật hội đồng hoặc dời giờ phỏng vấn với ứng viên.',
    category: 'INTERVIEW',
    inAppEnabled: true,
    emailEnabled: true,
    isMandatoryInApp: false,
    isMandatoryEmail: false,
  },
  {
    eventId: 'EVENT_OFFER_RESPONSE',
    eventName: 'Phản hồi offer',
    eventDescription:
      'Thông báo khi ứng viên đồng ý nhận việc, từ chối offer hoặc cấp trên yêu cầu chỉnh sửa điều kiện offer.',
    category: 'OFFER',
    inAppEnabled: true,
    emailEnabled: true,
    isMandatoryInApp: false,
    isMandatoryEmail: false,
  },
  {
    eventId: 'EVENT_CANDIDATE_APPLIED',
    eventName: 'Hồ sơ ứng tuyển mới',
    eventDescription:
      'Thông báo khi có ứng viên mới nộp hồ sơ vào các tin tuyển dụng thuộc bộ phận của bạn.',
    category: 'CANDIDATE',
    inAppEnabled: true,
    emailEnabled: false,
    isMandatoryInApp: false,
    isMandatoryEmail: false,
  },
  {
    eventId: 'EVENT_SLA_VIOLATION_ALERT',
    eventName: 'Cảnh báo vi phạm thời hạn SLA',
    eventDescription:
      'Cảnh báo khi hồ sơ ứng viên ở một vòng tuyển dụng vượt quá ngưỡng thời gian quy định cam kết dịch vụ.',
    category: 'SLA_SYSTEM',
    inAppEnabled: true,
    emailEnabled: true,
    isMandatoryInApp: true,
    isMandatoryEmail: false,
    mandatoryExplanation: 'Đây là thông báo bắt buộc của hệ thống, không thể tắt.',
  },
  {
    eventId: 'EVENT_JOB_POSTING_PUBLISHED',
    eventName: 'Tin tuyển dụng được duyệt & đăng tải',
    eventDescription:
      'Thông báo khi tin tuyển dụng bạn soạn thảo đã được thông qua và chính thức xuất bản trên website tuyển dụng.',
    category: 'REQUISITION',
    inAppEnabled: true,
    emailEnabled: false,
    isMandatoryInApp: false,
    isMandatoryEmail: false,
  },
];

let inMemoryPreferences: NotificationSettingItem[] = [];

/**
 * Lấy cấu hình từ localStorage hoặc fallback bộ nhớ đệm
 */
const getStoredPreferences = (): NotificationSettingItem[] => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedJson = window.localStorage.getItem(STORAGE_KEY_NOTIFICATION_SETTINGS);
      if (storedJson) {
        return JSON.parse(storedJson) as NotificationSettingItem[];
      }
    }
  } catch {
    // Không làm gián đoạn ứng dụng khi localStorage không khả dụng trong môi trường sandbox
  }

  if (inMemoryPreferences.length === 0) {
    inMemoryPreferences = JSON.parse(JSON.stringify(DEFAULT_NOTIFICATION_SETTINGS));
  }
  return inMemoryPreferences;
};

/**
 * Lưu danh sách cấu hình vào localStorage và bộ nhớ đệm
 */
const persistPreferences = (settingsList: NotificationSettingItem[]): void => {
  inMemoryPreferences = settingsList;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(
        STORAGE_KEY_NOTIFICATION_SETTINGS,
        JSON.stringify(settingsList)
      );
    }
  } catch {
    // Tránh lỗi môi trường lưu trữ hạn chế
  }
};

/**
 * Service quản lý các tùy chọn Bật/Tắt nhận thông báo của người dùng
 * Jira Subtask: TKNHTTDNB1-547
 */
export const notificationSettingsService = {
  /**
   * Tải toàn bộ danh sách tùy chọn nhận thông báo
   */
  async getNotificationSettings(): Promise<NotificationSettingItem[]> {
    try {
      const apiResponse = await axiosClient.get<NotificationSettingItem[]>(
        '/notification-settings'
      );
      if (Array.isArray(apiResponse.data) && apiResponse.data.length > 0) {
        persistPreferences(apiResponse.data);
        return apiResponse.data;
      }
      return getStoredPreferences();
    } catch {
      // Khi API chưa sẵn sàng hoặc offline, sử dụng dữ liệu cục bộ đã lưu trữ
      return getStoredPreferences();
    }
  },

  /**
   * Lưu toàn bộ danh sách tùy chọn nhận thông báo
   */
  async saveNotificationSettings(
    updatedSettingsList: NotificationSettingItem[]
  ): Promise<NotificationSettingItem[]> {
    // Đảm bảo các thông báo bắt buộc không bao giờ bị tắt trái quy định trước khi lưu
    const normalizedSettings = updatedSettingsList.map((settingItem) => {
      const isMandatoryInApp = Boolean(settingItem.isMandatoryInApp);
      const isMandatoryEmail = Boolean(settingItem.isMandatoryEmail);

      return {
        ...settingItem,
        inAppEnabled: isMandatoryInApp ? true : settingItem.inAppEnabled,
        emailEnabled: isMandatoryEmail ? true : settingItem.emailEnabled,
      };
    });

    try {
      const apiResponse = await axiosClient.put<NotificationSettingItem[]>(
        '/notification-settings',
        normalizedSettings
      );
      persistPreferences(apiResponse.data || normalizedSettings);
      return apiResponse.data || normalizedSettings;
    } catch {
      // Fallback lưu trữ cục bộ khi chưa kết nối máy chủ
      persistPreferences(normalizedSettings);
      return normalizedSettings;
    }
  },

  /**
   * Cập nhật một kênh thông báo đơn lẻ cho một sự kiện
   */
  async updateSingleSetting(
    eventId: string,
    channelType: 'inApp' | 'email',
    nextEnabledValue: boolean
  ): Promise<NotificationSettingItem[]> {
    const currentList = getStoredPreferences();
    const updatedList = currentList.map((settingItem) => {
      if (settingItem.eventId === eventId) {
        if (channelType === 'inApp') {
          // Bỏ qua thay đổi nếu là thông báo bắt buộc trong app
          if (settingItem.isMandatoryInApp) return settingItem;
          return { ...settingItem, inAppEnabled: nextEnabledValue };
        }
        if (channelType === 'email') {
          // Bỏ qua thay đổi nếu là thông báo bắt buộc qua email
          if (settingItem.isMandatoryEmail) return settingItem;
          return { ...settingItem, emailEnabled: nextEnabledValue };
        }
      }
      return settingItem;
    });

    return this.saveNotificationSettings(updatedList);
  },

  /**
   * Khôi phục tất cả cài đặt về trạng thái mặc định của hệ thống
   */
  async resetToDefaultSettings(): Promise<NotificationSettingItem[]> {
    const freshDefaults = JSON.parse(
      JSON.stringify(DEFAULT_NOTIFICATION_SETTINGS)
    ) as NotificationSettingItem[];
    persistPreferences(freshDefaults);
    return freshDefaults;
  },

  /**
   * Xóa sạch dữ liệu bộ nhớ đệm (phục vụ viết unit test)
   */
  clearStorage(): void {
    inMemoryPreferences = [];
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEY_NOTIFICATION_SETTINGS);
      }
    } catch {
      // Bỏ qua
    }
  },
};
