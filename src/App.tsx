import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import ToastProvider from './components/notifications/ToastProvider'
import { useToast } from './components/notifications/useToast'
import ProtectedRoute from './components/routes/ProtectedRoute'
import { ROLES } from './constants/roles'
import UnauthorizedPage from './pages/error/UnauthorizedPage'
import { getHealth } from './services/healthService'

function HomePage() {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('Chưa kiểm tra kết nối Backend.')
  const { notify } = useToast()

  async function checkConnection() {
    setPending(true)
    setMessage('Đang kiểm tra kết nối...')
    try {
      const health = await getHealth()
      const successMessage = `Kết nối Backend thành công: ${health.status}.`
      setMessage(successMessage)
      notify(successMessage, 'success')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Không kiểm tra được kết nối.'
      setMessage(errorMessage)
      notify(errorMessage, 'error')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-slate-800">
      <h1 className="text-3xl font-bold">Hệ thống tuyển dụng nội bộ</h1>
      <p className="mt-2 text-slate-600">Frontend — K3S4_N3</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" disabled={pending} onClick={() => void checkConnection()} className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-60">
          {pending ? 'Đang kiểm tra...' : 'Kiểm tra kết nối Backend'}
        </button>

        <button type="button" onClick={() => window.location.assign('/login')} className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700">
          Đi đến trang đăng nhập demo
        </button>
      </div>

      <p role="status" aria-live="polite" className="mt-4 rounded-lg bg-slate-100 px-4 py-3 text-sm">
        {message}
      </p>
    </main>
  )
}

function LoginPage() {
  const navigate = useNavigate()
  const { notify } = useToast()
  const [role, setRole] = useState('RECRUITER')

  const handleLogin = () => {
    localStorage.setItem('access_token', 'demo-access-token')
    localStorage.setItem('refresh_token', 'demo-refresh-token')
    localStorage.setItem('user_role', role)
    notify('Đăng nhập demo thành công.', 'success')
    navigate('/dashboard')
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4 py-10">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
        <h1 className="text-2xl font-bold text-slate-900">Đăng nhập demo</h1>
        <p className="mt-2 text-sm text-slate-600">Chọn vai trò để test luồng 401/403.</p>

        <label className="mt-6 block text-sm font-medium text-slate-700">
          Vai trò
          <select value={role} onChange={(event) => setRole(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-0 focus:border-slate-500">
            <option value="CANDIDATE">CANDIDATE</option>
            <option value="RECRUITER">RECRUITER</option>
            <option value="HEAD_OF_DEPARTMENT">HEAD_OF_DEPARTMENT</option>
            <option value="HR_MANAGER">HR_MANAGER</option>
            <option value="SYSTEM_ADMIN">SYSTEM_ADMIN</option>
          </select>
        </label>

        <button type="button" onClick={handleLogin} className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-3 font-medium text-white hover:bg-slate-700">
          Đăng nhập
        </button>
      </section>
    </main>
  )
}

function DashboardPage() {
  const navigate = useNavigate()
  const role = localStorage.getItem('user_role') ?? 'CANDIDATE'

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Dashboard</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Xin chào</h1>
        <p className="mt-2 text-slate-600">
          Vai trò hiện tại: <span className="font-semibold text-slate-900">{role}</span>
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={() => navigate('/unauthorized')} className="rounded-lg bg-red-500 px-4 py-2 font-medium text-white hover:bg-red-600">
            Test 403
          </button>

          <button type="button" onClick={() => navigate('/')} className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50">
            Về trang chủ
          </button>
        </div>
      </div>
    </main>
  )
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute allowedRoles={[ROLES.RECRUITER, ROLES.HR_MANAGER, ROLES.SYSTEM_ADMIN]} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>

          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
