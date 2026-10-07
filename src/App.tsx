import { useEffect, useState, type ReactNode } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import ProtectedRoute from "./components/routes/ProtectedRoute";
import Sidebar from "./components/layout/Sidebar";
import LoginPage from "./pages/Login/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPassword/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPassword/ResetPasswordPage";
import ChangePasswordPage from "./pages/ChangePassword/ChangePasswordPage";
import UnauthorizedPage from "./pages/error/UnauthorizedPage";
import axiosClient from "./utils/axiosClient";
import { ROLES, type Role } from "./constants/roles";

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
  const [status, setStatus] = useState<{
    status: string;
    backend_data: unknown;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axiosClient
      .get("/health")
      .then((response) => {
        setStatus({ status: "connected", backend_data: response.data });
      })
      .catch((requestError: unknown) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Lỗi kết nối tới server/database",
        );
      });
  }, []);

  if (error) {
    return (
      <div style={{ fontFamily: "monospace", padding: "20px", color: "red" }}>
        {JSON.stringify({ status: "error", message: error, http_status: 500 }, null, 2)}
      </div>
    );
  }

  if (!status) {
    return <div style={{ fontFamily: "monospace", padding: "20px" }}>Checking connection...</div>;
  }

  return (
    <div style={{ fontFamily: "monospace", padding: "20px", color: "green" }}>
      {JSON.stringify({ ...status, http_status: 200 }, null, 2)}
    </div>
  );
}

const PlaceholderPage = ({ title }: { title: string }) => (
  <MainLayout>
    <div className="rounded-lg bg-white p-8 text-2xl font-bold">{title}</div>
  </MainLayout>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/health" element={<HealthCheck />} />

        <Route element={<ProtectedRoute allowedRoles={ALL_ROLES} />}>
          <Route path="/dashboard" element={<PlaceholderPage title="Bảng điều khiển chung" />} />
          <Route path="/profile" element={<PlaceholderPage title="Hồ sơ cá nhân" />} />
          <Route
            path="/change-password"
            element={
              <MainLayout>
                <ChangePasswordPage />
              </MainLayout>
            }
          />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
          <Route path="/users" element={<PlaceholderPage title="Trang Quản lý Tài khoản (Chỉ Admin)" />} />
        </Route>

        <Route
          element={
            <ProtectedRoute
              allowedRoles={[ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.RECRUITER]}
            />
          }
        >
          <Route path="/jobs" element={<PlaceholderPage title="Đăng Tuyển Dụng" />} />
        </Route>

        <Route
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.ADMIN,
                ROLES.HR_MANAGER,
                ROLES.RECRUITER,
                ROLES.HIRING_MANAGER,
              ]}
            />
          }
        >
          <Route path="/candidates" element={<PlaceholderPage title="Quản lý CV / Ứng viên" />} />
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
          <Route path="/interviews" element={<PlaceholderPage title="Lịch phỏng vấn" />} />
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
