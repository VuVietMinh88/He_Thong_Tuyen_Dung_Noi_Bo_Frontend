import React, { memo } from 'react';
import { Bell, Mail, ShieldAlert, Sparkles, Filter } from 'lucide-react';
import type {
  NotificationEventCategory,
  NotificationSettingsTableProps,
  NotificationSettingItem,
} from '../../types/notification';
import { ToggleSwitch } from './ToggleSwitch';

/**
 * Cấu hình hiển thị nhãn danh mục sự kiện thông báo
 */
const CATEGORY_DISPLAY_CONFIG: Record<
  NotificationEventCategory,
  { label: string; badgeClass: string }
> = {
  REQUISITION: {
    label: 'Yêu cầu & Tin tuyển dụng',
    badgeClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
  },
  POSITION: {
    label: 'Phân công nhân sự',
    badgeClass: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300',
  },
  INTERVIEW: {
    label: 'Lịch phỏng vấn',
    badgeClass: 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
  },
  OFFER: {
    label: 'Đề nghị tuyển dụng (Offer)',
    badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  },
  CANDIDATE: {
    label: 'Hồ sơ ứng viên',
    badgeClass: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
  },
  SLA_SYSTEM: {
    label: 'Hệ thống & Cảnh báo SLA',
    badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
  },
};

/**
 * Component Bảng tùy chọn nhận thông báo (Notification Settings Table)
 * Jira Subtask: TKNHTTDNB1-547 - Thiết kế trang tùy chọn nhận thông báo (Story TKNHTTDNB1-80)
 */
