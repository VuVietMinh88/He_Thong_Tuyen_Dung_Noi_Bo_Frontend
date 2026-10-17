import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import {
  NOTIFICATION_ROUTE_PATHS,
  buildNotificationRoute,
  resolveNotificationTargetUrl,
} from '../src/constants/notificationRoutes';
import { checkNotificationTargetAccess } from '../src/utils/notificationPermissionHelper';
import {
  useNotificationRouting,
  type UseNotificationRoutingReturn,
} from '../src/hooks/useNotificationRouting';
import { notificationService } from '../src/services/notificationService';
import { tokenService } from '../src/services/token.service';
import { toast } from '../src/components/notifications';
import { PermissionContext } from '../src/context/PermissionContext';
import { ROLES } from '../src/constants/roles';
import type {
  AppNotificationItem,
  NotificationRoutingHandlerOptions,
} from '../src/types/notification';
import type { User } from '../src/types/auth';

// Mock useNavigate từ react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actualModule = await vi.importActual('react-router-dom');
  return {
    ...actualModule,
    useNavigate: () => mockNavigate,
  };
});

/**
 * Helper mount hook với renderToString của react-dom/server
 */
const mountTestHook = (
  options: NotificationRoutingHandlerOptions = {},
  permissionContextMock?: { permissions: string[]; isLoading: boolean; error: Error | null; reload: () => void }
): UseNotificationRoutingReturn => {
  let hookInstance!: UseNotificationRoutingReturn;

  const TestHarnessComponent = () => {
    hookInstance = useNotificationRouting(options);
    return null;
  };

  const tree = (
    <MemoryRouter>
      {permissionContextMock ? (
        <PermissionContext.Provider value={permissionContextMock}>
          <TestHarnessComponent />
        </PermissionContext.Provider>
      ) : (
        <TestHarnessComponent />
      )}
    </MemoryRouter>
  );

  renderToString(tree);
  return hookInstance;
};


const storage = new Map<string, string>();

