import React, { useState } from 'react';
import {
  Bell,
  Save,
  RotateCcw,
  Search,
  ShieldCheck,
  Info,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import type { NotificationEventCategory } from '../../types/notification';
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences';
import { NotificationSettingsTable } from '../../components/notifications/NotificationSettingsTable';

const CATEGORY_TABS: Array<{ id: NotificationEventCategory | 'ALL'; label: string }> = [
  { id: 'ALL', label: 'Tất cả sự kiện' },
  { id: 'REQUISITION', label: 'Yêu cầu & Tin tuyển dụng' },
  { id: 'OFFER', label: 'Thư offer' },
  { id: 'INTERVIEW', label: 'Phỏng vấn' },
  { id: 'CANDIDATE', label: 'Ứng viên' },
  { id: 'SLA_SYSTEM', label: 'Cảnh báo SLA' },
];

/**
 * Trang Tùy chọn nhận thông báo (Notification Settings Page)
 * Jira Subtasks:
 * - TKNHTTDNB1-547: Thiết kế trang tùy chọn nhận thông báo
 * - TKNHTTDNB1-548: Tích hợp lưu và tải tùy chọn cá nhân
 */
export const NotificationSettingsPage: React.FC = () => {
  const {
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
  } = useNotificationPreferences();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<NotificationEventCategory | 'ALL'>('ALL');

  // Xử lý lưu cấu hình
  const handleSaveSettings = async () => {
    await updateNotificationSettings();
  };

  return (
    <div
      data-testid="notification-settings-page"
      className="min-h-screen bg-gray-50/50 p-6 dark:bg-gray-950 sm:p-8"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        {/* 1. Header Trang & Nút thao tác chính */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h1
                  data-testid="page-title"
                  className="text-2xl font-black tracking-tight text-gray-900 dark:text-white"
                >
                  Tùy Chọn Nhận Thông Báo
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Cấu hình Bật/Tắt kênh thông báo Trong ứng dụng và Qua Email cho từng sự kiện tuyển dụng
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center">
            {/* Nút Khôi phục mặc định */}
            <button
              type="button"
              data-testid="btn-reset-defaults"
              disabled={isSavingPreferences || isLoadingPreferences}
              onClick={resetToDefaultPreferences}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 shadow-2xs transition-all hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Khôi phục mặc định</span>
            </button>

            {/* Nút Lưu thay đổi */}
            <button
              type="button"
              data-testid="btn-save-settings"
              disabled={isSavingPreferences || isLoadingPreferences || !hasUnsavedChanges}
              onClick={handleSaveSettings}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md transition-all cursor-pointer ${
                hasUnsavedChanges
                  ? 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/25 active:scale-95'
                  : 'bg-gray-300 dark:bg-gray-700 opacity-60 cursor-not-allowed'
              }`}
            >
              <Save className="h-4 w-4" />
              <span>{isSavingPreferences ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
            </button>
          </div>
        </div>

        {/* 2. Banner Thông tin & Giải thích Thông báo bắt buộc (AC 2) */}
        <div
          data-testid="mandatory-info-banner"
          className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/90 via-amber-50/50 to-white p-4.5 text-xs text-amber-950 dark:border-amber-900/60 dark:from-amber-950/30 dark:via-gray-900 dark:to-gray-900 dark:text-amber-200 shadow-2xs"
        >
          <div className="flex items-start gap-3.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-extrabold text-amber-900 dark:text-amber-100">
                Quy định về thông báo bắt buộc của hệ thống
              </h3>
              <p className="leading-relaxed text-amber-800/90 dark:text-amber-300/80">
                Để đảm bảo tuân thủ quy trình xét duyệt nội bộ và không gián đoạn hoạt động tuyển dụng, một số sự kiện quan trọng (như{' '}
                <strong className="font-extrabold text-amber-950 dark:text-amber-100">"Yêu cầu chờ duyệt"</strong> hay{' '}
                <strong className="font-extrabold text-amber-950 dark:text-amber-100">"Cảnh báo vi phạm SLA"</strong>) sẽ bị khóa cứng ở trạng thái{' '}
                <strong className="font-bold underline decoration-amber-400">Luôn Bật</strong> và không thể tắt.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Cảnh báo lỗi / Vi phạm bảo mật khi cố tình tắt thông báo bắt buộc (AC 3) */}
        {securityViolationMessage && (
          <div
            data-testid="security-violation-alert"
            className="flex items-start gap-3 rounded-2xl border border-rose-300 bg-rose-50/90 p-4 text-xs text-rose-950 shadow-2xs dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200 animate-fadeIn"
          >
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-black text-rose-900 dark:text-rose-100">
                Cảnh báo bảo mật hệ thống: Yêu cầu bị từ chối
              </h4>
              <p className="leading-relaxed">{securityViolationMessage}</p>
              <p className="text-[11px] text-rose-700 dark:text-rose-300">
                Hệ thống đã tự động hoàn nguyên cấu hình giao diện về trạng thái hợp lệ gần nhất.
              </p>
            </div>
          </div>
        )}

        {preferencesError && !securityViolationMessage && (
          <div
            data-testid="preferences-error-alert"
            className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-900 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>{preferencesError}</span>
            </div>
            <button
              type="button"
              data-testid="btn-retry-fetch"
              onClick={() => fetchUserNotificationPreferences()}
              className="font-bold underline hover:text-red-800 cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* 4. Thanh tìm kiếm và bộ lọc danh mục */}
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
          {/* Ô tìm kiếm sự kiện */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              data-testid="input-search-settings"
              value={searchQuery}
              onChange={(changeEvent) => setSearchQuery(changeEvent.target.value)}
              placeholder="Tìm kiếm sự kiện thông báo theo từ khóa..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50/80 py-2 pl-9 pr-4 text-xs text-gray-900 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Nút hành động nhanh */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="btn-enable-all"
              onClick={enableAllPreferences}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 cursor-pointer"
            >
              Bật tất cả
            </button>
            <button
              type="button"
              data-testid="btn-disable-optional"
              onClick={disableOptionalPreferences}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 cursor-pointer"
            >
              Chỉ giữ bắt buộc
            </button>
          </div>
        </div>

        {/* 5. Tab lọc theo danh mục sự kiện */}
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORY_TABS.map((categoryTab) => {
            const isTabActive = selectedCategory === categoryTab.id;
            return (
              <button
                key={categoryTab.id}
                type="button"
                data-testid={`tab-category-${categoryTab.id}`}
                onClick={() => setSelectedCategory(categoryTab.id)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  isTabActive
                    ? 'bg-indigo-600 text-white shadow-sm dark:bg-indigo-500'
                    : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                {categoryTab.label}
              </button>
            );
          })}
        </div>

        {/* 6. Bảng cấu hình tùy chọn thông báo (AC 1 & AC 2) */}
        {isLoadingPreferences ? (
          <div
            data-testid="loading-state"
            className="flex h-64 items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
              <p className="text-xs font-medium text-gray-500">Đang tải tùy chọn thông báo...</p>
            </div>
          </div>
        ) : (
          <NotificationSettingsTable
            settingsList={preferencesList}
            onToggleInApp={handleToggleInApp}
            onToggleEmail={handleToggleEmail}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
          />
        )}

        {/* 7. Footer chỉ dẫn */}
        <div className="flex items-center justify-between rounded-xl border border-gray-200/60 bg-white/60 p-3 text-[11px] text-gray-500 dark:border-gray-800/60 dark:bg-gray-900/40 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-gray-400" />
            <span>
              Mọi thay đổi sẽ có hiệu lực ngay sau khi bạn nhấn nút <strong>"Lưu thay đổi"</strong>.
            </span>
          </div>
          {hasUnsavedChanges && (
            <span
              data-testid="unsaved-badge"
              className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1"
            >
              ● Có thay đổi chưa lưu
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationSettingsPage;

