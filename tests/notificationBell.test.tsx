import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { NotificationBell } from '../src/components/notifications/NotificationBell';
import { NotificationDropdown } from '../src/components/notifications/NotificationDropdown';
import { Header } from '../src/components/layout/Header';
import { notificationService } from '../src/services/notificationService';
import type { AppNotificationItem } from '../src/types/notification';

describe('Jira Task TKNHTTDNB1-541: Thiết kế chuông và danh sách thông báo (Story TKNHTTDNB1-79)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    notificationService.clearAllNotifications();
  });

  const mockNotifications: AppNotificationItem[] = [
    {
      notificationId: 'notif-001',
      title: 'Đề nghị tuyển dụng chờ duyệt',
      content: 'Offer OFF-2026-8899 cho ứng viên Trần Minh Đức đang chờ bạn xét duyệt.',
      type: 'OFFER',
      priority: 'HIGH',
      isRead: false,
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      targetUrl: '/offers/OFF-2026-8899/approval',
      senderName: 'Nguyễn Phương Anh',
    },
    {
      notificationId: 'notif-002',
      title: 'Cảnh báo vi phạm thời hạn SLA',
      content: 'Hồ sơ ứng viên Nguyễn Văn An đã ở vòng Sơ loại quá 3 ngày.',
      type: 'SLA_WARNING',
      priority: 'URGENT',
      isRead: false,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      targetUrl: '/candidates',
      senderName: 'Hệ thống Quản lý SLA',
    },
    {
      notificationId: 'notif-003',
      title: 'Lịch phỏng vấn chuyên môn mới',
      content: 'Bạn có một buổi phỏng vấn kỹ thuật vào 09:30 ngày mai.',
      type: 'INTERVIEW',
      priority: 'MEDIUM',
      isRead: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      targetUrl: '/interviews',
      senderName: 'Bộ phận Tuyển dụng',
    },
  ];

  // =========================================================================
  // AC 1: Chuông thông báo (Bell Icon & Badge)
  // =========================================================================
  describe('1. Chuông thông báo (Bell Icon & Badge) trên thanh điều hướng (AC 1)', () => {
    it('render nút chuông thông báo với icon Bell và test ID', () => {
      const renderedHtml = renderToString(
        <MemoryRouter>
          <NotificationBell initialNotifications={mockNotifications} />
        </MemoryRouter>
      );

      expect(renderedHtml).toContain('data-testid="notification-bell-container"');
      expect(renderedHtml).toContain('data-testid="btn-notification-bell"');
    });

    it('hiển thị Badge chính xác số lượng thông báo chưa đọc khi số lượng > 0', () => {
      // 2 thông báo chưa đọc trong mockNotifications (notif-001 và notif-002)
      const renderedHtml = renderToString(
        <MemoryRouter>
          <NotificationBell initialNotifications={mockNotifications} />
        </MemoryRouter>
      );

      expect(renderedHtml).toContain('data-testid="badge-notification-count"');
      expect(renderedHtml).toContain('2');
    });

    it('ẩn Badge khi không có thông báo chưa đọc nào (unread count = 0)', () => {
      const allReadNotifications: AppNotificationItem[] = mockNotifications.map(
        (notificationItem) => ({ ...notificationItem, isRead: true })
      );

      const renderedHtml = renderToString(
        <MemoryRouter>
          <NotificationBell initialNotifications={allReadNotifications} />
        </MemoryRouter>
      );

      expect(renderedHtml).not.toContain('data-testid="badge-notification-count"');
    });

    it('hiển thị 99+ khi số lượng thông báo chưa đọc vượt quá 99', () => {
      const manyUnreadNotifications: AppNotificationItem[] = Array.from(
        { length: 105 },
        (_, index) => ({
          notificationId: `notif-bulk-${index}`,
          title: `Thông báo ${index}`,
          content: `Nội dung ${index}`,
          type: 'SYSTEM',
          isRead: false,
          createdAt: new Date().toISOString(),
        })
      );

      const renderedHtml = renderToString(
        <MemoryRouter>
          <NotificationBell initialNotifications={manyUnreadNotifications} />
        </MemoryRouter>
      );

      expect(renderedHtml).toContain('data-testid="badge-notification-count"');
      expect(renderedHtml).toContain('99+');
    });

    it('chuông thông báo được tích hợp trên Header/Topbar của ứng dụng', () => {
      const headerHtml = renderToString(
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      );

      expect(headerHtml).toContain('data-testid="app-header-topbar"');
      expect(headerHtml).toContain('data-testid="notification-bell-container"');
      expect(headerHtml).toContain('data-testid="btn-notification-bell"');
    });
  });

  // =========================================================================
  // AC 2: Danh sách thông báo (Notification Dropdown)
  // =========================================================================
  describe('2. Danh sách thông báo dạng Dropdown (AC 2)', () => {
    it('render dropdown khi isOpen = true với tiêu đề và danh sách các thông báo', () => {
      const dropdownHtml = renderToString(
        <NotificationDropdown
          isOpen={true}
          notificationList={mockNotifications}
          unreadNotificationCount={2}
          activeFilterTab="ALL"
          onFilterTabChange={vi.fn()}
          onMarkAsRead={vi.fn()}
          onMarkAllAsRead={vi.fn()}
          onNotificationClick={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(dropdownHtml).toContain('data-testid="notification-dropdown-container"');
      expect(dropdownHtml).toContain('data-testid="dropdown-header-title"');
      expect(dropdownHtml).toContain('Thông Báo');
      expect(dropdownHtml).toContain('data-testid="notification-dropdown-list"');
      expect(dropdownHtml).toContain('data-testid="notification-item-notif-001"');
      expect(dropdownHtml).toContain('data-testid="notification-item-notif-002"');
      expect(dropdownHtml).toContain('data-testid="notification-item-notif-003"');
    });

    it('ẩn dropdown khi isOpen = false', () => {
      const dropdownHtml = renderToString(
        <NotificationDropdown
          isOpen={false}
          notificationList={mockNotifications}
          unreadNotificationCount={2}
          activeFilterTab="ALL"
          onFilterTabChange={vi.fn()}
          onMarkAsRead={vi.fn()}
          onMarkAllAsRead={vi.fn()}
          onNotificationClick={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(dropdownHtml).toBe('');
    });

    it('mỗi item hiển thị đầy đủ icon, nội dung thông báo, và thời gian tương đối', () => {
      const dropdownHtml = renderToString(
        <NotificationDropdown
          isOpen={true}
          notificationList={mockNotifications}
          unreadNotificationCount={2}
          activeFilterTab="ALL"
          onFilterTabChange={vi.fn()}
          onMarkAsRead={vi.fn()}
          onMarkAllAsRead={vi.fn()}
          onNotificationClick={vi.fn()}
          onClose={vi.fn()}
        />
      );

      // Node OFFER
      expect(dropdownHtml).toContain('Đề nghị tuyển dụng');
      expect(dropdownHtml).toContain('Đề nghị tuyển dụng chờ duyệt');
      expect(dropdownHtml).toContain(
        'Offer OFF-2026-8899 cho ứng viên Trần Minh Đức đang chờ bạn xét duyệt.'
      );
      expect(dropdownHtml).toContain('phút trước');

      // Node SLA_WARNING
      expect(dropdownHtml).toContain('Cảnh báo SLA');
      expect(dropdownHtml).toContain('Cảnh báo vi phạm thời hạn SLA');

      // Node INTERVIEW
      expect(dropdownHtml).toContain('Lịch phỏng vấn');
      expect(dropdownHtml).toContain('giờ trước');
    });

    it('phân biệt trực quan rõ ràng giữa thông báo chưa đọc (in đậm + chấm xanh) và đã đọc', () => {
      const dropdownHtml = renderToString(
        <NotificationDropdown
          isOpen={true}
          notificationList={mockNotifications}
          unreadNotificationCount={2}
          activeFilterTab="ALL"
          onFilterTabChange={vi.fn()}
          onMarkAsRead={vi.fn()}
          onMarkAllAsRead={vi.fn()}
          onNotificationClick={vi.fn()}
          onClose={vi.fn()}
        />
      );

      // Chấm xanh chưa đọc
      expect(dropdownHtml).toContain('data-testid="unread-dot"');

      // In đậm tiêu đề chưa đọc
      expect(dropdownHtml).toContain('font-extrabold text-gray-900');

      // Nút đánh dấu đã đọc từng thông báo
      expect(dropdownHtml).toContain('data-testid="btn-mark-read-notif-001"');
      expect(dropdownHtml).toContain('data-testid="btn-mark-read-notif-002"');
    });

    it('hiển thị trạng thái rỗng khi không có thông báo nào phù hợp', () => {
      const emptyDropdownHtml = renderToString(
        <NotificationDropdown
          isOpen={true}
          notificationList={[]}
          unreadNotificationCount={0}
          activeFilterTab="ALL"
          onFilterTabChange={vi.fn()}
          onMarkAsRead={vi.fn()}
          onMarkAllAsRead={vi.fn()}
          onNotificationClick={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(emptyDropdownHtml).toContain('data-testid="notification-empty-state"');
      expect(emptyDropdownHtml).toContain('Chưa có thông báo nào');
    });
  });

  // =========================================================================
  // AC 3: Các thao tác quản lý (Đánh dấu đã đọc)
  // =========================================================================
  describe('3. Các thao tác quản lý thông báo (AC 3)', () => {
    it('cung cấp nút "Đọc tất cả" (Đánh dấu tất cả đã đọc) khi có thông báo chưa đọc', () => {
      const dropdownHtml = renderToString(
        <NotificationDropdown
          isOpen={true}
          notificationList={mockNotifications}
          unreadNotificationCount={2}
          activeFilterTab="ALL"
          onFilterTabChange={vi.fn()}
          onMarkAsRead={vi.fn()}
          onMarkAllAsRead={vi.fn()}
          onNotificationClick={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(dropdownHtml).toContain('data-testid="btn-mark-all-read"');
      expect(dropdownHtml).toContain('Đọc tất cả');
    });

    it('ẩn nút "Đọc tất cả" khi không có thông báo chưa đọc nào', () => {
      const allReadNotifications: AppNotificationItem[] = mockNotifications.map(
        (notificationItem) => ({ ...notificationItem, isRead: true })
      );

      const dropdownHtml = renderToString(
        <NotificationDropdown
          isOpen={true}
          notificationList={allReadNotifications}
          unreadNotificationCount={0}
          activeFilterTab="ALL"
          onFilterTabChange={vi.fn()}
          onMarkAsRead={vi.fn()}
          onMarkAllAsRead={vi.fn()}
          onNotificationClick={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(dropdownHtml).not.toContain('data-testid="btn-mark-all-read"');
    });

    it('hỗ trợ bộ lọc xem thông báo Chưa đọc (UNREAD tab)', () => {
      const unreadFilteredHtml = renderToString(
        <NotificationDropdown
          isOpen={true}
          notificationList={mockNotifications}
          unreadNotificationCount={2}
          activeFilterTab="UNREAD"
          onFilterTabChange={vi.fn()}
          onMarkAsRead={vi.fn()}
          onMarkAllAsRead={vi.fn()}
          onNotificationClick={vi.fn()}
          onClose={vi.fn()}
        />
      );

      // Hiển thị 2 thông báo chưa đọc
      expect(unreadFilteredHtml).toContain('data-testid="notification-item-notif-001"');
      expect(unreadFilteredHtml).toContain('data-testid="notification-item-notif-002"');

      // Ẩn thông báo đã đọc
      expect(unreadFilteredHtml).not.toContain('data-testid="notification-item-notif-003"');
    });
  });

  // =========================================================================
  // Service & State Management
  // =========================================================================
  describe('4. Tích hợp Notification Service', () => {
    it('notificationService.getNotificationList trả về danh sách thông báo mẫu ban đầu', async () => {
      notificationService.resetToDefaultNotifications();
      const notificationList = await notificationService.getNotificationList();

      expect(notificationList).toBeDefined();
      expect(notificationList.length).toBeGreaterThan(0);
      expect(notificationList[0].title).toBeDefined();
    });

    it('notificationService.markNotificationAsRead cập nhật isRead = true cho thông báo chỉ định', async () => {
      notificationService.resetToDefaultNotifications();
      const updatedList = await notificationService.markNotificationAsRead('notif-offer-001');

      const targetItem = updatedList.find(
        (item) => item.notificationId === 'notif-offer-001'
      );
      expect(targetItem).toBeDefined();
      expect(targetItem?.isRead).toBe(true);
    });

    it('notificationService.markAllNotificationsAsRead cập nhật tất cả thông báo sang isRead = true', async () => {
      notificationService.resetToDefaultNotifications();
      const updatedList = await notificationService.markAllNotificationsAsRead();

      const hasAnyUnread = updatedList.some((item) => !item.isRead);
      expect(hasAnyUnread).toBe(false);

      const unreadCount = await notificationService.getUnreadNotificationCount();
      expect(unreadCount).toBe(0);
    });

    it('notificationService.addNotification thêm thông báo mới vào đầu danh sách', async () => {
      notificationService.resetToDefaultNotifications();
      const newNotification = await notificationService.addNotification({
        title: 'Thông báo khẩn',
        content: 'Nội dung kiểm thử thêm thông báo mới.',
        type: 'SYSTEM',
        priority: 'HIGH',
        isRead: false,
      });

      expect(newNotification.notificationId).toBeDefined();
      expect(newNotification.title).toBe('Thông báo khẩn');

      const currentList = await notificationService.getNotificationList();
      expect(currentList[0].notificationId).toBe(newNotification.notificationId);
    });
  });
});
