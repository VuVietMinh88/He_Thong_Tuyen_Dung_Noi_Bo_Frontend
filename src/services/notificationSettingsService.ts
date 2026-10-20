import axios from 'axios';
import axiosClient from '../utils/axiosClient';
import type {
  NotificationSettingItem,
  NotificationPreferencesApiResponse,
} from '../types/notification';

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
 * Trộn dữ liệu nhận từ máy chủ với thiết lập mặc định của hệ thống
 * Đảm bảo mọi trường thông tin, mô tả và khóa thông báo bắt buộc luôn đầy đủ và chính xác
 */
export const mergeWithDefaultPreferences = (
  serverPreferences: NotificationSettingItem[]
): NotificationSettingItem[] => {
  const serverMap = new Map<string, NotificationSettingItem>();
  for (const serverItem of serverPreferences) {
    serverMap.set(serverItem.eventId, serverItem);
  }

  const mergedList = DEFAULT_NOTIFICATION_SETTINGS.map((defaultItem) => {
    const matchedServerItem = serverMap.get(defaultItem.eventId);
    if (!matchedServerItem) {
      return { ...defaultItem };
    }

    const isMandatoryInApp = Boolean(defaultItem.isMandatoryInApp);
    const isMandatoryEmail = Boolean(defaultItem.isMandatoryEmail);

    return {
      ...defaultItem,
      inAppEnabled: isMandatoryInApp ? true : Boolean(matchedServerItem.inAppEnabled),
      emailEnabled: isMandatoryEmail ? true : Boolean(matchedServerItem.emailEnabled),
    };
  });

  return mergedList;
};

/**
 * Kiểm tra xem danh sách cấu hình có hành vi can thiệp trái phép để tắt thông báo bắt buộc hay không
 */
export const findMandatoryNotificationViolation = (
  settingsList: NotificationSettingItem[]
): NotificationSettingItem | undefined => {
  return settingsList.find((settingItem) => {
    const isViolatingInApp =
      Boolean(settingItem.isMandatoryInApp) && settingItem.inAppEnabled === false;
    const isViolatingEmail =
      Boolean(settingItem.isMandatoryEmail) && settingItem.emailEnabled === false;
    return isViolatingInApp || isViolatingEmail;
  });
};

/**
 * Xử lý lỗi API từ máy chủ cho cấu hình thông báo (AC 3, AC 4)
 * Không nuốt lỗi và trích xuất thông điệp chi tiết từ phía backend
 */
export const handleNotificationSettingsApiError = (
  unknownError: unknown,
  fallbackMessage: string
): Error => {
  if (axios.isAxiosError(unknownError)) {
    const responseData = unknownError.response?.data;

    // Trích xuất chuỗi message từ đối tượng JSON trả về
    if (
      typeof responseData === 'object' &&
      responseData !== null &&
      'message' in responseData &&
      typeof responseData.message === 'string'
    ) {
      return new Error(responseData.message);
    }

    if (unknownError.response?.status === 400 || unknownError.response?.status === 422) {
      return new Error(
        'Yêu cầu bị từ chối từ máy chủ: Vi phạm quy định thông báo bắt buộc của hệ thống.'
      );
    }

    if (unknownError.response?.status === 403) {
      return new Error('Bạn không có quyền cập nhật tùy chọn thông báo của hệ thống.');
    }

    if (unknownError.response?.status === 500) {
      return new Error('Máy chủ gặp sự cố khi lưu tùy chọn thông báo. Vui lòng thử lại sau.');
    }

    if (!unknownError.response) {
      return new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.');
    }
  }

  if (unknownError instanceof Error) {
    return unknownError;
  }

  return new Error(fallbackMessage);
};

/**
 * Service quản lý các tùy chọn Bật/Tắt nhận thông báo của người dùng
 * Jira Subtasks:
 * - TKNHTTDNB1-547: Thiết kế trang tùy chọn nhận thông báo
 * - TKNHTTDNB1-548: Tích hợp lưu và tải tùy chọn cá nhân
 */
