import { ROLES } from '../constants/roles';
import type { User } from '../types/auth';
import type {
  AppNotificationItem,
  NotificationAccessCheckResult,
} from '../types/notification';

/**
 * Các vai trò có thẩm quyền xem và xét duyệt thư mời nhận việc (Offer)
 */
const OFFER_ALLOWED_ROLES: readonly string[] = [
  ROLES.ADMIN,
  ROLES.HR_MANAGER,
  ROLES.HIRING_MANAGER,
  ROLES.APPROVER,
  ROLES.RECRUITER,
];

/**
 * Các vai trò có phạm vi quản trị toàn doanh nghiệp (không bị giới hạn theo phòng ban)
 */
const COMPANY_WIDE_ROLES: readonly string[] = [
  ROLES.ADMIN,
  ROLES.HR_MANAGER,
];

/**
 * Kiểm tra xem người dùng có ít nhất một vai trò hợp lệ trong danh sách cho phép hay không
 */
const hasAnyRole = (userRoles: string[], allowedRoles: readonly string[]): boolean =>
  userRoles.some((role) => allowedRoles.includes(role));

/**
 * Kiểm tra xem người dùng có ít nhất một quyền hạn (permission string) trong danh sách cấp phép hay không
 */
const hasAnyPermission = (
  grantedPermissions: readonly string[],
  requiredPermissions: readonly string[]
): boolean =>
  requiredPermissions.some((permission) => grantedPermissions.includes(permission));

/**
 * Kiểm tra quyền truy cập đối tượng thông báo dựa trên vai trò, quyền hạn và phòng ban
 * Jira Subtask: TKNHTTDNB1-542 - Tích hợp mở đúng đối tượng từ thông báo (Story TKNHTTDNB1-79)
 *
 * @param notificationItem Thông tin đối tượng thông báo cần kiểm tra
 * @param currentUser Thông tin người dùng hiện tại đang đăng nhập
 * @param grantedPermissions Danh sách các quyền hạn người dùng được cấp từ PermissionContext
 */
