import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { Role } from '../../constants/roles';

interface ProtectedRouteProps {
  allowedRoles: Role[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const location = useLocation();
  
  // Trong môi trường thực tế, nên lấy từ Redux/Zustand/Context hoặc token.service.ts
  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role') as Role | null;

  // 1. Nếu chưa đăng nhập -> Đẩy về trang Login, lưu lại state `from` để quay lại sau khi đăng nhập thành công
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Đã đăng nhập và có quyền hợp lệ -> Render giao diện tuyến đường con (Outlet)
  if (userRole && allowedRoles.includes(userRole)) {
    return <Outlet />;
  }

  // 3. Đã đăng nhập nhưng không đủ quyền -> Đẩy ra trang 403 (Unauthorized)
  return <Navigate to="/unauthorized" replace />;
};

export default ProtectedRoute;

