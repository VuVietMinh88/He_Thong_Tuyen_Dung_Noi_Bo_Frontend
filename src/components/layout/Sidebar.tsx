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
  Shield,
  FileSpreadsheet,
  Megaphone,
  TrendingUp,
  Users2,
  Share2,
  CalendarDays,
  CalendarCheck2,
  FileCheck2,
  Rocket,
  ClipboardList,
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
  MailCheck,
  User,
  KeyRound,
  Bell,
  ChevronDown,
  LogOut,
  Search,
} from 'lucide-react';

// Cấu hình đầy đủ tất cả các chức năng theo nhóm (Labels) khớp ảnh yêu cầu
const allMenuItems: (SidebarMenuItem & { iconComponent?: React.ComponentType<{ className?: string }> })[] = [
  // 1. TỔNG QUAN
  {
    label: 'Bảng điều khiển',
    to: '/dashboard',
    icon: '📊',
    iconComponent: LayoutDashboard,
    group: 'Tổng quan',
    roles: Object.values(ROLES),
  },
  {
    label: 'Cổng tuyển dụng công khai',
    to: '/careers',
    icon: '↗️',
    iconComponent: Rocket,
    group: 'Tổng quan',
    roles: Object.values(ROLES),
  },
  {
    label: 'Giới thiệu công ty',
    to: '/company',
    icon: '🏢',
    iconComponent: Building,
    group: 'Tổng quan',
    roles: Object.values(ROLES),
  },

  // 2. YÊU CẦU & PHÊ DUYỆT
  {
    label: 'Yêu cầu tuyển dụng',
    to: '/jobs',
    icon: '📝',
    iconComponent: FileSpreadsheet,
    group: 'Yêu cầu & Phê duyệt',
    roles: Object.values(ROLES),
    permissions: ['REQUISITIONS_READ_ALL', 'REQUISITIONS_READ_SCOPED'],
  },
  {
    label: 'Chờ tôi phê duyệt',
    to: '/offers/approval',
    icon: '✓',
    iconComponent: FileCheck2,
    group: 'Yêu cầu & Phê duyệt',
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
    iconComponent: Shield,
    group: 'Yêu cầu & Phê duyệt',
    roles: Object.values(ROLES),
    permissions: ['REQUISITIONS_READ_ALL', 'REQUISITIONS_READ_SCOPED'],
  },
  {
    label: 'Tin tuyển dụng',
    to: '/job-postings',
    icon: '📢',
    iconComponent: Megaphone,
    group: 'Yêu cầu & Phê duyệt',
    roles: Object.values(ROLES),
    permissions: ['JOB_POSTINGS_READ_ALL', 'JOB_POSTINGS_READ_SCOPED'],
  },
  {
    label: 'Tiến độ vị trí phòng ban',
    to: '/department/positions/progress',
    icon: '📈',
    iconComponent: TrendingUp,
    group: 'Yêu cầu & Phê duyệt',
    roles: [ROLES.HIRING_MANAGER],
    permissions: ['REQUISITIONS_READ_SCOPED'],
  },

  // 3. QUẢN LÝ ỨNG VIÊN
  {
    label: 'Quản lý CV / Ứng viên',
    to: '/candidates',
    icon: '📄',
    iconComponent: Users2,
    group: 'Quản lý ứng viên',
    roles: Object.values(ROLES),
    permissions: ['CANDIDATES_READ_ALL', 'CANDIDATES_READ_SCOPED'],
  },
  {
    label: 'Giới thiệu ứng viên',
    to: '/referrals',
    icon: '🤝',
    iconComponent: Share2,
    group: 'Quản lý ứng viên',
    roles: Object.values(ROLES),
  },

  // 4. PHỎNG VẤN & ĐÁNH GIÁ
  {
    label: 'Lịch phỏng vấn',
    to: '/interviews',
    icon: '📅',
    iconComponent: CalendarDays,
    group: 'Phỏng vấn & Đánh giá',
    roles: Object.values(ROLES),
    permissions: ['INTERVIEWS_READ_ALL', 'INTERVIEWS_READ_SCOPED'],
  },
  {
    label: 'Lịch cá nhân phỏng vấn',
    to: '/interviewer/calendar',
    icon: '🗓️',
    iconComponent: CalendarCheck2,
    group: 'Phỏng vấn & Đánh giá',
    roles: Object.values(ROLES),
    permissions: ['INTERVIEWS_READ_ALL', 'INTERVIEWS_READ_SCOPED'],
  },

  // 5. ONBOARDING & TIẾP NHẬN
  {
    label: 'Tiến độ tiếp nhận nhân sự',
    to: '/onboarding/tracking',
    icon: '🚀',
    iconComponent: Rocket,
    group: 'Tiếp nhận Onboarding',
    roles: [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.RECRUITER, ROLES.HIRING_MANAGER],
    permissions: ['ORGANIZATION_READ_ALL'],
  },
  {
    label: 'Mẫu Checklist tiếp nhận',
    to: '/onboarding/checklist-templates',
    icon: '📋',
    iconComponent: ClipboardList,
    group: 'Tiếp nhận Onboarding',
    roles: [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.RECRUITER],
    permissions: ['ORGANIZATION_READ_ALL'],
  },

  // 6. BÁO CÁO & PHÂN TÍCH
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

  // 7. DANH MỤC & CƠ CẤU
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
  {
    label: 'Lịch sử gửi email',
    to: '/candidates/email-audit-logs',
    icon: '📨',
    iconComponent: MailCheck,
    group: 'Danh mục & Cơ cấu',
    roles: [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.RECRUITER],
    permissions: ['CANDIDATES_READ_ALL', 'CANDIDATES_READ_SCOPED'],
  },

  // 8. QUẢN TRỊ HỆ THỐNG
  {
    label: 'Quản lý tài khoản',
    to: '/users',
    icon: '👥',
    iconComponent: UserCog,
    group: 'Quản trị hệ thống',
    roles: [ROLES.ADMIN, ROLES.HR_MANAGER],
    permissions: ['USER_ADMIN_READ_ALL'],
  },
  {
    label: 'Bảng điều khiển quản trị',
    to: '/admin/dashboard',
    icon: '🛡️',
    iconComponent: Shield,
    group: 'Quản trị hệ thống',
    roles: [ROLES.ADMIN],
  },

  // 9. TÀI KHOẢN CÁ NHÂN
  {
    label: 'Hồ sơ cá nhân',
    to: '/profile',
    icon: '👤',
    iconComponent: User,
    group: 'Tài khoản cá nhân',
    roles: [
      ROLES.ADMIN,
      ROLES.HR_MANAGER,
      ROLES.RECRUITER,
      ROLES.HIRING_MANAGER,
      ROLES.INTERVIEWER,
      ROLES.APPROVER,
    ],
    permissions: ['SELF_PROFILE_READ'],
  },
  {
    label: 'Đổi mật khẩu',
    to: '/change-password',
    icon: '🔑',
    iconComponent: KeyRound,
    group: 'Tài khoản cá nhân',
    roles: Object.values(ROLES),
    permissions: ['SELF_SECURITY_WRITE'],
  },
  {
    label: 'Tùy chọn thông báo',
    to: '/settings/notifications',
    icon: '🔔',
    iconComponent: Bell,
    group: 'Tài khoản cá nhân',
    roles: Object.values(ROLES),
  },
];

