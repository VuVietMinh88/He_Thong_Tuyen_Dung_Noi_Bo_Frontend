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
  TrendingUp,
  Users2,
  Share2,
  CalendarDays,
  FileCheck2,
  Rocket,
  Filter,
  Target,
  Clock4,
  UserCog,
  Building,
  Briefcase,
  Puzzle,
  HelpCircle,
  Coins,
  Folders,
  FolderKanban,
  Timer,
  Mail,
  User,
  KeyRound,
  Bell,
  LogOut,
  ShieldAlert,
  Globe,
} from 'lucide-react';

// Cấu hình đầy đủ 100% chức năng theo 4 nhóm phân hệ trực quan, không bị rối
const allMenuItems: (SidebarMenuItem & { iconComponent?: React.ComponentType<{ className?: string }> })[] = [
  // -------------------------------------------------------------
  // 1. VẬN HÀNH TUYỂN DỤNG (RECRUITMENT OPERATIONS)
  // -------------------------------------------------------------
  {
    label: 'Bảng điều khiển',
    to: '/dashboard',
    icon: '📊',
    iconComponent: LayoutDashboard,
    group: 'Vận hành tuyển dụng',
    roles: Object.values(ROLES),
  },
  {
    label: 'Yêu cầu tuyển dụng',
    to: '/jobs',
    icon: '📝',
    iconComponent: FileSpreadsheet,
    group: 'Vận hành tuyển dụng',
    roles: Object.values(ROLES),
    permissions: ['REQUISITIONS_READ_ALL', 'REQUISITIONS_READ_SCOPED'],
  },
  {
    label: 'Chờ tôi phê duyệt',
    to: '/offers/approval',
    icon: '✓',
    iconComponent: FileCheck2,
    group: 'Vận hành tuyển dụng',
    roles: [
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.HIRING_MANAGER,
      ROLES.APPROVER,
      ROLES.RECRUITER,
    ],
  },
  {
    label: 'Luồng phê duyệt',
    to: '/job-postings/review',
    icon: '⇄',
    iconComponent: ShieldAlert,
    group: 'Vận hành tuyển dụng',
    roles: Object.values(ROLES),
    permissions: ['REQUISITIONS_READ_ALL', 'REQUISITIONS_READ_SCOPED'],
  },
  {
    label: 'Tin tuyển dụng',
    to: '/job-postings',
    icon: '📢',
    iconComponent: Megaphone,
    group: 'Vận hành tuyển dụng',
    roles: Object.values(ROLES),
    permissions: ['JOB_POSTINGS_READ_ALL', 'JOB_POSTINGS_READ_SCOPED'],
  },
  {
    label: 'Tiến độ vị trí phòng ban',
    to: '/department/positions/progress',
    icon: '📈',
    iconComponent: TrendingUp,
    group: 'Vận hành tuyển dụng',
    roles: [ROLES.HIRING_MANAGER, ROLES.ADMIN, ROLES.HR_MANAGER],
    permissions: ['REQUISITIONS_READ_SCOPED'],
  },
  {
    label: 'Quản lý CV / Ứng viên',
    to: '/candidates',
    icon: '📄',
    iconComponent: Users2,
    group: 'Vận hành tuyển dụng',
    roles: Object.values(ROLES),
    permissions: ['CANDIDATES_READ_ALL', 'CANDIDATES_READ_SCOPED'],
  },
  {
    label: 'Lịch phỏng vấn',
    to: '/interviews',
    icon: '📅',
    iconComponent: CalendarDays,
    group: 'Vận hành tuyển dụng',
    roles: Object.values(ROLES),
    permissions: ['INTERVIEWS_READ_ALL', 'INTERVIEWS_READ_SCOPED'],
  },
  {
    label: 'Tiến độ tiếp nhận nhân sự',
    to: '/onboarding/tracking',
    icon: '🚀',
    iconComponent: Rocket,
    group: 'Vận hành tuyển dụng',
    roles: [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.RECRUITER, ROLES.HIRING_MANAGER],
    permissions: ['ORGANIZATION_READ_ALL'],
  },
  {
    label: 'Giới thiệu ứng viên',
    to: '/referrals',
    icon: '🤝',
    iconComponent: Share2,
    group: 'Vận hành tuyển dụng',
    roles: Object.values(ROLES),
  },

  // -------------------------------------------------------------
  // 2. BÁO CÁO & PHÂN TÍCH (ANALYTICS & REPORTS)
  // -------------------------------------------------------------
  {
    label: 'Báo cáo phễu tuyển dụng',
    to: '/reports/funnel',
    icon: '📉',
    iconComponent: Filter,
    group: 'Báo cáo & Phân tích',
    roles: Object.values(ROLES),
  },
  {
    label: 'Chất lượng nguồn ứng viên',
    to: '/reports/sources',
    icon: '🎯',
    iconComponent: Target,
    group: 'Báo cáo & Phân tích',
    roles: Object.values(ROLES),
  },
  {
    label: 'Thời gian & chi phí tuyển dụng',
    to: '/reports/time-cost',
    icon: '⏱️',
    iconComponent: Clock4,
    group: 'Báo cáo & Phân tích',
    roles: Object.values(ROLES),
  },

  // -------------------------------------------------------------
  // 3. DANH MỤC & CƠ CẤU TỔ CHỨC (MASTER DATA)
  // -------------------------------------------------------------
  {
    label: 'Phòng ban',
    to: '/settings/departments',
    icon: '🏢',
    iconComponent: Building,
    group: 'Danh mục & Cơ cấu',
    roles: Object.values(ROLES),
    permissions: ['ORGANIZATION_READ_ALL'],
  },
  {
    label: 'Chức danh',
    to: '/settings/positions',
    icon: '💼',
    iconComponent: Briefcase,
    group: 'Danh mục & Cơ cấu',
    roles: Object.values(ROLES),
    permissions: ['ORGANIZATION_READ_ALL'],
  },
  {
    label: 'Khung năng lực',
    to: '/settings/competency-frameworks',
    icon: '🧩',
    iconComponent: Puzzle,
    group: 'Danh mục & Cơ cấu',
    roles: Object.values(ROLES),
    permissions: ['ORGANIZATION_READ_ALL'],
  },
  {
    label: 'Ngân hàng câu hỏi',
    to: '/settings/interview-questions',
    icon: '❔',
    iconComponent: HelpCircle,
    group: 'Danh mục & Cơ cấu',
    roles: Object.values(ROLES),
    permissions: ['ORGANIZATION_READ_ALL'],
  },
  {
    label: 'Định biên & Ngân sách',
    to: '/headcount-budget',
    icon: '💰',
    iconComponent: Coins,
    group: 'Danh mục & Cơ cấu',
    roles: Object.values(ROLES),
    permissions: ['ORGANIZATION_READ_ALL'],
  },
  {
    label: 'Danh mục dùng chung',
    to: '/settings/master-data',
    icon: '🗂️',
    iconComponent: Folders,
    group: 'Danh mục & Cơ cấu',
    roles: Object.values(ROLES),
    permissions: ['ORGANIZATION_READ_ALL'],
  },
  {
    label: 'Danh mục tuyển dụng',
    to: '/settings/recruitment-catalogs',
    icon: '⚙️',
    iconComponent: FolderKanban,
    group: 'Danh mục & Cơ cấu',
    roles: Object.values(ROLES),
    permissions: ['ORGANIZATION_READ_ALL'],
  },
  {
    label: 'Cấu hình SLA',
    to: '/settings/sla',
    icon: '⏳',
    iconComponent: Timer,
    group: 'Danh mục & Cơ cấu',
    roles: [ROLES.ADMIN, ROLES.HR_MANAGER],
    permissions: ['ORGANIZATION_READ_ALL'],
  },
  {
    label: 'Mẫu email tuyển dụng',
    to: '/settings/email-templates',
    icon: '✉️',
    iconComponent: Mail,
    group: 'Danh mục & Cơ cấu',
    roles: [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.RECRUITER],
    permissions: ['ORGANIZATION_READ_ALL'],
  },

  // -------------------------------------------------------------
  // 4. HỆ THỐNG & CÁ NHÂN (SYSTEM & PERSONAL)
  // -------------------------------------------------------------
  {
    label: 'Quản lý tài khoản',
    to: '/users',
    icon: '👥',
    iconComponent: UserCog,
    group: 'Hệ thống & Cá nhân',
    roles: [ROLES.ADMIN, ROLES.HR_MANAGER],
    permissions: ['USER_ADMIN_READ_ALL'],
  },
  {
    label: 'Cổng tuyển dụng công khai',
    to: '/careers',
    icon: '↗️',
    iconComponent: Globe,
    group: 'Hệ thống & Cá nhân',
    roles: Object.values(ROLES),
  },
  {
    label: 'Giới thiệu công ty',
    to: '/company',
    icon: '🏢',
    iconComponent: Building,
    group: 'Hệ thống & Cá nhân',
    roles: Object.values(ROLES),
  },
  {
    label: 'Hồ sơ cá nhân',
    to: '/profile',
    icon: '👤',
    iconComponent: User,
    group: 'Hệ thống & Cá nhân',
    roles: Object.values(ROLES),
    permissions: ['SELF_PROFILE_READ'],
  },
  {
    label: 'Đổi mật khẩu',
    to: '/change-password',
    icon: '🔑',
    iconComponent: KeyRound,
    group: 'Hệ thống & Cá nhân',
    roles: Object.values(ROLES),
    permissions: ['SELF_SECURITY_WRITE'],
  },
  {
    label: 'Tùy chọn thông báo',
    to: '/settings/notifications',
    icon: '🔔',
    iconComponent: Bell,
    group: 'Hệ thống & Cá nhân',
    roles: Object.values(ROLES),
  },
];