describe('Jira Subtask TKNHTTDNB1-542: Tích hợp mở đúng đối tượng từ thông báo (Story TKNHTTDNB1-79)', () => {
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
    notificationService.clearAllNotifications();
  });

  afterEach(() => {
    tokenService.clearAll();
    vi.unstubAllGlobals();
  });

  // Mock User tiêu chuẩn có quyền đầy đủ (HR Manager phòng Nhân sự)
  const standardManagerUser: User = {
    id: 'usr-hrm-001',
    email: 'hrmanager@codegym.vn',
    fullName: 'Trưởng Phòng Nhân Sự',
    roles: [ROLES.HR_MANAGER],
    departmentId: 'dept-hr-01',
    departmentName: 'Phòng Nhân sự',
  };

  // Mock User Trưởng phòng Kỹ thuật (Hiring Manager)
  const techHiringManagerUser: User = {
    id: 'usr-tech-002',
    email: 'techlead@codegym.vn',
    fullName: 'Trưởng Bộ Phận Kỹ Thuật',
    roles: [ROLES.HIRING_MANAGER],
    departmentId: 'dept-it-01',
    departmentName: 'Bộ phận Công nghệ thông tin',
  };

  // Mock User Người phỏng vấn thông thường (không có quyền xem Offer)
  const interviewerUser: User = {
    id: 'usr-interviewer-003',
    email: 'interviewer@codegym.vn',
    fullName: 'Chuyên viên Kỹ thuật Phỏng vấn',
    roles: [ROLES.INTERVIEWER],
    departmentId: 'dept-it-01',
    departmentName: 'Bộ phận Công nghệ thông tin',
  };

  // =========================================================================
  // AC 1: Chuyển hướng (Routing Logic) & Route Constants
  // =========================================================================
  describe('1. Logic Chuyển Hướng (Routing Logic) và Route Constants (AC 1)', () => {
    it('khai báo các Route Path thành hằng số riêng biệt cho từng loại đối tượng', () => {
      // Đảm bảo các route hằng số tồn tại độc lập
      expect(NOTIFICATION_ROUTE_PATHS.JOB_POSTING_LIST).toBe('/job-postings');
      expect(NOTIFICATION_ROUTE_PATHS.JOB_POSTING_REVIEW).toBe('/job-postings/:id/review');
      expect(NOTIFICATION_ROUTE_PATHS.CANDIDATE_LIST).toBe('/candidates');
      expect(NOTIFICATION_ROUTE_PATHS.CANDIDATE_DETAIL).toBe('/candidates/:id');
      expect(NOTIFICATION_ROUTE_PATHS.OFFER_APPROVAL_DETAIL).toBe('/offers/:id/approval');

      // Màn hình lịch phỏng vấn do Duy Mạnh / Tuấn Minh phụ trách được định nghĩa hằng số riêng
      expect(NOTIFICATION_ROUTE_PATHS.INTERVIEW_SCHEDULE).toBe('/interviews');
    });

    it('buildNotificationRoute tạo đúng URL động tương ứng cho từng loại màn hình', () => {
      expect(buildNotificationRoute.offerApprovalDetail('OFF-2026-8899')).toBe(
        '/offers/OFF-2026-8899/approval'
      );
      expect(buildNotificationRoute.candidateDetail('can-mai-004')).toBe(
        '/candidates/can-mai-004'
      );
      expect(buildNotificationRoute.jobPostingReview('jp-devops-001')).toBe(
        '/job-postings/jp-devops-001/review'
      );
      expect(buildNotificationRoute.interviewDetail('int-99')).toBe(
        '/interviews?interviewId=int-99'
      );
    });

    it('resolveNotificationTargetUrl phân giải đúng màn hình Offer từ thông báo', () => {
      const offerNotification: AppNotificationItem = {
        notificationId: 'notif-offer-001',
        title: 'Đề nghị tuyển dụng chờ duyệt',
        content: 'Offer cho ứng viên Trần Minh Đức đang chờ xét duyệt.',
        type: 'OFFER',
        isRead: false,
        createdAt: new Date().toISOString(),
        metadata: {
          offerId: 'OFF-2026-8899',
        },
      };

      const resolvedUrl = resolveNotificationTargetUrl(offerNotification);
      expect(resolvedUrl).toBe('/offers/OFF-2026-8899/approval');
    });

    it('resolveNotificationTargetUrl phân giải đúng màn hình Ứng viên từ thông báo', () => {
      const candidateNotification: AppNotificationItem = {
        notificationId: 'notif-can-001',
        title: 'Hồ sơ mới',
        content: 'Có hồ sơ ứng tuyển mới.',
        type: 'CANDIDATE',
        isRead: false,
        createdAt: new Date().toISOString(),
        metadata: {
          candidateId: 'can-009',
        },
      };

      const resolvedUrl = resolveNotificationTargetUrl(candidateNotification);
      expect(resolvedUrl).toBe('/candidates/can-009');
    });

    it('resolveNotificationTargetUrl phân giải đúng màn hình Lịch phỏng vấn (Duy Mạnh / Tuấn Minh làm)', () => {
      const interviewNotification: AppNotificationItem = {
        notificationId: 'notif-int-001',
        title: 'Lịch phỏng vấn mới',
        content: 'Bạn có buổi phỏng vấn ngày mai.',
        type: 'INTERVIEW',
        isRead: false,
        createdAt: new Date().toISOString(),
        metadata: {
          interviewId: 'int-session-12',
        },
      };

      const resolvedUrl = resolveNotificationTargetUrl(interviewNotification);
      expect(resolvedUrl).toBe('/interviews?interviewId=int-session-12');
    });

    it('resolveNotificationTargetUrl phân giải đúng màn hình Tin tuyển dụng / Yêu cầu tuyển dụng', () => {
      const jobNotification: AppNotificationItem = {
        notificationId: 'notif-job-001',
        title: 'Tin tuyển dụng chờ duyệt',
        content: 'Tin tuyển dụng DevOps cần duyệt.',
        type: 'JOB_POSTING',
        isRead: false,
        createdAt: new Date().toISOString(),
        metadata: {
          postingId: 'post-devops-55',
        },
      };

      const resolvedUrl = resolveNotificationTargetUrl(jobNotification);
      expect(resolvedUrl).toBe('/job-postings/post-devops-55/review');
    });

    it('ưu tiên targetUrl khi đã được thiết lập sẵn trong thông báo', () => {
      const customUrlNotification: AppNotificationItem = {
        notificationId: 'notif-custom-001',
        title: 'Báo cáo nguồn tuyển dụng',
        content: 'Xem báo cáo thống kê.',
        type: 'SYSTEM',
        isRead: true,
        createdAt: new Date().toISOString(),
        targetUrl: '/reports/sources',
      };

      const resolvedUrl = resolveNotificationTargetUrl(customUrlNotification);
      expect(resolvedUrl).toBe('/reports/sources');
    });
  });

  // =========================================================================
  // AC 2: Cập nhật trạng thái (Mark as Read)
  // =========================================================================
  describe('2. Tự Động Cập Nhật Trạng Thái "Đã Đọc" (AC 2)', () => {
    it('gọi API cập nhật trạng thái và kích hoạt callback giảm số đếm Badge khi click thông báo chưa đọc', async () => {
      tokenService.setUserData(standardManagerUser);
      const markAsReadSpy = vi.spyOn(notificationService, 'markNotificationAsRead');
      const onNotificationReadMock = vi.fn();
      const onSuccessMock = vi.fn();

      const unreadNotification: AppNotificationItem = {
        notificationId: 'notif-unread-001',
        title: 'Offer mới',
        content: 'Cần duyệt offer.',
        type: 'OFFER',
        isRead: false,
        createdAt: new Date().toISOString(),
        metadata: {
          offerId: 'OFF-1122',
        },
      };

      const routingInstance = mountTestHook({
        onNotificationRead: onNotificationReadMock,
        onSuccess: onSuccessMock,
      });

      const navigationResult = await routingInstance.handleNotificationClick(unreadNotification);

      expect(navigationResult).toBe(true);
      // Kiểm tra gọi hàm cập nhật trạng thái
      expect(markAsReadSpy).toHaveBeenCalledWith('notif-unread-001');
      // Kiểm tra callback để cập nhật Badge hiển thị
      expect(onNotificationReadMock).toHaveBeenCalledWith('notif-unread-001');
      // Kiểm tra navigate tới đúng màn hình
      expect(mockNavigate).toHaveBeenCalledWith('/offers/OFF-1122/approval');
    });

    it('không gọi API cập nhật trạng thái nếu thông báo đã ở trạng thái đã đọc từ trước', async () => {
      tokenService.setUserData(standardManagerUser);
      const markAsReadSpy = vi.spyOn(notificationService, 'markNotificationAsRead');
      const onNotificationReadMock = vi.fn();

      const alreadyReadNotification: AppNotificationItem = {
        notificationId: 'notif-read-001',
        title: 'Tin đã xem',
        content: 'Nội dung tin đã xem.',
        type: 'CANDIDATE',
        isRead: true,
        createdAt: new Date().toISOString(),
        metadata: {
          candidateId: 'can-999',
        },
      };

      const routingInstance = mountTestHook({
        onNotificationRead: onNotificationReadMock,
      });

      await routingInstance.handleNotificationClick(alreadyReadNotification);

      // Không gọi API redundantly
      expect(markAsReadSpy).not.toHaveBeenCalled();
      expect(onNotificationReadMock).not.toHaveBeenCalled();
      // Vẫn điều hướng bình thường
      expect(mockNavigate).toHaveBeenCalledWith('/candidates/can-999');
    });
  });

  // =========================================================================
  // AC 3: Xử lý quyền truy cập (Permission Error Handling)
  // =========================================================================
  describe('3. Xử Lý Quyền Truy Cập & Bắt Lỗi Không Crash (AC 3)', () => {
    it('checkNotificationTargetAccess phát hiện chính xác khi sai phòng ban', () => {
      const evaluation = checkNotificationTargetAccess(
        {
          notificationId: 'notif-dept-diff',
          title: 'Duyệt lương Sales',
          content: 'Nội dung phòng Sales.',
          type: 'OFFER',
          isRead: false,
          createdAt: new Date().toISOString(),
          metadata: {
            departmentId: 'dept-sales-03',
            departmentName: 'Phòng Kinh doanh & Bán hàng',
          },
        },
        techHiringManagerUser,
        []
      );

      expect(evaluation.hasAccess).toBe(false);
      expect(evaluation.denialReason).toBe('DEPARTMENT_MISMATCH');
      expect(evaluation.errorMessage).toContain('Phòng Kinh doanh & Bán hàng');
    });

    it('chặn điều hướng và hiển thị Toast cảnh báo khi user click vào thông báo của phòng ban khác', async () => {
      // User thuộc phòng CNTT (dept-it-01)
      tokenService.setUserData(techHiringManagerUser);
      const toastWarningSpy = vi.spyOn(toast, 'warning');
      const onPermissionDeniedMock = vi.fn();

      // Thông báo phê duyệt Offer của phòng Tiếp thị (dept-marketing-02)
      const marketingOfferNotification: AppNotificationItem = {
        notificationId: 'notif-cross-dept-006',
        title: 'Yêu cầu duyệt offer phòng Tiếp thị',
        content: 'Đề nghị duyệt offer phòng Tiếp thị.',
        type: 'OFFER',
        isRead: false,
        createdAt: new Date().toISOString(),
        metadata: {
          offerId: 'OFF-MKT-01',
          departmentId: 'dept-marketing-02',
          departmentName: 'Phòng Tiếp thị & Marketing',
        },
      };

      const routingInstance = mountTestHook({
        onPermissionDenied: onPermissionDeniedMock,
      });

      const navigationResult = await routingInstance.handleNotificationClick(
        marketingOfferNotification
      );

      // Điều hướng bị chặn
      expect(navigationResult).toBe(false);
      expect(mockNavigate).not.toHaveBeenCalled();

      // Hiển thị thông báo Toast cảnh báo phân quyền theo AC 3
      expect(toastWarningSpy).toHaveBeenCalled();
      const warningMessage = toastWarningSpy.mock.calls[0][0];
      expect(warningMessage).toContain('Không có quyền truy cập');
      expect(warningMessage).toContain('Phòng Tiếp thị & Marketing');

      expect(onPermissionDeniedMock).toHaveBeenCalled();
    });

    it('chặn điều hướng khi user không có thẩm quyền đối với loại đối tượng (ví dụ: Interviewer xem Offer)', async () => {
      // User chỉ có quyền INTERVIEWER
      tokenService.setUserData(interviewerUser);
      const toastWarningSpy = vi.spyOn(toast, 'warning');

      const offerNotification: AppNotificationItem = {
        notificationId: 'notif-offer-secret',
        title: 'Xét duyệt offer mức lương cao',
        content: 'Xem chi tiết offer.',
        type: 'OFFER',
        isRead: false,
        createdAt: new Date().toISOString(),
        metadata: {
          offerId: 'OFF-999',
        },
      };

      const routingInstance = mountTestHook();
      const navigationResult = await routingInstance.handleNotificationClick(offerNotification);

      expect(navigationResult).toBe(false);
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(toastWarningSpy).toHaveBeenCalledWith(
        expect.stringContaining('Bạn không có quyền xem hoặc phê duyệt đề nghị tuyển dụng (Offer)')
      );
    });

    it('bắt lỗi HTTP 403 Forbidden từ metadata / máy chủ và hiển thị Toast không crash ứng dụng', async () => {
      tokenService.setUserData(standardManagerUser);
      const toastWarningSpy = vi.spyOn(toast, 'warning');

      const forbiddenNotification: AppNotificationItem = {
        notificationId: 'notif-forbidden-403',
        title: 'Tài nguyên bị khóa',
        content: 'Yêu cầu truy cập bị máy chủ từ chối.',
        type: 'JOB_POSTING',
        isRead: false,
        createdAt: new Date().toISOString(),
        metadata: {
          postingId: 'post-locked',
          statusCode: 403,
        },
      };

      const routingInstance = mountTestHook();
      const navigationResult = await routingInstance.handleNotificationClick(
        forbiddenNotification
      );

      expect(navigationResult).toBe(false);
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(toastWarningSpy).toHaveBeenCalledWith(
        expect.stringContaining('HTTP 403 Forbidden')
      );
    });

    it('xử lý an toàn khi người dùng chưa đăng nhập (unauthenticated)', async () => {
      tokenService.removeUserData();
      const toastWarningSpy = vi.spyOn(toast, 'warning');

      const anyNotification: AppNotificationItem = {
        notificationId: 'notif-unauth',
        title: 'Thông báo chung',
        content: 'Xem nội dung.',
        type: 'CANDIDATE',
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      const routingInstance = mountTestHook();
      const navigationResult = await routingInstance.handleNotificationClick(anyNotification);

      expect(navigationResult).toBe(false);
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(toastWarningSpy).toHaveBeenCalledWith(
        expect.stringContaining('Bạn cần đăng nhập để xem đối tượng này')
      );
    });
  });

  // =========================================================================
  // AC 4: Tích hợp PermissionContext và vai trò toàn quyền Admin/HR Manager
  // =========================================================================
  describe('4. Quản Trị Viên & Trưởng Phòng Nhân Sự Toàn Doanh Nghiệp', () => {
    it('cho phép Quản trị viên (ADMIN) và HR Manager truy cập xuyên phòng ban', async () => {
      // HR Manager có quyền toàn doanh nghiệp (company-wide)
      tokenService.setUserData(standardManagerUser);

      const otherDeptNotification: AppNotificationItem = {
        notificationId: 'notif-cross-hr',
        title: 'Phê duyệt offer phòng Kỹ thuật',
        content: 'Offer cần duyệt.',
        type: 'OFFER',
        isRead: false,
        createdAt: new Date().toISOString(),
        metadata: {
          offerId: 'OFF-IT-888',
          departmentId: 'dept-it-01',
          departmentName: 'Phòng Kỹ thuật CNTT',
        },
      };

      const routingInstance = mountTestHook();
      const navigationResult = await routingInstance.handleNotificationClick(
        otherDeptNotification
      );

      // Được phép điều hướng vì là HR Manager
      expect(navigationResult).toBe(true);
      expect(mockNavigate).toHaveBeenCalledWith('/offers/OFF-IT-888/approval');
    });

    it('cho phép truy cập khi người dùng sở hữu permission thích hợp từ PermissionContext', async () => {
      // User với vai trò tuyển dụng thông thường nhưng có quyền CANDIDATES_READ_ALL
      const recruiterUser: User = {
        id: 'usr-recruiter-05',
        email: 'recruiter@codegym.vn',
        fullName: 'Chuyên viên Săn nhân tài',
        roles: [ROLES.RECRUITER],
      };
      tokenService.setUserData(recruiterUser);

      const candidateNotification: AppNotificationItem = {
        notificationId: 'notif-candidate-special',
        title: 'Hồ sơ chuyên gia',
        content: 'Xem hồ sơ ứng viên.',
        type: 'CANDIDATE',
        isRead: true,
        createdAt: new Date().toISOString(),
        metadata: {
          candidateId: 'can-vip-007',
        },
      };

      const permissionContextMock = {
        permissions: ['CANDIDATES_READ_ALL'],
        isLoading: false,
        error: null,
        reload: vi.fn(),
      };

      const routingInstance = mountTestHook({}, permissionContextMock);
      const navigationResult = await routingInstance.handleNotificationClick(
        candidateNotification
      );

      expect(navigationResult).toBe(true);
      expect(mockNavigate).toHaveBeenCalledWith('/candidates/can-vip-007');
    });
  });
});
