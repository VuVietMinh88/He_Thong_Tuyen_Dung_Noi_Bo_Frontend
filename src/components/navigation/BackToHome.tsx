import { useNavigate } from 'react-router-dom'
import { DASHBOARD_ROLES } from '../../constants/roles'

const dashboardRoles = new Set<string>(DASHBOARD_ROLES)

function BackToHome() {
  const navigate = useNavigate()
  const role = localStorage.getItem('user_role')
  const homePath = role && dashboardRoles.has(role) ? '/dashboard' : '/'

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7 7-7-7 7-7" />
        </svg>
        Quay lại
      </button>

      <button
        type="button"
        onClick={() => navigate(homePath)}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="m3 10 9-7 9 7M5 9v11h14V9M9 20v-7h6v7" />
        </svg>
        Trang chủ
      </button>
    </div>
  )
}

export default BackToHome