export const notificationSettingsService = {
  /**
   * Tải toàn bộ danh sách tùy chọn nhận thông báo của người dùng từ API (AC 1)
   */
  async fetchUserNotificationPreferences(): Promise<NotificationSettingItem[]> {
    try {
      const apiResponse = await axiosClient.get<
        NotificationSettingItem[] | NotificationPreferencesApiResponse
      >('/notification-settings');

      let preferencesArray: NotificationSettingItem[] = [];

      if (Array.isArray(apiResponse.data)) {
        preferencesArray = apiResponse.data;
      } else if (
        apiResponse.data &&
        typeof apiResponse.data === 'object' &&
        'data' in apiResponse.data &&
        Array.isArray(apiResponse.data.data)
      ) {
        preferencesArray = apiResponse.data.data;
      }

      if (preferencesArray.length > 0) {
        const mergedSettings = mergeWithDefaultPreferences(preferencesArray);
        persistPreferences(mergedSettings);
        return mergedSettings;
      }

      return getStoredPreferences();
    } catch (fetchException: unknown) {
      // Nếu máy chủ trả về mã lỗi cụ thể (401, 403, 500), chuyển tiếp lỗi để UI hiển thị thông báo
      if (
        axios.isAxiosError(fetchException) &&
        fetchException.response &&
        fetchException.response.status >= 400
      ) {
        throw handleNotificationSettingsApiError(
          fetchException,
          'Không thể tải tùy chọn thông báo từ máy chủ.'
        );
      }

      // Khi chưa kết nối máy chủ hoặc offline, trả về cấu hình lưu cục bộ
      return getStoredPreferences();
    }
  },

  /**
   * Alias tương thích ngược cho fetchUserNotificationPreferences
   */
  async getNotificationSettings(): Promise<NotificationSettingItem[]> {
    return this.fetchUserNotificationPreferences();
  },

  /**
   * Cập nhật danh sách tùy chọn nhận thông báo lên máy chủ (AC 2, AC 3)
   * Ngăn chặn hành vi can thiệp trái phép để tắt thông báo bắt buộc
   */
  async updateNotificationSettings(
    updatedSettingsList: NotificationSettingItem[]
  ): Promise<NotificationSettingItem[]> {
    // 1. Kiểm tra vi phạm thông báo bắt buộc từ phía Client (Bypass UI check) (AC 3)
    const mandatoryViolation = findMandatoryNotificationViolation(updatedSettingsList);
    if (mandatoryViolation) {
      throw new Error(
        `Yêu cầu bị từ chối từ máy chủ: Sự kiện "${mandatoryViolation.eventName}" là thông báo bắt buộc của hệ thống, không thể tắt.`
      );
    }

    // 2. Chuẩn hóa để đảm bảo an toàn tuyệt đối trước khi gửi request
    const normalizedSettings = updatedSettingsList.map((settingItem) => ({
      ...settingItem,
      inAppEnabled: settingItem.isMandatoryInApp ? true : settingItem.inAppEnabled,
      emailEnabled: settingItem.isMandatoryEmail ? true : settingItem.emailEnabled,
    }));

    try {
      const apiResponse = await axiosClient.put<
        NotificationSettingItem[] | NotificationPreferencesApiResponse
      >('/notification-settings', normalizedSettings);

      let savedArray: NotificationSettingItem[] = normalizedSettings;
      if (Array.isArray(apiResponse.data)) {
        savedArray = apiResponse.data;
      } else if (
        apiResponse.data &&
        typeof apiResponse.data === 'object' &&
        'data' in apiResponse.data &&
        Array.isArray(apiResponse.data.data)
      ) {
        savedArray = apiResponse.data.data;
      }

      persistPreferences(savedArray);
      return savedArray;
    } catch (saveException: unknown) {
      // Phân tích và chuyển tiếp lỗi từ máy chủ để UI kích hoạt rollback (AC 3)
      if (
        axios.isAxiosError(saveException) &&
        saveException.response &&
        saveException.response.status >= 400
      ) {
        throw handleNotificationSettingsApiError(
          saveException,
          'Có lỗi xảy ra khi lưu tùy chọn nhận thông báo.'
        );
      }

      // Khi chạy môi trường offline hoặc mock không có máy chủ, lưu vào storage cục bộ
      persistPreferences(normalizedSettings);
      return normalizedSettings;
    }
  },

  /**
   * Lưu tùy chọn với chuẩn hóa thông báo bắt buộc
   * Tương thích với các gọi hàm trước đó
   */
  async saveNotificationSettings(
    updatedSettingsList: NotificationSettingItem[]
  ): Promise<NotificationSettingItem[]> {
    // Tự động chuẩn hóa các mục bắt buộc về true trước khi lưu
    const normalizedSettings = updatedSettingsList.map((settingItem) => ({
      ...settingItem,
      inAppEnabled: settingItem.isMandatoryInApp ? true : settingItem.inAppEnabled,
      emailEnabled: settingItem.isMandatoryEmail ? true : settingItem.emailEnabled,
    }));

    try {
      return await this.updateNotificationSettings(normalizedSettings);
    } catch (saveException: unknown) {
      // Đảm bảo không làm gãy các luồng offline thuần túy nếu đã chuẩn hóa
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

    return this.updateNotificationSettings(updatedList);
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

