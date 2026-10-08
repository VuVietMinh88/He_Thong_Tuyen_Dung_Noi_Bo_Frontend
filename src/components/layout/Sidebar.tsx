import { useState, type FC } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ROLES, ROLE_NAMES, type Role } from '../../constants/roles';
import { authService } from '../../services/auth.service';
import { tokenService } from '../../services/token.service';
import {
  getVisibleMenuItems,
  type SidebarMenuItem,
} from '../../utils/sidebarAccess';

const menuItems: SidebarMenuItem[] = [
  {
    label: 'Bảng điều khiển',
    to: '/dashboard',
    icon: '📊',
    roles: Object.values(ROLES),
  },
  {
    label: 'Quản lý tài khoản',
    to: '/users',
    icon: '👥',
    roles: [ROLES.ADMIN],
  },
  {
    label: 'Đăng tuyển dụng',
    to: '/jobs',
    icon: '📝',
    roles: [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.RECRUITER],
  },
  {
    label: 'Quản lý CV / Ứng viên',
    to: '/candidates',
    icon: '📄',
    roles: [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.RECRUITER, ROLES.HIRING_MANAGER],
  },
  {
    label: 'Lịch phỏng vấn',
    to: '/interviews',
    icon: '📅',
    roles: [
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.RECRUITER,
      ROLES.HIRING_MANAGER,
      ROLES.INTERVIEWER,
    ],
  },
  {
    label: 'Hồ sơ cá nhân',
    to: '/profile',
    icon: '👤',
    roles: [
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.RECRUITER,
      ROLES.HIRING_MANAGER,
      ROLES.INTERVIEWER,
      ROLES.APPROVER,
    ],
  },
];

const isRole = (role: string): role is Role => Object.hasOwn(ROLE_NAMES, role);

const Sidebar: FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const user = tokenService.getUserData();
  const userRoles = user?.roles ?? [];
  const visibleMenu = getVisibleMenuItems(menuItems, userRoles);
  const displayName = user?.fullName || user?.email || 'Người dùng';
  const roleLabel = userRoles.length > 0
    ? userRoles.map((role) => isRole(role) ? ROLE_NAMES[role] : role).join(', ')
    : 'Khách';

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error: unknown) {
      console.error('Logout API failed', error);
    } finally {
      tokenService.clearAll();
      navigate('/login');
    }
  };

  return (
    <>
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-sm md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">Smart Recruitment</p>
            <p className="text-[11px] text-slate-500">{displayName}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-lg text-slate-700 hover:bg-slate-100"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            ☰
          </button>
        </div>
      </div>

      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          aria-label="Close menu"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={[
          'fixed left-0 top-0 z-40 flex h-screen w-72 flex-col bg-slate-900 text-white shadow-xl transition-transform',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'md:static md:translate-x-0 md:flex-shrink-0',
        ].join(' ')}
      >
        <div className="flex h-16 shrink-0 items-center justify-center border-b border-slate-800 bg-slate-950 px-4">
          <span className="truncate bg-gradient-to-r from-blue-400 to-teal-300 bg-clip-text text-xl font-bold text-transparent">
            Smart Recruitment
          </span>
        </div>

        <div className="shrink-0 border-b border-slate-800 bg-slate-800/50 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-lg font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-200">{displayName}</p>
              <p className="mt-0.5 truncate text-xs font-semibold uppercase tracking-wider text-blue-400">
                {roleLabel}
              </p>
            </div>
          </div>
        </div>

        <nav className="custom-scrollbar flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {visibleMenu.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) => [
                    'flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                  ].join(' ')}
                >
                  <span className="mr-3 text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-slate-800 bg-slate-950 p-4">
          <button
            type="button"
            className="w-full rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-red-600 hover:text-white"
            onClick={handleLogout}
          >
            Đăng xuất
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
