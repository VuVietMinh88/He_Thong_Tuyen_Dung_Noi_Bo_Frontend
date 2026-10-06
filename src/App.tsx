import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "./pages/Login/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPassword/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPassword/ResetPasswordPage";
import ChangePasswordPage from "./pages/ChangePassword/ChangePasswordPage";

// Import các component phân quyền mới tạo
import ProtectedRoute from "./components/routes/ProtectedRoute";
import UnauthorizedPage from "./pages/error/UnauthorizedPage";
import Sidebar from "./components/layout/Sidebar";

// Layout có chứa Sidebar
const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Các trang Public (Không cần đăng nhập) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* =========================================
            CÁC TRANG PRIVATE (Bắt buộc đăng nhập & Kiểm tra quyền) 
            ========================================= */}
        
        {/* Route chung cho nhiều Role */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER', 'APPROVER']} />}>
          <Route path="/dashboard" element={<MainLayout><div className="p-8 text-2xl font-bold bg-white rounded-lg shadow">Bảng điều khiển chung</div></MainLayout>} />
          <Route path="/profile" element={<MainLayout><div className="p-8 text-2xl font-bold bg-white rounded-lg shadow">Hồ sơ cá nhân</div></MainLayout>} />
          <Route path="/change-password" element={<MainLayout><ChangePasswordPage /></MainLayout>} />
        </Route>

        {/* Chỉ ADMIN mới vào được Quản lý tài khoản (/users) */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/users" element={<MainLayout><div className="p-8 text-2xl font-bold bg-white rounded-lg shadow">Trang Quản lý Tài khoản (Chỉ Admin)</div></MainLayout>} />
        </Route>

        {/* HR và RECRUITER vào được Quản lý Tuyển dụng */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'HR_MANAGER', 'RECRUITER']} />}>
          <Route path="/jobs" element={<MainLayout><div className="p-8 text-2xl font-bold bg-white rounded-lg shadow">Đăng Tuyển Dụng</div></MainLayout>} />
        </Route>

        {/* Bắt lỗi trang không tồn tại (404) */}
        <Route path="*" element={<div className="flex items-center justify-center h-screen text-2xl">404 - Không tìm thấy trang</div>} />
      </Routes>
    </Router>
  );
}

export default App;
