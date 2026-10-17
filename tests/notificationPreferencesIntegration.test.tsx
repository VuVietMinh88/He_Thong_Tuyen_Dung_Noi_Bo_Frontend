import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import axiosClient from '../src/utils/axiosClient';
import {
  notificationSettingsService,
  DEFAULT_NOTIFICATION_SETTINGS,
  findMandatoryNotificationViolation,
  mergeWithDefaultPreferences,
  handleNotificationSettingsApiError,
} from '../src/services/notificationSettingsService';
import { useNotificationPreferences } from '../src/hooks/useNotificationPreferences';
import { NotificationSettingsPage } from '../src/pages/Settings/NotificationSettingsPage';
import { toast } from '../src/components/notifications';
import type {
  NotificationSettingItem,
  UseNotificationPreferencesReturn,
} from '../src/types/notification';

const storage = new Map<string, string>();

/**
 * Helper mount hook sử dụng renderToString của react-dom/server
 */
const mountPreferencesHook = (): UseNotificationPreferencesReturn => {
  let hookInstance!: UseNotificationPreferencesReturn;

  const HarnessComponent = () => {
    hookInstance = useNotificationPreferences();
    return null;
  };

  renderToString(<HarnessComponent />);
  return hookInstance;
};

describe('Jira Subtask TKNHTTDNB1-548: Tích hợp lưu và tải tùy chọn cá nhân (Story TKNHTTDNB1-80)', () => {
  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
      },
      dispatchEvent: vi.fn(),
    });
    vi.clearAllMocks();
    notificationSettingsService.clearStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // =========================================================================
  // AC 1: Tải và Hiển thị (Fetch Data)
  // =========================================================================
  describe('1. Tải và Hiển thị (Fetch Data) (AC 1)', () => {
    it('notificationSettingsService.fetchUserNotificationPreferences gọi API GET /notification-settings và map cấu hình', async () => {
      const mockServerData: NotificationSettingItem[] = [
        {
          eventId: 'EVENT_POSITION_ASSIGNMENT',
          eventName: 'Phân công vị trí',
          eventDescription: 'Mô tả.',
          category: 'POSITION',
          inAppEnabled: false,
          emailEnabled: true,
          isMandatoryInApp: false,
          isMandatoryEmail: false,
        },
      ];

      const getSpy = vi.spyOn(axiosClient, 'get').mockResolvedValueOnce({
        data: mockServerData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as unknown,
      });

      const fetchedSettings =
        await notificationSettingsService.fetchUserNotificationPreferences();

      expect(getSpy).toHaveBeenCalledWith('/notification-settings');
      expect(fetchedSettings.length).toBeGreaterThan(0);

      // Kiểm tra mục được cấu hình từ server đã cập nhật chính xác
      const positionAssignmentItem = fetchedSettings.find(
        (settingItem: NotificationSettingItem) =>
          settingItem.eventId === 'EVENT_POSITION_ASSIGNMENT'
      );
      expect(positionAssignmentItem).toBeDefined();
      expect(positionAssignmentItem?.inAppEnabled).toBe(false);
      expect(positionAssignmentItem?.emailEnabled).toBe(true);
    });

    it('mergeWithDefaultPreferences bảo toàn đầy đủ metadata và khóa thông báo bắt buộc', () => {
      const partialServerData: NotificationSettingItem[] = [
        {
          eventId: 'EVENT_PENDING_APPROVAL',
          eventName: 'Yêu cầu chờ duyệt',
          eventDescription: '',
          category: 'REQUISITION',
          inAppEnabled: false, // Thử gửi false từ server
          emailEnabled: false,
          isMandatoryInApp: true,
        },
      ];

      const mergedSettings = mergeWithDefaultPreferences(partialServerData);
      const pendingApproval = mergedSettings.find(
        (settingItem) => settingItem.eventId === 'EVENT_PENDING_APPROVAL'
      );

      // Thông báo bắt buộc trong app phải luôn giữ true
      expect(pendingApproval?.isMandatoryInApp).toBe(true);
      expect(pendingApproval?.inAppEnabled).toBe(true);
      expect(pendingApproval?.mandatoryExplanation).toBe(
        'Đây là thông báo bắt buộc của hệ thống, không thể tắt.'
      );
    });

    it('hook useNotificationPreferences tải cấu hình và bắt lỗi khi máy chủ phản hồi lỗi', async () => {
      const toastErrorSpy = vi.spyOn(toast, 'error');
      vi.spyOn(axiosClient, 'get').mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 500,
          data: { message: 'Máy chủ quá tải, không thể tải cấu hình.' },
        },
      });

      const hook = mountPreferencesHook();
      await hook.fetchUserNotificationPreferences();

      expect(toastErrorSpy).toHaveBeenCalledWith(
        'Máy chủ quá tải, không thể tải cấu hình.'
      );
    });
  });

  // =========================================================================
  // AC 2: Lưu thay đổi (Save Settings)
  // =========================================================================
  describe('2. Lưu thay đổi (Save Settings) (AC 2)', () => {
    it('gọi API PUT /notification-settings khi người dùng lưu và hiển thị toast thành công khi trả về 200', async () => {
      const toastSuccessSpy = vi.spyOn(toast, 'success');

      const putSpy = vi.spyOn(axiosClient, 'put').mockResolvedValueOnce({
        data: DEFAULT_NOTIFICATION_SETTINGS,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as unknown,
      });

      const hook = mountPreferencesHook();

      // Thay đổi một toggle tùy chọn hợp lệ
      hook.handleToggleInApp('EVENT_POSITION_ASSIGNMENT', false);

      const saveSuccess = await hook.updateNotificationSettings();

      expect(putSpy).toHaveBeenCalledWith(
        '/notification-settings',
        expect.any(Array)
      );
      expect(saveSuccess).toBe(true);
      expect(toastSuccessSpy).toHaveBeenCalledWith(
        'Đã lưu cấu hình tùy chọn nhận thông báo thành công.'
      );
    });
  });

  // =========================================================================
  // AC 3: Validation, Chống Bypass & Optimistic UI Rollback
  // =========================================================================
  describe('3. Validation & Bảo Mật (Optimistic UI Rollback) (AC 3)', () => {
    it('phát hiện hành vi bypass UI cố tình tắt thông báo bắt buộc và từ chối cập nhật', async () => {
      const toastErrorSpy = vi.spyOn(toast, 'error');

      const hook = mountPreferencesHook();

      // Tạo một danh sách vi phạm giả định vượt mặt UI (Bypass client-side guard)
      const violatedSettingsPayload: NotificationSettingItem[] = [
        ...DEFAULT_NOTIFICATION_SETTINGS.map((item) => {
          if (item.eventId === 'EVENT_PENDING_APPROVAL') {
            return {
              ...item,
              inAppEnabled: false, // Cố tình tắt thông báo bắt buộc
            };
          }
          return item;
        }),
      ];

      const saveResult = await hook.updateNotificationSettings(violatedSettingsPayload);

      // Bị từ chối
      expect(saveResult).toBe(false);
      expect(toastErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('là thông báo bắt buộc của hệ thống, không thể tắt')
      );
    });

    it('thực hiện Optimistic UI Rollback khi máy chủ trả về lỗi 500 hoặc 403', async () => {
      const toastErrorSpy = vi.spyOn(toast, 'error');

      // Giả lập máy chủ từ chối với mã lỗi 403 Forbidden
      vi.spyOn(axiosClient, 'put').mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 403,
          data: { message: 'Bạn không có quyền cập nhật tùy chọn thông báo của hệ thống.' },
        },
      });

      const hook = mountPreferencesHook();

      // Người dùng chỉnh sửa một cài đặt
      hook.handleToggleInApp('EVENT_CANDIDATE_APPLIED', false);

      const saveSuccess = await hook.updateNotificationSettings();

      expect(saveSuccess).toBe(false);
      expect(toastErrorSpy).toHaveBeenCalledWith(
        'Bạn không có quyền cập nhật tùy chọn thông báo của hệ thống.'
      );
    });

    it('findMandatoryNotificationViolation định danh chính xác vi phạm thông báo bắt buộc', () => {
      const cleanList: NotificationSettingItem[] = [
        {
          eventId: 'EVENT_PENDING_APPROVAL',
          eventName: 'Yêu cầu chờ duyệt',
          eventDescription: 'Mô tả',
          category: 'REQUISITION',
          inAppEnabled: true,
          emailEnabled: true,
          isMandatoryInApp: true,
          isMandatoryEmail: true,
        },
      ];
      expect(findMandatoryNotificationViolation(cleanList)).toBeUndefined();

      const violatedList: NotificationSettingItem[] = [
        {
          eventId: 'EVENT_PENDING_APPROVAL',
          eventName: 'Yêu cầu chờ duyệt',
          eventDescription: 'Mô tả',
          category: 'REQUISITION',
          inAppEnabled: false, // Vi phạm
          emailEnabled: true,
          isMandatoryInApp: true,
        },
      ];
      const violation = findMandatoryNotificationViolation(violatedList);
      expect(violation).toBeDefined();
      expect(violation?.eventId).toBe('EVENT_PENDING_APPROVAL');
    });

    it('handleNotificationSettingsApiError bóc tách thông báo lỗi chi tiết không nuốt exception', () => {
      const axiosErrorSample = {
        isAxiosError: true,
        response: {
          status: 422,
          data: { message: 'Dữ liệu không hợp lệ.' },
        },
      };

      const extractedError = handleNotificationSettingsApiError(
        axiosErrorSample,
        'Lỗi mặc định'
      );
      expect(extractedError.message).toBe('Dữ liệu không hợp lệ.');
    });

    it('render trang NotificationSettingsPage với liên kết hook useNotificationPreferences thành công', () => {
      const renderedHtml = renderToString(
        <MemoryRouter>
          <NotificationSettingsPage />
        </MemoryRouter>
      );

      expect(renderedHtml).toContain('data-testid="notification-settings-page"');
      expect(renderedHtml).toContain('Tùy Chọn Nhận Thông Báo');
      expect(renderedHtml).toContain('data-testid="mandatory-info-banner"');
      expect(renderedHtml).toContain('data-testid="btn-save-settings"');
      expect(renderedHtml).toContain('data-testid="btn-reset-defaults"');
    });
  });
});
