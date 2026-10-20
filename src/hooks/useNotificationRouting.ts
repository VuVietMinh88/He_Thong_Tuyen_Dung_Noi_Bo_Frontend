import { useState, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { PermissionContext } from '../context/PermissionContext';
import { tokenService } from '../services/token.service';
import { notificationService } from '../services/notificationService';
import { toast } from '../components/notifications';
import { resolveNotificationTargetUrl } from '../constants/notificationRoutes';
import { checkNotificationTargetAccess } from '../utils/notificationPermissionHelper';
import type {
  AppNotificationItem,
  NotificationRoutingHandlerOptions,
} from '../types/notification';

export interface UseNotificationRoutingReturn {
  handleNotificationClick: (notificationItem: AppNotificationItem) => Promise<boolean>;
  routeToTargetObject: (notificationItem: AppNotificationItem) => Promise<boolean>;
  resolveTargetUrl: (notificationItem: AppNotificationItem) => string;
  isRouting: boolean;
}

/**
 * Custom Hook xử lý logic điều hướng đến đối tượng liên quan từ thông báo
 * Jira Subtask: TKNHTTDNB1-542 - Tích hợp mở đúng đối tượng từ thông báo (Story TKNHTTDNB1-79)
 *
 * Chức năng chính:
 * 1. Routing Logic (AC 1): Chuyển hướng router tới đúng màn hình đối tượng theo hằng số tập trung.
 * 2. Mark as Read (AC 2): Đánh dấu đã đọc và cập nhật giảm số lượng đếm trên Badge.
 * 3. Permission Guard (AC 3): Bắt lỗi phân quyền/phòng ban, hiển thị Toast cảnh báo và ngăn chặn crash ứng dụng.
 */
export const useNotificationRouting = (
  routingOptions: NotificationRoutingHandlerOptions = {}
): UseNotificationRoutingReturn => {
  const navigate = useNavigate();
  const [isRouting, setIsRouting] = useState<boolean>(false);

  // Lấy danh sách quyền từ context, nếu component không bọc trong Provider (như isolated test) thì dùng mảng rỗng
  const permissionContextValue = useContext(PermissionContext);
  const grantedPermissions = permissionContextValue?.permissions || [];

  /**
   * Phân giải URL của đối tượng liên quan từ thông báo
   */
  const resolveTargetUrl = useCallback(
    (notificationItem: AppNotificationItem): string =>
      resolveNotificationTargetUrl(notificationItem),
    []
  );

  /**
   * Xử lý click vào một thông báo:
   * - Cập nhật trạng thái đã đọc (AC 2)
   * - Kiểm tra thẩm quyền truy cập (AC 3)
   * - Điều hướng tới đối tượng (AC 1)
   */
  const handleNotificationClick = useCallback(
    async (notificationItem: AppNotificationItem): Promise<boolean> => {
      setIsRouting(true);

      // 1. CẬP NHẬT TRẠNG THÁI "ĐÃ ĐỌC" (AC 2)
      // Cần gọi ngay callback cập nhật state cục bộ để Badge chuông giảm số lượng lập tức, mang lại phản hồi tức thì
      if (!notificationItem.isRead) {
        if (routingOptions.onNotificationRead) {
          routingOptions.onNotificationRead(notificationItem.notificationId);
        }

        try {
          await notificationService.markNotificationAsRead(notificationItem.notificationId);
        } catch (networkException) {
          // Ghi nhận lỗi nhưng không dừng tiến trình điều hướng người dùng nếu họ vẫn có quyền xem
          if (routingOptions.onError) {
            routingOptions.onError(notificationItem, networkException);
          }
        }
      }

      // 2. KIỂM TRA PHÂN QUYỀN TRUY CẬP (AC 3)
      // Ngăn chặn người dùng chuyển trang khi click vào đối tượng của phòng ban khác hoặc không có quyền
      if (!routingOptions.skipPermissionCheck) {
        try {
          const currentUserData = tokenService.getUserData();
          const accessEvaluationResult = checkNotificationTargetAccess(
            notificationItem,
            currentUserData,
            grantedPermissions
          );

          if (!accessEvaluationResult.hasAccess) {
            const forbiddenMessage =
              accessEvaluationResult.errorMessage ||
              'Không có quyền truy cập: Bạn không có thẩm quyền xem đối tượng này.';

            // Hiển thị thông báo Toast cảnh báo theo đúng tiêu chí AC 3
            toast.warning(forbiddenMessage);

            if (routingOptions.onPermissionDenied) {
              routingOptions.onPermissionDenied(notificationItem, forbiddenMessage);
            }

            setIsRouting(false);
            return false;
          }
        } catch (permissionException) {
          // Bắt lỗi triệt để theo Convention K3S4_N3 để ứng dụng tuyệt đối không bị crash giao diện
          const errorMessageText =
            permissionException instanceof Error
              ? permissionException.message
              : 'Không có quyền truy cập: Không thể xác minh quyền hạn của bạn.';

          toast.error(errorMessageText);

          if (routingOptions.onError) {
            routingOptions.onError(notificationItem, permissionException);
          }

          setIsRouting(false);
          return false;
        }
      }

      // 3. THỰC HIỆN ĐIỀU HƯỚNG TỚI ĐỐI TƯỢNG (AC 1)
      try {
        const destinationUrl = resolveNotificationTargetUrl(notificationItem);
        navigate(destinationUrl);

        if (routingOptions.onSuccess) {
          routingOptions.onSuccess(notificationItem, destinationUrl);
        }

        setIsRouting(false);
        return true;
      } catch (routingException) {
        // Phòng ngừa lỗi điều hướng router bất ngờ từ bên ngoài
        const navigationFailureMessage =
          'Không thể mở đối tượng thông báo. Vui lòng thử lại sau.';
        toast.error(navigationFailureMessage);

        if (routingOptions.onError) {
          routingOptions.onError(notificationItem, routingException);
        }

        setIsRouting(false);
        return false;
      }
    },
    [grantedPermissions, navigate, routingOptions]
  );

  return {
    handleNotificationClick,
    routeToTargetObject: handleNotificationClick,
    resolveTargetUrl,
    isRouting,
  };
};

export default useNotificationRouting;