export const checkNotificationTargetAccess = (
  notificationItem: AppNotificationItem,
  currentUser: User | null,
  grantedPermissions: readonly string[] = []
): NotificationAccessCheckResult => {
  // 1. Kiểm tra xác thực người dùng
  if (!currentUser) {
    return {
      hasAccess: false,
      errorMessage: 'Không có quyền truy cập: Bạn cần đăng nhập để xem đối tượng này.',
      denialReason: 'UNAUTHENTICATED',
    };
  }

  const userRoles = currentUser.roles || [];
  const metadata = notificationItem.metadata || {};

  // 2. Kiểm tra cờ mô phỏng mã lỗi HTTP 403 Forbidden từ backend hoặc metadata
  if (metadata.statusCode === 403 || metadata.forbidden === true) {
    return {
      hasAccess: false,
      errorMessage: 'Không có quyền truy cập: Máy chủ từ chối yêu cầu (HTTP 403 Forbidden).',
      denialReason: 'FORBIDDEN',
    };
  }

  // 3. Kiểm tra phạm vi phòng ban (Cross-department Permission Check - AC 3)
  // Xử lý trường hợp user click vào thông báo yêu cầu duyệt của phòng ban khác
  const notificationDepartmentId =
    typeof metadata.departmentId === 'string'
      ? metadata.departmentId.trim()
      : typeof metadata.targetDepartmentId === 'string'
      ? metadata.targetDepartmentId.trim()
      : null;

  const isCompanyWideManager = hasAnyRole(userRoles, COMPANY_WIDE_ROLES);

  if (notificationDepartmentId && !isCompanyWideManager) {
    const userDepartmentId = currentUser.departmentId?.trim();
    if (userDepartmentId && userDepartmentId !== notificationDepartmentId) {
      const departmentName = metadata.departmentName || metadata.targetDepartmentName || 'phòng ban khác';
      return {
        hasAccess: false,
        errorMessage: `Không có quyền truy cập: Bạn không thuộc ${departmentName} để xem hoặc phê duyệt đối tượng này.`,
        denialReason: 'DEPARTMENT_MISMATCH',
      };
    }
  }

  // 4. Kiểm tra các vai trò hoặc quyền hạn được chỉ định rõ trong metadata thông báo
  if (Array.isArray(metadata.requiredRoles) && metadata.requiredRoles.length > 0) {
    const isRoleMatched = hasAnyRole(userRoles, metadata.requiredRoles as string[]);
    if (!isRoleMatched) {
      return {
        hasAccess: false,
        errorMessage: 'Không có quyền truy cập: Vai trò của bạn không đủ thẩm quyền xử lý thông báo này.',
        denialReason: 'INSUFFICIENT_PERMISSIONS',
      };
    }
  }

  if (Array.isArray(metadata.requiredPermissions) && metadata.requiredPermissions.length > 0) {
    const isPermissionMatched = hasAnyPermission(
      grantedPermissions,
      metadata.requiredPermissions as string[]
    );
    if (!isPermissionMatched) {
      return {
        hasAccess: false,
        errorMessage: 'Không có quyền truy cập: Tài khoản chưa được phân quyền truy cập chức năng này.',
        denialReason: 'INSUFFICIENT_PERMISSIONS',
      };
    }
  }

  // 5. Kiểm tra phân quyền theo loại đối tượng thông báo (AC 1 & AC 3)
  switch (notificationItem.type) {
    case 'OFFER': {
      // Phê duyệt và xem thư mời nhận việc đòi hỏi các vai trò quản lý / tuyển dụng
      const hasOfferRole = hasAnyRole(userRoles, OFFER_ALLOWED_ROLES);
      const hasOfferPermission = hasAnyPermission(grantedPermissions, [
        'OFFERS_READ_ALL',
        'OFFERS_READ_SCOPED',
        'OFFERS_WRITE_ALL',
      ]);

      if (!hasOfferRole && !hasOfferPermission) {
        return {
          hasAccess: false,
          errorMessage: 'Không có quyền truy cập: Bạn không có quyền xem hoặc phê duyệt đề nghị tuyển dụng (Offer).',
          denialReason: 'INSUFFICIENT_PERMISSIONS',
        };
      }
      break;
    }

    case 'JOB_POSTING': {
      const hasJobPostingPermission = hasAnyPermission(grantedPermissions, [
        'JOB_POSTINGS_READ_ALL',
        'JOB_POSTINGS_READ_SCOPED',
        'REQUISITIONS_READ_ALL',
        'REQUISITIONS_READ_SCOPED',
      ]);
      const hasJobPostingRole = hasAnyRole(userRoles, [
        ROLES.ADMIN,
        ROLES.HR_MANAGER,
        ROLES.RECRUITER,
        ROLES.HIRING_MANAGER,
      ]);

      if (!hasJobPostingPermission && !hasJobPostingRole) {
        return {
          hasAccess: false,
          errorMessage: 'Không có quyền truy cập: Bạn không có quyền xem tin tuyển dụng này.',
          denialReason: 'INSUFFICIENT_PERMISSIONS',
        };
      }
      break;
    }

    case 'CANDIDATE':
    case 'SLA_WARNING': {
      const hasCandidatePermission = hasAnyPermission(grantedPermissions, [
        'CANDIDATES_READ_ALL',
        'CANDIDATES_READ_SCOPED',
      ]);
      const hasCandidateRole = hasAnyRole(userRoles, [
        ROLES.ADMIN,
        ROLES.HR_MANAGER,
        ROLES.RECRUITER,
        ROLES.HIRING_MANAGER,
        ROLES.INTERVIEWER,
      ]);

      if (!hasCandidatePermission && !hasCandidateRole) {
        return {
          hasAccess: false,
          errorMessage: 'Không có quyền truy cập: Bạn không có quyền truy cập hồ sơ ứng viên này.',
          denialReason: 'INSUFFICIENT_PERMISSIONS',
        };
      }
      break;
    }

    case 'INTERVIEW': {
      // Màn hình lịch phỏng vấn do Duy Mạnh / Tuấn Minh làm
      const hasInterviewPermission = hasAnyPermission(grantedPermissions, [
        'INTERVIEWS_READ_ALL',
        'INTERVIEWS_READ_SCOPED',
      ]);
      const hasInterviewRole = hasAnyRole(userRoles, [
        ROLES.ADMIN,
        ROLES.HR_MANAGER,
        ROLES.RECRUITER,
        ROLES.HIRING_MANAGER,
        ROLES.INTERVIEWER,
      ]);

      if (!hasInterviewPermission && !hasInterviewRole) {
        return {
          hasAccess: false,
          errorMessage: 'Không có quyền truy cập: Bạn không có quyền truy cập lịch phỏng vấn này.',
          denialReason: 'INSUFFICIENT_PERMISSIONS',
        };
      }
      break;
    }

    case 'SYSTEM':
    default:
      // Thông báo hệ thống chung cho phép tất cả người dùng đã xác thực xem
      break;
  }

  return {
    hasAccess: true,
  };
};
