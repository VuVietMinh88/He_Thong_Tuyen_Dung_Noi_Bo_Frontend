import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login/LoginPage';
import ForgotPasswordPage from './pages/ForgotPassword/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPassword/ResetPasswordPage';
import ChangePasswordPage from './pages/ChangePassword/ChangePasswordPage';
import AccountListPage from './pages/AccountList/AccountListPage';
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
        <Route path="/health" element={<HealthCheck />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/users" element={<AccountListPage />} />
        <Route path="/admin/users" element={<AccountListPage />} />
        <Route path="/admin/dashboard" element={<AccountListPage />} />
        <Route
          path="/hr/dashboard"
          element={<main className="p-8 text-2xl font-bold">HR Dashboard</main>}
        />
        <Route
          path="/interviewer/dashboard"
          element={<main className="p-8 text-2xl font-bold">Interviewer Dashboard</main>}
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
