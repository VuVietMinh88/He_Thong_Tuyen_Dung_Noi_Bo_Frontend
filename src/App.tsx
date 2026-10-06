import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "./pages/Login/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPassword/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPassword/ResetPasswordPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Các route tương lai sau khi đăng nhập thành công */}
        <Route
          path="/admin/dashboard"
          element={
            <main className="p-8 text-2xl font-bold">Admin Dashboard</main>
          }
        />
        <Route
          path="/hr/dashboard"
          element={<main className="p-8 text-2xl font-bold">HR Dashboard</main>}
        />
        <Route
          path="/interviewer/dashboard"
          element={
            <main className="p-8 text-2xl font-bold">
              Interviewer Dashboard
            </main>
          }
        />
        <Route
          path="/dashboard"
          element={<main className="p-8 text-2xl font-bold">Trang chủ</main>}
        />
      </Routes>
    </Router>
  );
}

export default App;
