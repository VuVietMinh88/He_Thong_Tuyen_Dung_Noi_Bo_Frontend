import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROLES, type Role } from '../../constants/roles';
import { tokenService } from '../../services/token.service';

interface ProtectedRouteProps {
  allowedRoles: readonly Role[];
}

const isRole = (role: string): role is Role => Object.hasOwn(ROLES, role);

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const location = useLocation();
  const accessToken = tokenService.getAccessToken();
  const userRoles = tokenService.getUserData()?.roles ?? [];

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasAllowedRole = userRoles.some(
    (role) => isRole(role) && allowedRoles.includes(role),
  );

  return hasAllowedRole
    ? <Outlet />
    : <Navigate to="/unauthorized" replace />;
};

export default ProtectedRoute;
