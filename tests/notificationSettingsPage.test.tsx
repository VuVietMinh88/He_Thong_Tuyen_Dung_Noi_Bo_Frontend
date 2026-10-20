import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ToggleSwitch } from '../src/components/notifications/ToggleSwitch';
import { NotificationSettingsTable } from '../src/components/notifications/NotificationSettingsTable';
import { NotificationSettingsPage } from '../src/pages/Settings/NotificationSettingsPage';
import {
  notificationSettingsService,
  DEFAULT_NOTIFICATION_SETTINGS,
} from '../src/services/notificationSettingsService';
import type { NotificationSettingItem } from '../src/types/notification';

const storage = new Map<string, string>();

describe('Jira Subtask TKNHTTDNB1-547: Thiết kế trang tùy chọn nhận thông báo (Story TKNHTTDNB1-80)', () => {
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
  });

  // Dữ liệu mẫu phục vụ kiểm thử
  const mockSettingsList: NotificationSettingItem[] = [
    {
      eventId: 'EVENT_PENDING_APPROVAL',
      eventName: 'Yêu cầu chờ duyệt',
      eventDescription: 'Thông báo khi có phiếu yêu cầu hoặc offer cần duyệt.',
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
      eventDescription: 'Thông báo khi bạn được giao phụ trách vị trí mới.',
      category: 'POSITION',
      inAppEnabled: true,
      emailEnabled: false,
      isMandatoryInApp: false,
      isMandatoryEmail: false,
    },
    {
      eventId: 'EVENT_INTERVIEW_INVITATION',
      eventName: 'Mời phỏng vấn',
      eventDescription: 'Thông báo lịch phỏng vấn mới với ứng viên.',
      category: 'INTERVIEW',
      inAppEnabled: false,
      emailEnabled: true,
      isMandatoryInApp: false,
      isMandatoryEmail: false,
    },
    {
      eventId: 'EVENT_OFFER_RESPONSE',
      eventName: 'Phản hồi offer',
      eventDescription: 'Thông báo phản hồi thư mời nhận việc từ ứng viên.',
      category: 'OFFER',
      inAppEnabled: true,
      emailEnabled: true,
      isMandatoryInApp: false,
      isMandatoryEmail: false,
    },
  ];

  // =========================================================================
  // AC 1: Bảng Tùy chọn (Notification Settings Table) & Toggle Switch
  // =========================================================================
  describe('1. Bảng Tùy Chọn Nhận Thông Báo (AC 1)', () => {
    it('render bảng cấu hình với đầy đủ tiêu đề cột: Trong ứng dụng và Qua Email', () => {
      const renderedHtml = renderToString(
        <NotificationSettingsTable
          settingsList={mockSettingsList}
          onToggleInApp={vi.fn()}
          onToggleEmail={vi.fn()}
        />
      );

      expect(renderedHtml).toContain('data-testid="notification-settings-table"');
      expect(renderedHtml).toContain('Sự Kiện Thông Báo');
      expect(renderedHtml).toContain('Trong ứng dụng');
      expect(renderedHtml).toContain('Qua Email');
    });

    it('hiển thị đầy đủ các loại sự kiện thông báo theo yêu cầu nghiệp vụ', () => {
      const renderedHtml = renderToString(
        <NotificationSettingsTable
          settingsList={mockSettingsList}
          onToggleInApp={vi.fn()}
          onToggleEmail={vi.fn()}
        />
      );

      // 4 sự kiện mẫu quan trọng theo đề bài
      expect(renderedHtml).toContain('Yêu cầu chờ duyệt');
      expect(renderedHtml).toContain('Phân công vị trí');
      expect(renderedHtml).toContain('Mời phỏng vấn');
      expect(renderedHtml).toContain('Phản hồi offer');
    });

    it('mỗi hàng có 2 công tắc (Toggle/Switch Component) cho Trong ứng dụng và Qua Email', () => {
      const renderedHtml = renderToString(
        <NotificationSettingsTable
          settingsList={mockSettingsList}
          onToggleInApp={vi.fn()}
          onToggleEmail={vi.fn()}
        />
      );

      // Hàng Yêu cầu chờ duyệt
      expect(renderedHtml).toContain('data-testid="toggle-inapp-EVENT_PENDING_APPROVAL"');
      expect(renderedHtml).toContain('data-testid="toggle-email-EVENT_PENDING_APPROVAL"');

      // Hàng Phân công vị trí
      expect(renderedHtml).toContain('data-testid="toggle-inapp-EVENT_POSITION_ASSIGNMENT"');
      expect(renderedHtml).toContain('data-testid="toggle-email-EVENT_POSITION_ASSIGNMENT"');

      // Hàng Mời phỏng vấn
      expect(renderedHtml).toContain('data-testid="toggle-inapp-EVENT_INTERVIEW_INVITATION"');
      expect(renderedHtml).toContain('data-testid="toggle-email-EVENT_INTERVIEW_INVITATION"');

      // Hàng Phản hồi offer
      expect(renderedHtml).toContain('data-testid="toggle-inapp-EVENT_OFFER_RESPONSE"');
      expect(renderedHtml).toContain('data-testid="toggle-email-EVENT_OFFER_RESPONSE"');
    });

    it('công tắc ToggleSwitch render đúng vai trò role="switch" và trạng thái aria-checked', () => {
      const activeSwitchHtml = renderToString(
        <ToggleSwitch checked={true} testId="toggle-test-on" />
      );
      expect(activeSwitchHtml).toContain('role="switch"');
      expect(activeSwitchHtml).toContain('aria-checked="true"');
      expect(activeSwitchHtml).toContain('translate-x-5');

      const inactiveSwitchHtml = renderToString(
        <ToggleSwitch checked={false} testId="toggle-test-off" />
      );
      expect(inactiveSwitchHtml).toContain('aria-checked="false"');
      expect(inactiveSwitchHtml).toContain('translate-x-0');
    });
  });

  // =========================================================================
  // AC 2: Xử lý Thông báo bắt buộc (Mandatory Notifications)
  // =========================================================================
  describe('2. Xử Lý Thông Báo Bắt Buộc Của Hệ Thống (AC 2)', () => {
    it('khóa cứng Toggle ở trạng thái Luôn Bật (Disabled + Toggled On) đối với "Yêu cầu chờ duyệt"', () => {
      const renderedHtml = renderToString(
        <NotificationSettingsTable
          settingsList={mockSettingsList}
          onToggleInApp={vi.fn()}
          onToggleEmail={vi.fn()}
        />
      );

      // In-app toggle cho Yêu cầu chờ duyệt
      expect(renderedHtml).toContain('data-testid="toggle-inapp-EVENT_PENDING_APPROVAL"');
      expect(renderedHtml).toContain('disabled=""');
      expect(renderedHtml).toContain('aria-disabled="true"');
      expect(renderedHtml).toContain('aria-checked="true"');

      // Email toggle cho Yêu cầu chờ duyệt cũng bị khóa
      expect(renderedHtml).toContain('data-testid="toggle-email-EVENT_PENDING_APPROVAL"');

      // Hiển thị nhãn Cố định Bật và huy hiệu Bắt buộc
      expect(renderedHtml).toContain('Cố định Bật');
      expect(renderedHtml).toContain('data-testid="badge-mandatory-EVENT_PENDING_APPROVAL"');
      expect(renderedHtml).toContain('Bắt buộc');
    });

    it('cung cấp Tooltip giải thích chính xác: "Đây là thông báo bắt buộc của hệ thống, không thể tắt."', () => {
      // ToggleSwitch có tooltipMessage mặc định chuẩn theo AC 2
      const disabledSwitchHtml = renderToString(
        <ToggleSwitch
          checked={true}
          disabled={true}
          tooltipMessage="Đây là thông báo bắt buộc của hệ thống, không thể tắt."
          testId="toggle-mandatory"
        />
      );

      expect(disabledSwitchHtml).toContain('disabled=""');
      expect(disabledSwitchHtml).toContain('cursor-not-allowed');
      // Đảm bảo thông điệp chính xác được cấu hình
      expect(disabledSwitchHtml).toContain('data-testid="toggle-mandatory"');
    });

    it('không khóa (enabled) đối với các thông báo tùy chọn thông thường', () => {
      const renderedHtml = renderToString(
        <NotificationSettingsTable
          settingsList={mockSettingsList}
          onToggleInApp={vi.fn()}
          onToggleEmail={vi.fn()}
        />
      );

      // Phân công vị trí không phải bắt buộc
      expect(renderedHtml).toContain('data-testid="toggle-inapp-EVENT_POSITION_ASSIGNMENT"');
      expect(renderedHtml).not.toContain('data-testid="badge-mandatory-EVENT_POSITION_ASSIGNMENT"');
    });
  });

  // =========================================================================
  // AC 3: Toàn bộ Trang Settings và Service Persistence
  // =========================================================================
  describe('3. Trang Tùy Chọn Hoàn Chỉnh và Service Persistence (AC 3)', () => {
    it('render trang NotificationSettingsPage với tiêu đề, banner thông tin bắt buộc và các nút thao tác', () => {
      const pageHtml = renderToString(
        <MemoryRouter>
          <NotificationSettingsPage />
        </MemoryRouter>
      );

      expect(pageHtml).toContain('data-testid="notification-settings-page"');
      expect(pageHtml).toContain('data-testid="page-title"');
      expect(pageHtml).toContain('Tùy Chọn Nhận Thông Báo');
      expect(pageHtml).toContain('data-testid="mandatory-info-banner"');
      expect(pageHtml).toContain('Quy định về thông báo bắt buộc của hệ thống');
      expect(pageHtml).toContain('data-testid="btn-save-settings"');
      expect(pageHtml).toContain('data-testid="btn-reset-defaults"');
      expect(pageHtml).toContain('data-testid="input-search-settings"');
    });

    it('notificationSettingsService tải danh sách cấu hình mặc định ban đầu đầy đủ', async () => {
      const settings = await notificationSettingsService.getNotificationSettings();
      expect(settings).toBeDefined();
      expect(settings.length).toBeGreaterThan(0);

      const pendingApprovalEvent = settings.find(
        (settingItem) => settingItem.eventId === 'EVENT_PENDING_APPROVAL'
      );
      expect(pendingApprovalEvent).toBeDefined();
      expect(pendingApprovalEvent?.isMandatoryInApp).toBe(true);
      expect(pendingApprovalEvent?.inAppEnabled).toBe(true);
      expect(pendingApprovalEvent?.mandatoryExplanation).toBe(
        'Đây là thông báo bắt buộc của hệ thống, không thể tắt.'
      );
    });

    it('notificationSettingsService bảo vệ thông báo bắt buộc luôn ở trạng thái Bật khi lưu', async () => {
      const modifiedSettings: NotificationSettingItem[] = [
        {
          eventId: 'EVENT_PENDING_APPROVAL',
          eventName: 'Yêu cầu chờ duyệt',
          eventDescription: 'Mô tả.',
          category: 'REQUISITION',
          inAppEnabled: false, // Cố tình tắt
          emailEnabled: false, // Cố tình tắt
          isMandatoryInApp: true,
          isMandatoryEmail: true,
        },
      ];

      const savedResult = await notificationSettingsService.saveNotificationSettings(
        modifiedSettings
      );
      const savedPendingItem = savedResult.find(
        (settingItem) => settingItem.eventId === 'EVENT_PENDING_APPROVAL'
      );

      // Bắt buộc phải tự động chuẩn hóa về true
      expect(savedPendingItem?.inAppEnabled).toBe(true);
      expect(savedPendingItem?.emailEnabled).toBe(true);
    });

    it('notificationSettingsService.resetToDefaultSettings khôi phục chính xác về DEFAULT_NOTIFICATION_SETTINGS', async () => {
      const defaults = await notificationSettingsService.resetToDefaultSettings();
      expect(defaults.length).toBe(DEFAULT_NOTIFICATION_SETTINGS.length);
      expect(defaults[0].eventId).toBe(DEFAULT_NOTIFICATION_SETTINGS[0].eventId);
    });
  });
});
