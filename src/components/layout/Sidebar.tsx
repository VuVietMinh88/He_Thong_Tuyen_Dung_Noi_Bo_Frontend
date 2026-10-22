import { useState, useMemo, type FC } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ROLES, ROLE_NAMES, type Role } from '../../constants/roles';
import { authService } from '../../services/auth.service';
import { tokenService } from '../../services/token.service';
import { usePermission } from '../../hooks/usePermission';
import {
  getVisibleMenuItems,
  type SidebarMenuItem,
} from '../../utils/sidebarAccess';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Megaphone,
  Users2,
  CalendarDays,
  FileCheck2,
  Rocket,
  BarChart3,
  UserCog,
  Settings,
  Globe,
  LogOut,
  KeyRound,
  User,
} from 'lucide-react';

// BỘ CHỨC NĂNG CỐT LÕI TINH GỌN - CHUẨN ATS DOANH NGHIỆP
const coreMenuItems: (SidebarMenuItem & { iconComponent: React.ComponentType<{ className?: string }> })[] = [
  {
    label: 'Bảng điều khiển',
    to: '/dashboard',
    icon: '📊',
    iconComponent: LayoutDashboard,
    roles: Object.values(ROLES),
  },
  {
    label: 'Yêu cầu tuyển dụng',
    to: '/jobs',
    icon: '📝',
    iconComponent: FileSpreadsheet,
    roles: Object.values(ROLES),
    permissions: ['REQUISITIONS_READ_ALL', 'REQUISITIONS_READ_SCOPED'],
  },
  {
    label: 'Tin tuyển dụng',
    to: '/job-postings',
    icon: '📢',
    iconComponent: Megaphone,
    roles: Object.values(ROLES),
    permissions: ['JOB_POSTINGS_READ_ALL', 'JOB_POSTINGS_READ_SCOPED'],
  },
  {
    label: 'Quản lý ứng viên',
    to: '/candidates',
    icon: '👥',
    iconComponent: Users2,
    roles: Object.values(ROLES),
    permissions: ['CANDIDATES_READ_ALL', 'CANDIDATES_READ_SCOPED'],
  },
  {
    label: 'Lịch phỏng vấn',
    to: '/interviews',
    icon: '📅',
    iconComponent: CalendarDays,
    roles: Object.values(ROLES),
    permissions: ['INTERVIEWS_READ_ALL', 'INTERVIEWS_READ_SCOPED'],
  },
  {
    label: 'Phê duyệt Offer',
    to: '/offers/approval',
    icon: '📜',
    iconComponent: FileCheck2,
    roles: [
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.HIRING_MANAGER,
      ROLES.APPROVER,
      ROLES.RECRUITER,
    ],
  },
  {
    label: 'Tiếp nhận nhân sự',
    to: '/onboarding/tracking',
    icon: '🚀',
    iconComponent: Rocket,
    roles: [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.RECRUITER, ROLES.HIRING_MANAGER],
    permissions: ['ORGANIZATION_READ_ALL'],
  },
  {
    label: 'Báo cáo thống kê',
    to: '/reports/funnel',
    icon: '📉',
    iconComponent: BarChart3,
    roles: Object.values(ROLES),
  },
  {
    label: 'Quản lý người dùng',
    to: '/users',
    icon: '👤',
    iconComponent: UserCog,
    roles: [ROLES.ADMIN, ROLES.HR_MANAGER],
    permissions: ['USER_ADMIN_READ_ALL'],
  },
  {
    label: 'Cài đặt hệ thống',
    to: '/settings/departments',
    icon: '⚙️',
    iconComponent: Settings,
    roles: [ROLES.ADMIN, ROLES.HR_MANAGER],
    permissions: ['ORGANIZATION_READ_ALL'],
  },
];

const isRole = (role: string): role is Role => Object.hasOwn(ROLE_NAMES, role);

export const Sidebar: FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const user = tokenService.getUserData();
  const { permissions } = usePermission();
  const userRoles = user?.roles ?? [];

  // Lọc menu cốt lõi theo quyền và vai trò
  const visibleMenu = useMemo(() => {
    return getVisibleMenuItems(coreMenuItems, userRoles, permissions) as typeof coreMenuItems;
  }, [userRoles, permissions]);

  const displayName = user?.fullName || user?.email || 'Người dùng';
  const roleLabel =
    userRoles.length > 0
      ? userRoles.map((role) => (isRole(role) ? ROLE_NAMES[role] : role)).join(', ')
      : 'Khách';

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error: unknown) {
      console.error('Logout API failed', error);
    } finally {
      tokenService.clearAll();
      window.dispatchEvent(new Event('auth:changed'));
      navigate('/login');
    }
  };

  return (
    <>
      {/* Mobile Top Header Toggle */}
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-black text-sm">
              🏢
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-tight">Smart Recruitment</p>
              <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{displayName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-base text-slate-700 hover:bg-slate-100"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
          aria-label="Close menu"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={[
          'fixed left-0 top-0 z-40 w-64 h-full flex flex-col bg-slate-900 text-white shadow-2xl transition-transform duration-200',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'md:static md:translate-x-0 md:shrink-0',
        ].join(' ')}
      >
        {/* Brand Logo Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-lg font-black shadow-md shadow-indigo-600/30">
              🏢
            </div>
            <div>
              <p className="text-sm font-black tracking-tight text-white leading-none">
                Smart Recruitment
              </p>
              <p className="text-[10px] font-medium text-slate-400 mt-1">
                Tuyển Dụng Doanh Nghiệp
              </p>
            </div>
          </div>
        </div>

        {/* User Info Strip */}
        <div className="shrink-0 border-b border-slate-800 bg-slate-900/80 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-xs font-black shadow-md">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-100">{displayName}</p>
              <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-wider text-blue-400">
                {roleLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Core Menu Items List (Gọn gàng, vừa khít 1 màn hình, không phải cuộn) */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {visibleMenu.map((item) => {
            const Icon = item.iconComponent;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => [
                  'group flex items-center rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all',
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/90 hover:text-white',
                ].join(' ')}
              >
                <Icon className="mr-3 h-4 w-4 shrink-0 text-slate-400 group-hover:text-blue-300 transition-colors" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Quick Tools & Bottom Actions */}
        <div className="shrink-0 border-t border-slate-800 bg-slate-950 p-3 space-y-2">
          {/* Link nhanh tới Cổng việc làm công khai */}
          <NavLink
            to="/careers"
            target="_blank"
            className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/60 px-3 py-2 text-[11px] font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <span className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-blue-400" />
              <span>Cổng việc làm ngoài</span>
            </span>
            <span className="text-slate-500 text-xs">↗</span>
          </NavLink>

          {/* Hàng nút cá nhân: Hồ sơ & Đổi mật khẩu */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <NavLink
              to="/profile"
              title="Xem hồ sơ cá nhân"
              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-800/80 bg-slate-900 py-1.5 text-[11px] font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <User className="h-3 w-3" />
              <span>Hồ sơ</span>
            </NavLink>
            <NavLink
              to="/change-password"
              title="Đổi mật khẩu tài khoản"
              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-800/80 bg-slate-900 py-1.5 text-[11px] font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <KeyRound className="h-3 w-3" />
              <span>Mật khẩu</span>
            </NavLink>
          </div>

          {/* Nút Đăng xuất */}
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 border border-slate-800/90 px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-rose-600 hover:border-rose-600 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
