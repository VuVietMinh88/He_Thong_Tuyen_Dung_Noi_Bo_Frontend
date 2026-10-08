import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROLES, type Role } from '../../constants/roles';
import { usePermission } from '../../hooks/usePermission';
import { tokenService } from '../../services/token.service';

interface ProtectedRouteProps {
  allowedRoles?: readonly Role[];
  requiredPermissions?: readonly string[];
}

const isRole = (role: string): role is Role => Object.hasOwn(ROLES, role);

const ProtectedRoute = ({ allowedRoles, requiredPermissions = [] }: ProtectedRouteProps) => {
  const location = useLocation();
  const { permissions, isLoading, error, reload } = usePermission();
  const accessToken = tokenService.getAccessToken();
  const userRoles = tokenService.getUserData()?.roles ?? [];

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPermissions.length > 0 && isLoading) {
    return <div className="p-8 text-center text-sm text-slate-600" role="status">Đang xác minh quyền truy cập...</div>;
  }

  if (requiredPermissions.length > 0 && error) {
    return (
      <main className="mx-auto mt-16 max-w-lg rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
        <h1 className="text-lg font-semibold">Không thể xác minh quyền truy cập</h1>
        <p className="mt-2 text-sm">{error.message}</p>
        <button className="mt-4 rounded-lg bg-amber-800 px-4 py-2 text-sm font-semibold text-white" onClick={reload} type="button">
          Thử lại
        </button>
      </main>
    );
  }

  const hasAllowedRole = !allowedRoles?.length || userRoles.some(
    (role) => isRole(role) && allowedRoles.includes(role),
  );
  const hasRequiredPermission = requiredPermissions.length === 0
    || requiredPermissions.some((required) => permissions.includes(required));

  return hasAllowedRole && hasRequiredPermission
    ? <Outlet />
    : <Navigate to="/unauthorized" replace />;
};

export default ProtectedRoute;