const isRole = (role: string): role is Role => Object.hasOwn(ROLE_NAMES, role);

export const Sidebar: FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const user = tokenService.getUserData();
  const { permissions } = usePermission();
  const userRoles = user?.roles ?? [];

  // 1. Lọc menu theo quyền và vai trò
  const visibleMenu = useMemo(() => {
    return getVisibleMenuItems(allMenuItems, userRoles, permissions) as typeof allMenuItems;
  }, [userRoles, permissions]);

  // 2. Gom nhóm theo 4 Phân hệ lớn
  const groupedMenu = useMemo(() => {
    const groups: { groupName: string; items: typeof allMenuItems }[] = [];
    const groupOrder = [
      'Vận hành tuyển dụng',
      'Báo cáo & Phân tích',
      'Danh mục & Cơ cấu',
      'Hệ thống & Cá nhân',
    ];

    groupOrder.forEach((groupName) => {
      const items = visibleMenu.filter((item) => item.group === groupName);
      if (items.length > 0) {
        groups.push({ groupName, items });
      }
    });

    return groups;
  }, [visibleMenu]);

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
      {/* Mobile Topbar toggle */}
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

      {/* Main Sidebar */}
      <aside
        className={[
          'fixed left-0 top-0 z-40 w-68 h-full flex flex-col bg-slate-900 text-white shadow-2xl transition-transform duration-200',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'md:static md:translate-x-0 md:shrink-0',
        ].join(' ')}
      >
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center border-b border-slate-800 bg-slate-950 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-lg font-black shadow-md shadow-indigo-600/30">
              🏢
            </div>
            <div>
              <p className="text-sm font-black tracking-tight text-white leading-none">
                Smart Recruitment
              </p>
              <p className="text-[10px] font-medium text-slate-400 mt-1">
                Hệ thống tuyển dụng nội bộ
              </p>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="shrink-0 border-b border-slate-800 bg-slate-900/90 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-sm font-black shadow-md">
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

        {/* Navigation Menu (Chỉ 4 Phân hệ lớn, liền mạch, không rối mắt) */}
        <nav className="custom-scrollbar flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-4">
          {groupedMenu.map((group, groupIdx) => (
            <div key={group.groupName} className="space-y-1">
              {/* Tiêu đề nhóm nhã nhặn */}
              <div className={`px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400 select-none ${
                groupIdx > 0 ? 'pt-3 border-t border-slate-800/80' : 'pt-1'
              }`}>
                {group.groupName}
              </div>

              {/* Danh sách các chức năng trong nhóm */}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.iconComponent;

                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        onClick={() => setIsOpen(false)}
                        className={({ isActive }) => [
                          'group flex items-center rounded-xl px-3 py-2 text-xs font-semibold transition-all',
                          isActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                            : 'text-slate-300 hover:bg-slate-800/90 hover:text-white',
                        ].join(' ')}
                      >
                        {Icon ? (
                          <Icon className="mr-2.5 h-4 w-4 shrink-0 text-slate-400 group-hover:text-blue-300 transition-colors" />
                        ) : (
                          <span className="mr-2.5 text-base">{item.icon}</span>
                        )}
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Bottom Logout */}
        <div className="shrink-0 border-t border-slate-800 bg-slate-950 p-3">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-rose-600 hover:border-rose-600 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