const isRole = (role: string): role is Role => Object.hasOwn(ROLE_NAMES, role);

export const Sidebar: FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const navigate = useNavigate();
  const user = tokenService.getUserData();
  const { permissions } = usePermission();
  const userRoles = user?.roles ?? [];

  // 1. Lọc menu theo quyền và vai trò
  const visibleMenu = useMemo(() => {
    return getVisibleMenuItems(allMenuItems, userRoles, permissions) as typeof allMenuItems;
  }, [userRoles, permissions]);

  // 2. Lọc nhanh theo ô tìm kiếm
  const filteredMenu = useMemo(() => {
    if (!searchQuery.trim()) return visibleMenu;
    const q = searchQuery.toLowerCase().trim();
    return visibleMenu.filter(
      (item) => item.label.toLowerCase().includes(q) || item.group?.toLowerCase().includes(q)
    );
  }, [visibleMenu, searchQuery]);

  // 3. Gom nhóm theo Group Label
  const groupedMenu = useMemo(() => {
    const groups: { groupName: string; items: typeof allMenuItems }[] = [];
    const map = new Map<string, typeof allMenuItems>();

    filteredMenu.forEach((item) => {
      const g = item.group || 'Chức năng khác';
      if (!map.has(g)) {
        map.set(g, []);
      }
      map.get(g)!.push(item);
    });

    map.forEach((items, groupName) => {
      if (items.length > 0) {
        groups.push({ groupName, items });
      }
    });

    return groups;
  }, [filteredMenu]);

  const toggleGroupCollapse = (groupName: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

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
      {/* Mobile Sticky Header */}
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-black text-sm">
              🏢
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-tight">Tuyển Dụng Nội Bộ</p>
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

      {/* Main Sidebar Container */}
      <aside
        className={[
          'fixed left-0 top-0 z-40 w-72 h-full flex flex-col bg-slate-900 text-white shadow-2xl transition-transform duration-200',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'md:static md:translate-x-0 md:shrink-0',
        ].join(' ')}
      >
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white text-base font-black shadow-md">
              🏢
            </div>
            <div>
              <p className="text-sm font-black tracking-tight text-white leading-none">
                TUYỂN DỤNG NỘI BỘ
              </p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-400 mt-1">
                Enterprise ATS Portal
              </p>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="shrink-0 border-b border-slate-800/80 bg-slate-900/60 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-black shadow-md">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-100">{displayName}</p>
              <p className="mt-0.5 truncate text-[10px] font-semibold tracking-wide text-indigo-300">
                {roleLabel}
              </p>
            </div>
          </div>

          {/* Quick Menu Filter Input */}
          <div className="mt-3 relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm nhanh chức năng..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:bg-slate-950"
            />
          </div>
        </div>

        {/* Navigation Menu (Grouped with Section Labels) */}
        <nav className="custom-scrollbar flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-4">
          {groupedMenu.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              Không tìm thấy chức năng phù hợp.
            </div>
          ) : (
            groupedMenu.map((group) => {
              const isCollapsed = Boolean(collapsedGroups[group.groupName]);

              return (
                <div key={group.groupName} className="space-y-1">
                  {/* Group Section Header (Label) */}
                  <button
                    type="button"
                    onClick={() => toggleGroupCollapse(group.groupName)}
                    className="w-full flex items-center justify-between px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-200 transition select-none group"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-indigo-500" />
                      {group.groupName}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-semibold text-slate-500 group-hover:text-slate-400">
                        {group.items.length}
                      </span>
                      <ChevronDown
                        className={`h-3 w-3 text-slate-500 transition-transform duration-150 ${
                          isCollapsed ? '-rotate-90' : 'rotate-0'
                        }`}
                      />
                    </div>
                  </button>

                  {/* Group Menu Items */}
                  {!isCollapsed && (
                    <ul className="space-y-0.5 pt-0.5">
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
                                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white',
                              ].join(' ')}
                            >
                              {Icon ? (
                                <Icon className="mr-2.5 h-4 w-4 shrink-0 text-slate-400 group-hover:text-indigo-300 transition-colors" />
                              ) : (
                                <span className="mr-2.5 text-sm">{item.icon}</span>
                              )}
                              <span className="truncate">{item.label}</span>
                            </NavLink>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })
          )}
        </nav>

        {/* Footer Logout */}
        <div className="shrink-0 border-t border-slate-800 bg-slate-950 p-3">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-bold text-slate-300 transition hover:bg-rose-600/90 hover:border-rose-600 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Đăng xuất phiên làm việc</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
