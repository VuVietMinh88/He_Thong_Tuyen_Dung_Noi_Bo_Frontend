import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login/LoginPage';
import { getHealth, type HealthResponse } from './services/healthService';

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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="/login" element={<LoginPage />} />
        
        {/* Route phục vụ kiểm tra sức khỏe hệ thống (Ping/Health Check) */}
        <Route path="/health" element={<HealthCheck />} />

        {/* Các route tương lai sau khi đăng nhập thành công */}
        <Route path="/admin/dashboard" element={<main className="p-8 text-2xl font-bold">Admin Dashboard</main>} />
        <Route path="/hr/dashboard" element={<main className="p-8 text-2xl font-bold">HR Dashboard</main>} />
        <Route path="/interviewer/dashboard" element={<main className="p-8 text-2xl font-bold">Interviewer Dashboard</main>} />
        <Route path="/dashboard" element={<main className="p-8 text-2xl font-bold">Trang chủ</main>} />
      </Routes>
    </Router>
  );
}

export default App;