export const NotificationSettingsTable: React.FC<NotificationSettingsTableProps> = memo(
  ({
    settingsList,
    onToggleInApp,
    onToggleEmail,
    searchQuery = '',
    selectedCategory = 'ALL',
    className = '',
  }) => {
    // Lọc danh sách theo từ khóa tìm kiếm và tab danh mục đã chọn
    const filteredSettingsList = settingsList.filter((settingItem: NotificationSettingItem) => {
      const matchesSearch =
        searchQuery.trim().length === 0 ||
        settingItem.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        settingItem.eventDescription.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'ALL' || settingItem.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    return (
      <div
        data-testid="notification-settings-table-container"
        className={`overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900 ${className}`}
      >
        <div className="overflow-x-auto">
          <table
            data-testid="notification-settings-table"
            className="w-full border-collapse text-left text-sm"
          >
            {/* Tiêu đề các cột trong bảng (AC 1) */}
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80 text-xs font-bold text-gray-600 dark:border-gray-800 dark:bg-gray-850/60 dark:text-gray-300">
                <th scope="col" className="py-4 pl-6 pr-4 sm:w-7/12">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Sự Kiện Thông Báo</span>
                  </div>
                </th>
                <th scope="col" className="px-4 py-4 text-center sm:w-2.5/12">
                  <div className="flex items-center justify-center gap-1.5">
                    <Bell className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Trong ứng dụng</span>
                  </div>
                </th>
                <th scope="col" className="py-4 pl-4 pr-6 text-center sm:w-2.5/12">
                  <div className="flex items-center justify-center gap-1.5">
                    <Mail className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Qua Email</span>
                  </div>
                </th>
              </tr>
            </thead>

            {/* Nội dung danh sách các sự kiện thông báo (AC 1 & AC 2) */}
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/70">
              {filteredSettingsList.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    data-testid="empty-settings-state"
                    className="py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-800">
                        <Filter className="h-6 w-6" />
                      </div>
                      <p className="font-semibold text-gray-700 dark:text-gray-300">
                        Không tìm thấy sự kiện thông báo phù hợp
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        Vui lòng thử điều chỉnh lại từ khóa tìm kiếm hoặc chuyển sang danh mục khác.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSettingsList.map((settingItem: NotificationSettingItem) => {
                  const categoryInfo =
                    CATEGORY_DISPLAY_CONFIG[settingItem.category] ||
                    CATEGORY_DISPLAY_CONFIG.REQUISITION;

                  const isMandatoryInApp = Boolean(settingItem.isMandatoryInApp);
                  const isMandatoryEmail = Boolean(settingItem.isMandatoryEmail);

                  return (
                    <tr
                      key={settingItem.eventId}
                      data-testid={`setting-row-${settingItem.eventId}`}
                      className="group transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-850/40"
                    >
                      {/* Cột 1: Thông tin sự kiện thông báo */}
                      <td className="py-4 pl-6 pr-4 align-top">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${categoryInfo.badgeClass}`}
                          >
                            {categoryInfo.label}
                          </span>

                          {/* Huy hiệu ghi chú cho sự kiện bắt buộc */}
                          {(isMandatoryInApp || isMandatoryEmail) && (
                            <span
                              data-testid={`badge-mandatory-${settingItem.eventId}`}
                              className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-800"
                            >
                              <ShieldAlert className="h-3 w-3" />
                              <span>Bắt buộc</span>
                            </span>
                          )}
                        </div>

                        <h4
                          data-testid={`event-name-${settingItem.eventId}`}
                          className="text-sm font-bold text-gray-900 dark:text-white"
                        >
                          {settingItem.eventName}
                        </h4>

                        <p
                          data-testid={`event-description-${settingItem.eventId}`}
                          className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400 max-w-xl"
                        >
                          {settingItem.eventDescription}
                        </p>
                      </td>

                      {/* Cột 2: Công tắc Trong ứng dụng (In-app Toggle - AC 1 & AC 2) */}
                      <td className="px-4 py-4 align-middle text-center">
                        <div className="flex flex-col items-center justify-center">
                          <ToggleSwitch
                            id={`toggle-inapp-${settingItem.eventId}`}
                            testId={`toggle-inapp-${settingItem.eventId}`}
                            checked={settingItem.inAppEnabled}
                            disabled={isMandatoryInApp}
                            tooltipMessage={
                              settingItem.mandatoryExplanation ||
                              'Đây là thông báo bắt buộc của hệ thống, không thể tắt.'
                            }
                            ariaLabel={`Bật tắt thông báo trong ứng dụng cho ${settingItem.eventName}`}
                            onChange={(nextCheckedState: boolean) =>
                              onToggleInApp(settingItem.eventId, nextCheckedState)
                            }
                          />
                          <span className="mt-1 text-[11px] font-semibold text-gray-400">
                            {isMandatoryInApp
                              ? 'Cố định Bật'
                              : settingItem.inAppEnabled
                              ? 'Đang bật'
                              : 'Đã tắt'}
                          </span>
                        </div>
                      </td>

                      {/* Cột 3: Công tắc Qua Email (Email Toggle - AC 1 & AC 2) */}
                      <td className="py-4 pl-4 pr-6 align-middle text-center">
                        <div className="flex flex-col items-center justify-center">
                          <ToggleSwitch
                            id={`toggle-email-${settingItem.eventId}`}
                            testId={`toggle-email-${settingItem.eventId}`}
                            checked={settingItem.emailEnabled}
                            disabled={isMandatoryEmail}
                            tooltipMessage={
                              settingItem.mandatoryExplanation ||
                              'Đây là thông báo bắt buộc của hệ thống, không thể tắt.'
                            }
                            ariaLabel={`Bật tắt thông báo qua email cho ${settingItem.eventName}`}
                            onChange={(nextCheckedState: boolean) =>
                              onToggleEmail(settingItem.eventId, nextCheckedState)
                            }
                          />
                          <span className="mt-1 text-[11px] font-semibold text-gray-400">
                            {isMandatoryEmail
                              ? 'Cố định Bật'
                              : settingItem.emailEnabled
                              ? 'Đang bật'
                              : 'Đã tắt'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
);

NotificationSettingsTable.displayName = 'NotificationSettingsTable';

export default NotificationSettingsTable;
