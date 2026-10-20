import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  NotificationSettingItem,
  UseNotificationPreferencesReturn,
} from '../types/notification';
import {
  notificationSettingsService,
  findMandatoryNotificationViolation,
} from '../services/notificationSettingsService';
import { toast } from '../components/notifications';

/**
 * Custom Hook tích hợp quản lý, tải và lưu cấu hình tùy chọn nhận thông báo
 * Jira Subtask: TKNHTTDNB1-548 - Tích hợp lưu và tải tùy chọn cá nhân (Story TKNHTTDNB1-80)
 *
 * Chức năng chính:
 * 1. Tải và hiển thị cấu hình hiện hành từ API (AC 1)
 * 2. Lưu cấu hình lên máy chủ kèm thông báo Toast 200 thành công (AC 2)
 * 3. Bắt lỗi chặt chẽ, từ chối việc tắt thông báo bắt buộc và rollback trạng thái giao diện (Optimistic UI Rollback) (AC 3)
 * 4. Tuân thủ Coding Convention K3S4_N3 (AC 4)
 */
export const useNotificationPreferences = (): UseNotificationPreferencesReturn => {
  const [preferencesList, setPreferencesList] = useState<NotificationSettingItem[]>([]);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState<boolean>(true);
  const [isSavingPreferences, setIsSavingPreferences] = useState<boolean>(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const [securityViolationMessage, setSecurityViolationMessage] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Snapshot lưu lại trạng thái hợp lệ gần nhất từ máy chủ để thực hiện Optimistic Rollback khi có lỗi (AC 3)
  const lastSavedPreferencesReference = useRef<NotificationSettingItem[]>([]);

  /**
   * Tải tùy chọn thông báo của người dùng từ API máy chủ (AC 1)
   */
  const fetchUserNotificationPreferences = useCallback(async (): Promise<
    NotificationSettingItem[]
  > => {
    setIsLoadingPreferences(true);
    setPreferencesError(null);
    setSecurityViolationMessage(null);

    try {
      const fetchedSettings =
        await notificationSettingsService.fetchUserNotificationPreferences();
      setPreferencesList(fetchedSettings);
      lastSavedPreferencesReference.current = JSON.parse(JSON.stringify(fetchedSettings));
      setHasUnsavedChanges(false);
      return fetchedSettings;
    } catch (fetchException: unknown) {
      const errorMessage =
        fetchException instanceof Error
          ? fetchException.message
          : 'Không thể tải tùy chọn thông báo từ máy chủ. Vui lòng thử lại sau.';

      setPreferencesError(errorMessage);
      toast.error(errorMessage);
      return lastSavedPreferencesReference.current;
    } finally {
      setIsLoadingPreferences(false);
    }
  }, []);

  // Tự động tải cấu hình khi hook khởi tạo lần đầu
  useEffect(() => {
    fetchUserNotificationPreferences();
  }, [fetchUserNotificationPreferences]);

  /**
   * Thay đổi trạng thái kênh Trong ứng dụng (In-app)
   * Chặn ngay nếu là thông báo bắt buộc (AC 3)
   */
  const handleToggleInApp = useCallback(
    (eventId: string, nextEnabledValue: boolean) => {
      setPreferencesError(null);
      setSecurityViolationMessage(null);

      setPreferencesList((previousList: NotificationSettingItem[]) =>
        previousList.map((settingItem: NotificationSettingItem) => {
          if (settingItem.eventId === eventId) {
            // Ngăn chặn tắt thông báo bắt buộc trong ứng dụng
            if (settingItem.isMandatoryInApp && nextEnabledValue === false) {
              const warningText =
                settingItem.mandatoryExplanation ||
                'Đây là thông báo bắt buộc của hệ thống, không thể tắt.';
              setSecurityViolationMessage(warningText);
              toast.warning(warningText);
              return settingItem;
            }
            return { ...settingItem, inAppEnabled: nextEnabledValue };
          }
          return settingItem;
        })
      );
      setHasUnsavedChanges(true);
    },
    []
  );

  /**
   * Thay đổi trạng thái kênh Qua Email
   * Chặn ngay nếu là thông báo bắt buộc qua email (AC 3)
   */
  const handleToggleEmail = useCallback(
    (eventId: string, nextEnabledValue: boolean) => {
      setPreferencesError(null);
      setSecurityViolationMessage(null);

      setPreferencesList((previousList: NotificationSettingItem[]) =>
        previousList.map((settingItem: NotificationSettingItem) => {
          if (settingItem.eventId === eventId) {
            // Ngăn chặn tắt thông báo bắt buộc qua Email
            if (settingItem.isMandatoryEmail && nextEnabledValue === false) {
              const warningText =
                settingItem.mandatoryExplanation ||
                'Đây là thông báo bắt buộc của hệ thống, không thể tắt.';
              setSecurityViolationMessage(warningText);
              toast.warning(warningText);
              return settingItem;
            }
            return { ...settingItem, emailEnabled: nextEnabledValue };
          }
          return settingItem;
        })
      );
      setHasUnsavedChanges(true);
    },
    []
  );

  /**
   * Khôi phục lại trạng thái giao diện theo snapshot hợp lệ gần nhất (Optimistic UI Rollback) (AC 3)
   */
  const rollbackPreferences = useCallback(() => {
    const backupSnapshot = JSON.parse(
      JSON.stringify(lastSavedPreferencesReference.current)
    ) as NotificationSettingItem[];
    setPreferencesList(backupSnapshot);
    setHasUnsavedChanges(false);
  }, []);

  /**
   * Lưu cấu hình tùy chọn nhận thông báo lên máy chủ (AC 2, AC 3)
   * Tự động rollback nếu phía Client bypass hoặc máy chủ từ chối yêu cầu
   */
  const updateNotificationSettings = useCallback(
    async (customSettingsList?: NotificationSettingItem[]): Promise<boolean> => {
      const targetSettingsToSave = customSettingsList || preferencesList;
      setIsSavingPreferences(true);
      setPreferencesError(null);
      setSecurityViolationMessage(null);

      // 1. Kiểm tra phát hiện hành vi bypass UI để tắt thông báo bắt buộc (AC 3)
      const detectedViolation = findMandatoryNotificationViolation(targetSettingsToSave);
      if (detectedViolation) {
        const rejectionNotice = `Yêu cầu bị từ chối từ máy chủ: Sự kiện "${detectedViolation.eventName}" là thông báo bắt buộc của hệ thống, không thể tắt.`;

        // Kích hoạt Optimistic UI Rollback ngay lập tức để hoàn nguyên giao diện
        rollbackPreferences();
        setSecurityViolationMessage(rejectionNotice);
        setPreferencesError(rejectionNotice);
        toast.error(rejectionNotice);
        setIsSavingPreferences(false);
        return false;
      }

      // 2. Gửi request cập nhật tới máy chủ API
      try {
        const savedSettingsResult =
          await notificationSettingsService.updateNotificationSettings(targetSettingsToSave);

        // Cập nhật state thành công và lưu lại snapshot mới
        setPreferencesList(savedSettingsResult);
        lastSavedPreferencesReference.current = JSON.parse(
          JSON.stringify(savedSettingsResult)
        );
        setHasUnsavedChanges(false);
        toast.success('Đã lưu cấu hình tùy chọn nhận thông báo thành công.');
        return true;
      } catch (saveException: unknown) {
        // 3. Xử lý lỗi chặt chẽ & Optimistic UI Rollback khi máy chủ trả về lỗi (AC 3)
        rollbackPreferences();

        const notificationUpdateError =
          saveException instanceof Error
            ? saveException.message
            : 'Có lỗi xảy ra khi lưu cấu hình tùy chọn nhận thông báo. Vui lòng thử lại sau.';

        setPreferencesError(notificationUpdateError);
        toast.error(notificationUpdateError);
        return false;
      } finally {
        setIsSavingPreferences(false);
      }
    },
    [preferencesList, rollbackPreferences]
  );

  /**
   * Bật tất cả các kênh thông báo cho toàn bộ sự kiện
   */
  const enableAllPreferences = useCallback(() => {
    setPreferencesError(null);
    setSecurityViolationMessage(null);

    setPreferencesList((previousList: NotificationSettingItem[]) =>
      previousList.map((settingItem: NotificationSettingItem) => ({
        ...settingItem,
        inAppEnabled: true,
        emailEnabled: true,
      }))
    );
    setHasUnsavedChanges(true);
    toast.info('Đã bật tất cả kênh thông báo cho các sự kiện.');
  }, []);

  /**
   * Tắt tất cả các thông báo không bắt buộc
   */
  const disableOptionalPreferences = useCallback(() => {
    setPreferencesError(null);
    setSecurityViolationMessage(null);

    setPreferencesList((previousList: NotificationSettingItem[]) =>
      previousList.map((settingItem: NotificationSettingItem) => ({
        ...settingItem,
        inAppEnabled: settingItem.isMandatoryInApp ? true : false,
        emailEnabled: settingItem.isMandatoryEmail ? true : false,
      }))
    );
    setHasUnsavedChanges(true);
    toast.info('Đã tắt các thông báo không bắt buộc.');
  }, []);

  /**
   * Khôi phục toàn bộ cài đặt về trạng thái mặc định của hệ thống
   */
  const resetToDefaultPreferences = useCallback(async (): Promise<void> => {
    setIsSavingPreferences(true);
    setPreferencesError(null);
    setSecurityViolationMessage(null);

    try {
      const defaultSettings = await notificationSettingsService.resetToDefaultSettings();
      setPreferencesList(defaultSettings);
      lastSavedPreferencesReference.current = JSON.parse(JSON.stringify(defaultSettings));
      setHasUnsavedChanges(false);
      toast.info('Đã khôi phục cấu hình thông báo về trạng thái mặc định của hệ thống.');
    } catch (resetException: unknown) {
      const resetErrorMessage =
        resetException instanceof Error
          ? resetException.message
          : 'Không thể khôi phục cài đặt mặc định.';
      setPreferencesError(resetErrorMessage);
      toast.error(resetErrorMessage);
    } finally {
      setIsSavingPreferences(false);
    }
  }, []);

  /**
   * Xóa thông báo lỗi hiện hành
   */
  const clearPreferencesError = useCallback(() => {
    setPreferencesError(null);
    setSecurityViolationMessage(null);
  }, []);

  return {
    preferencesList,
    isLoadingPreferences,
    isSavingPreferences,
    preferencesError,
    securityViolationMessage,
    hasUnsavedChanges,
    fetchUserNotificationPreferences,
    updateNotificationSettings,
    handleToggleInApp,
    handleToggleEmail,
    enableAllPreferences,
    disableOptionalPreferences,
    resetToDefaultPreferences,
    rollbackPreferences,
    clearPreferencesError,
  };
};
