import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { Role } from '../../constants/roles';

interface ProtectedRouteProps {
  allowedRoles: readonly Role[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const location = useLocation();
  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role') as Role | null;

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (userRole && allowedRoles.includes(userRole)) {
    return <Outlet />;
  }

  return <Navigate to="/unauthorized" replace />;
};

export default ProtectedRoute;
