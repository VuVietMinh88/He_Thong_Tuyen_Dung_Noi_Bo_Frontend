import { useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login/LoginPage';
import ForgotPasswordPage from './pages/ForgotPassword/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPassword/ResetPasswordPage';
import ChangePasswordPage from './pages/ChangePassword/ChangePasswordPage';
import AccountListPage from './pages/AccountList/AccountListPage';
import UnauthorizedPage from './pages/error/UnauthorizedPage';
import ProtectedRoute from './components/routes/ProtectedRoute';
import Sidebar from './components/layout/Sidebar';
import { getHealth, type HealthResponse } from './services/healthService';
import { ROLES, type Role } from './constants/roles';

const ALL_ROLES = Object.values(ROLES) as Role[];

const MainLayout = ({ children }: { children: ReactNode }) => (
  <div className="flex h-screen bg-gray-100">
    <Sidebar />
    <div className="flex flex-1 flex-col overflow-hidden">
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
        {children}
      </main>
    </div>
  </div>
);

function HealthCheck() {
  const [status, setStatus] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    getHealth()
      .then((response) => {
        if (isCurrent) setStatus(response);
      })
      .catch((requestError: unknown) => {
        if (isCurrent) {
          setError(requestError instanceof Error
            ? requestError.message
            : 'Lỗi kết nối tới server/database');
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  if (error) {
    return (
      <div style={{ fontFamily: 'monospace', padding: '20px', color: 'red' }}>
        {JSON.stringify({ status: 'error', message: error }, null, 2)}
      </div>
    );
  }

  if (!status) {
    return <div style={{ fontFamily: 'monospace', padding: '20px' }}>Checking connection...</div>;
  }

  return (
    <div style={{ fontFamily: 'monospace', padding: '20px', color: 'green' }}>
      {JSON.stringify({ status: 'connected', backend_data: status }, null, 2)}
    </div>
  );
}

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="rounded-lg bg-white p-8 text-2xl font-bold">{title}</div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/health" element={<HealthCheck />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route element={<ProtectedRoute allowedRoles={ALL_ROLES} />}>
          <Route path="/dashboard" element={<MainLayout><PlaceholderPage title="Bảng điều khiển chung" /></MainLayout>} />
          <Route path="/profile" element={<MainLayout><PlaceholderPage title="Hồ sơ cá nhân" /></MainLayout>} />
          <Route
            path="/change-password"
            element={<MainLayout><ChangePasswordPage /></MainLayout>}
          />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
          <Route path="/users" element={<AccountListPage />} />
          <Route path="/admin/users" element={<AccountListPage />} />
          <Route path="/admin/dashboard" element={<AccountListPage />} />
        </Route>

        <Route
          element={
            <ProtectedRoute
              allowedRoles={[ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.RECRUITER]}
            />
          }
        >
          <Route path="/jobs" element={<MainLayout><PlaceholderPage title="Đăng Tuyển Dụng" /></MainLayout>} />
        </Route>

        <Route
          element={
            <ProtectedRoute
              allowedRoles={[ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.RECRUITER, ROLES.HIRING_MANAGER]}
            />
          }
        >
          <Route path="/candidates" element={<MainLayout><PlaceholderPage title="Quản lý CV / Ứng viên" /></MainLayout>} />
        </Route>

        <Route
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.ADMIN,
                ROLES.HR_MANAGER,
                ROLES.RECRUITER,
                ROLES.HIRING_MANAGER,
                ROLES.INTERVIEWER,
              ]}
            />
          }
        >
          <Route path="/interviews" element={<MainLayout><PlaceholderPage title="Lịch phỏng vấn" /></MainLayout>} />
        </Route>

        <Route
          path="*"
          element={
            <div className="flex h-screen items-center justify-center text-2xl">
              404 - Không tìm thấy trang
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
