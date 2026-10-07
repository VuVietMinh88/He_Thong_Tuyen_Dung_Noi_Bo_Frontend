import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/Login/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPassword/ForgotPasswordPage";
import axiosClient from "./utils/axiosClient";

function HealthCheck() {
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Thay đổi endpoint '/health' thành endpoint thực tế trên backend của bạn
    axiosClient.get("/health")
      .then(response => {
        setStatus({ status: "connected", backend_data: response.data });
      })
      .catch(err => {
        setError(err.message || "Lỗi kết nối tới server/database");
      });
  }, []);

  if (error) {
    // Trả về JSON lỗi mô phỏng (HTTP Status 500 không thể set trực tiếp từ React client)
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        
        {/* Route phục vụ kiểm tra sức khỏe hệ thống (Ping/Health Check) */}
        <Route path="/health" element={<HealthCheck />} />

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
