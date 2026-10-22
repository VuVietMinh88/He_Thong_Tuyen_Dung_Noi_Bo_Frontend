import { useState, useMemo, useEffect, type FC } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  ShieldCheck,
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
  Shield,
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
  Globe,
  LogOut,
  Folder,
  FolderOpen,
  Search,
  ChevronsUpDown,
} from 'lucide-react';

interface MenuFolderGroup {
  id: string;
  name: string;
  category: string;
  tag: {
    label: string;
    style: string;
  };
  icon: React.ComponentType<{ className?: string }>;
  items: (SidebarMenuItem & {
    iconComponent?: React.ComponentType<{ className?: string }>;
    detailHint?: string;
  })[];
}

// CẤU HÌNH ĐẦY ĐỦ CHI TIẾT - ĐÓNG CÁC THƯ MỤC VÀO THÀNH LABEL CÁC THẺ YÊU CẦU VÀ CẦN THIẾT
const menuFolderGroups: MenuFolderGroup[] = [
  // ================= 1. NHÓM THẺ YÊU CẦU & CẦN THIẾT (CỐT LÕI) =================
  {
    id: 'recruitment',
    name: 'Yêu cầu & Tin tuyển dụng',
    category: 'YÊU CẦU & CẦN THIẾT',
    tag: {
      label: 'Yêu cầu',
      style: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    icon: FileSpreadsheet,
    items: [
      {
        label: 'Yêu cầu tuyển dụng',
        to: '/jobs',
        icon: '📝',
        iconComponent: FileSpreadsheet,
        roles: Object.values(ROLES),
        permissions: ['REQUISITIONS_READ_ALL', 'REQUISITIONS_READ_SCOPED'],
        detailHint: 'Tạo & theo dõi phiếu yêu cầu tuyển',
      },
      {
        label: 'Tin tuyển dụng',
        to: '/job-postings',
        icon: '📢',
        iconComponent: Megaphone,
        roles: Object.values(ROLES),
        permissions: ['JOB_POSTINGS_READ_ALL', 'JOB_POSTINGS_READ_SCOPED'],
        detailHint: 'Soạn thảo và đăng tin tuyển dụng',
      },
      {
        label: 'Tiến độ vị trí phòng ban',
        to: '/department/positions/progress',
        icon: '📈',
        iconComponent: TrendingUp,
        roles: [ROLES.HIRING_MANAGER, ROLES.ADMIN, ROLES.HR_MANAGER],
        permissions: ['REQUISITIONS_READ_SCOPED'],
        detailHint: 'Theo dõi tiến độ tuyển dụng bộ phận',
      },
      {
        label: 'Luồng phê duyệt tin',
        to: '/job-postings/review',
        icon: '⇄',
        iconComponent: ShieldCheck,
        roles: Object.values(ROLES),
        permissions: ['REQUISITIONS_READ_ALL', 'REQUISITIONS_READ_SCOPED'],
        detailHint: 'Thẩm định duyệt tin đăng tuyển',
      },
    ],
  },
  {
    id: 'candidates',
    name: 'Ứng viên & Phỏng vấn',
    category: 'YÊU CẦU & CẦN THIẾT',
    tag: {
      label: 'Cần thiết',
      style: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
    icon: Users2,
    items: [
      {
        label: 'Hồ sơ ứng viên & Pipeline',
        to: '/candidates',
        icon: '👥',
        iconComponent: Users2,
        roles: Object.values(ROLES),
        permissions: ['CANDIDATES_READ_ALL', 'CANDIDATES_READ_SCOPED'],
        detailHint: 'Tiếp nhận, lọc CV và luân chuyển phễu',
      },
      {
        label: 'Giới thiệu ứng viên',
        to: '/referrals',
        icon: '🤝',
        iconComponent: Share2,
        roles: Object.values(ROLES),
        detailHint: 'Chính sách thưởng giới thiệu nội bộ',
      },
      {
        label: 'Lịch phỏng vấn toàn ban',
        to: '/interviews',
        icon: '📅',
        iconComponent: CalendarDays,
        roles: Object.values(ROLES),
        permissions: ['INTERVIEWS_READ_ALL', 'INTERVIEWS_READ_SCOPED'],
        detailHint: 'Quản lý lịch phòng ban & hội đồng',
      },
      {
        label: 'Lịch cá nhân phỏng vấn',
        to: '/interviewer/calendar',
        icon: '🗓️',
        iconComponent: CalendarCheck2,
        roles: Object.values(ROLES),
        permissions: ['INTERVIEWS_READ_ALL', 'INTERVIEWS_READ_SCOPED'],
        detailHint: 'Lịch phỏng vấn phân công cho bạn',
      },
    ],
  },
  {
    id: 'offer-onboarding',
    name: 'Offer & Onboarding',
    category: 'YÊU CẦU & CẦN THIẾT',
    tag: {
      label: 'Cần thiết',
      style: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    icon: FileCheck2,
    items: [
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
        detailHint: 'Duyệt lương thưởng và gửi thư mời',
      },
      {
        label: 'Tiến độ tiếp nhận nhân sự',
        to: '/onboarding/tracking',
        icon: '🚀',
        iconComponent: Rocket,
        roles: [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.RECRUITER, ROLES.HIRING_MANAGER],
        permissions: ['ORGANIZATION_READ_ALL'],
        detailHint: 'Theo dõi thủ tục nhận việc nhân viên mới',
      },
      {
        label: 'Mẫu Checklist tiếp nhận',
        to: '/onboarding/checklist-templates',
        icon: '📋',
        iconComponent: ClipboardList,
        roles: [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.RECRUITER],
        permissions: ['ORGANIZATION_READ_ALL'],
        detailHint: 'Bộ danh mục checklist chuẩn bị hội nhập',
      },
    ],
  },

  // ================= 2. BÁO CÁO & THEO DÕI =================
  {
    id: 'reports',
    name: 'Báo cáo & Phân tích',
    category: 'THEO DÕI & ĐO LƯỜNG',
    tag: {
      label: 'Báo cáo',
      style: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
    icon: Filter,
    items: [
      {
        label: 'Báo cáo phễu tuyển dụng',
        to: '/reports/funnel',
        icon: '📉',
        iconComponent: Filter,
        roles: Object.values(ROLES),
        detailHint: 'Tỷ lệ chuyển đổi qua các vòng tuyển dụng',
      },
      {
        label: 'Chất lượng nguồn ứng viên',
        to: '/reports/sources',
        icon: '🎯',
        iconComponent: Target,
        roles: Object.values(ROLES),
        detailHint: 'Hiệu quả nguồn: Website, LinkedIn, TopCV...',
      },
      {
        label: 'Thời gian & chi phí tuyển dụng',
        to: '/reports/time-cost',
        icon: '⏱️',
        iconComponent: Clock4,
        roles: Object.values(ROLES),
        detailHint: 'Time-to-hire và chi phí trung bình',
      },
    ],
  },

  // ================= 3. THIẾT LẬP & QUẢN TRỊ HỆ THỐNG =================
  {
    id: 'master-data',
    name: 'Danh mục & Cơ cấu',
    category: 'THIẾT LẬP & QUẢN TRỊ',
    tag: {
      label: 'Cấu hình',
      style: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    },
    icon: Building,
    items: [
      {
        label: 'Phòng ban',
        to: '/settings/departments',
        icon: '🏢',
        iconComponent: Building,
        roles: Object.values(ROLES),
        permissions: ['ORGANIZATION_READ_ALL'],
        detailHint: 'Cơ cấu sơ đồ tổ chức phòng ban',
      },
      {
        label: 'Chức danh công việc',
        to: '/settings/positions',
        icon: '💼',
        iconComponent: Briefcase,
        roles: Object.values(ROLES),
        permissions: ['ORGANIZATION_READ_ALL'],
        detailHint: 'Vị trí công việc & mô tả công việc (JD)',
      },
      {
        label: 'Khung năng lực',
        to: '/settings/competency-frameworks',
        icon: '🧩',
        iconComponent: Puzzle,
        roles: Object.values(ROLES),
        permissions: ['ORGANIZATION_READ_ALL'],
        detailHint: 'Tiêu chí đánh giá chuyên môn & kỹ năng',
      },
      {
        label: 'Ngân hàng câu hỏi',
        to: '/settings/interview-questions',
        icon: '❔',
        iconComponent: HelpCircle,
        roles: Object.values(ROLES),
        permissions: ['ORGANIZATION_READ_ALL'],
        detailHint: 'Bộ câu hỏi phỏng vấn chuẩn hóa',
      },
      {
        label: 'Định biên & Ngân sách',
        to: '/headcount-budget',
        icon: '💰',
        iconComponent: Coins,
        roles: Object.values(ROLES),
        permissions: ['ORGANIZATION_READ_ALL'],
        detailHint: 'Kế hoạch ngân sách & chỉ tiêu số lượng',
      },
      {
        label: 'Danh mục dùng chung',
        to: '/settings/master-data',
        icon: '🗂️',
        iconComponent: Folders,
        roles: Object.values(ROLES),
        permissions: ['ORGANIZATION_READ_ALL'],
        detailHint: 'Trạng thái, học vấn, kinh nghiệm...',
      },
      {
        label: 'Danh mục tuyển dụng',
        to: '/settings/recruitment-catalogs',
        icon: '📁',
        iconComponent: FolderKanban,
        roles: Object.values(ROLES),
        permissions: ['ORGANIZATION_READ_ALL'],
        detailHint: 'Lý do từ chối, giai đoạn phỏng vấn...',
      },
      {
        label: 'Cấu hình SLA',
        to: '/settings/sla',
        icon: '⏳',
        iconComponent: Timer,
        roles: [ROLES.ADMIN, ROLES.HR_MANAGER],
        permissions: ['ORGANIZATION_READ_ALL'],
        detailHint: 'Thời hạn xử lý hồ sơ từng vòng',
      },
      {
        label: 'Mẫu email tuyển dụng',
        to: '/settings/email-templates',
        icon: '✉️',
        iconComponent: Mail,
        roles: [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.RECRUITER],
        permissions: ['ORGANIZATION_READ_ALL'],
        detailHint: 'Email mời PV, trúng tuyển, từ chối...',
      },
    ],
  },
  {
    id: 'system',
    name: 'Quản trị hệ thống',
    category: 'THIẾT LẬP & QUẢN TRỊ',
    tag: {
      label: 'Quản trị',
      style: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    icon: UserCog,
    items: [
      {
        label: 'Quản lý tài khoản',
        to: '/users',
        icon: '👥',
        iconComponent: UserCog,
        roles: [ROLES.ADMIN, ROLES.HR_MANAGER],
        permissions: ['USER_ADMIN_READ_ALL'],
        detailHint: 'Danh sách nhân sự & phân quyền hệ thống',
      },
      {
        label: 'Bảng điều khiển quản trị',
        to: '/admin/dashboard',
        icon: '🛡️',
        iconComponent: Shield,
        roles: [ROLES.ADMIN],
        detailHint: 'Thống kê tổng quan quyền lực Admin',
      },
      {
        label: 'Lịch sử gửi email',
        to: '/candidates/email-audit-logs',
        icon: '📨',
        iconComponent: MailCheck,
        roles: [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.RECRUITER],
        permissions: ['CANDIDATES_READ_ALL', 'CANDIDATES_READ_SCOPED'],
        detailHint: 'Nhật ký audit log thông báo đã gửi',
      },
    ],
  },
  {
    id: 'personal',
    name: 'Tài khoản cá nhân',
    category: 'THIẾT LẬP & QUẢN TRỊ',
    tag: {
      label: 'Cá nhân',
      style: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    },
    icon: User,
    items: [
      {
        label: 'Hồ sơ cá nhân',
        to: '/profile',
        icon: '👤',
        iconComponent: User,
        roles: Object.values(ROLES),
        permissions: ['SELF_PROFILE_READ'],
        detailHint: 'Thông tin tài khoản đăng nhập hiện tại',
      },
      {
        label: 'Đổi mật khẩu',
        to: '/change-password',
        icon: '🔑',
        iconComponent: KeyRound,
        roles: Object.values(ROLES),
        permissions: ['SELF_SECURITY_WRITE'],
        detailHint: 'Cập nhật mật khẩu bảo mật tài khoản',
      },
      {
        label: 'Tùy chọn thông báo',
        to: '/settings/notifications',
        icon: '🔔',
        iconComponent: Bell,
        roles: Object.values(ROLES),
        detailHint: 'Cài đặt nhận chuông thông báo & email',
      },
    ],
  },
];

const isRole = (role: string): role is Role => Object.hasOwn(ROLE_NAMES, role);

export const Sidebar: FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const user = tokenService.getUserData();
  const { permissions } = usePermission();
  const userRoles = user?.roles ?? [];

  // Trạng thái đóng/mở của từng Thẻ Thư mục (Mặc định đóng để gọn gàng)
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

  // 1. Lọc và chuẩn bị danh sách thư mục hiển thị theo quyền
  const visibleFolderGroups = useMemo(() => {
    return menuFolderGroups
      .map((folder) => {
        const visibleItems = getVisibleMenuItems(
          folder.items,
          userRoles,
          permissions
        ) as typeof folder.items;

        // Nếu có tìm kiếm -> Lọc theo từ khóa
        const filteredItems = searchQuery.trim()
          ? visibleItems.filter((item) =>
              item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (item.detailHint && item.detailHint.toLowerCase().includes(searchQuery.toLowerCase()))
            )
          : visibleItems;

        return {
          ...folder,
          items: filteredItems,
        };
      })
      .filter((folder) => folder.items.length > 0);
  }, [userRoles, permissions, searchQuery]);

  // Nhóm các thư mục theo Danh mục lớn để chia thẻ
  const categories = useMemo(() => {
    const map = new Map<string, typeof visibleFolderGroups>();
    visibleFolderGroups.forEach((folder) => {
      const list = map.get(folder.category) || [];
      list.push(folder);
      map.set(folder.category, list);
    });
    return Array.from(map.entries());
  }, [visibleFolderGroups]);

  // 2. Tự động mở thư mục nếu người dùng đang ở trang con hoặc khi đang tìm kiếm
  useEffect(() => {
    const foldersToOpen: string[] = [];
    visibleFolderGroups.forEach((folder) => {
      const isCurrentRouteInFolder = folder.items.some(
        (item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
      );
      if (isCurrentRouteInFolder || searchQuery.trim().length > 0) {
        foldersToOpen.push(folder.id);
      }
    });

    if (foldersToOpen.length > 0) {
      setOpenFolders((prev) => {
        let hasChange = false;
        const next = { ...prev };
        foldersToOpen.forEach((id) => {
          if (!next[id]) {
            next[id] = true;
            hasChange = true;
          }
        });
        return hasChange ? next : prev;
      });
    }
  }, [location.pathname, searchQuery, visibleFolderGroups]);

  // Chuyển đổi trạng thái đóng / mở thẻ thư mục
  const toggleFolder = (folderId: string) => {
    setOpenFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  // Nút mở tất cả hoặc đóng tất cả thẻ
  const allOpen = useMemo(() => {
    if (visibleFolderGroups.length === 0) return false;
    return visibleFolderGroups.every((f) => openFolders[f.id]);
  }, [visibleFolderGroups, openFolders]);

  const toggleAllFolders = () => {
    const nextState = !allOpen;
    const updated: Record<string, boolean> = {};
    visibleFolderGroups.forEach((f) => {
      updated[f.id] = nextState;
    });
    setOpenFolders(updated);
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

      {/* Main Sidebar */}
      <aside
        className={[
          'fixed left-0 top-0 z-40 w-72 h-full flex flex-col bg-slate-900 text-white shadow-2xl transition-transform duration-200',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'md:static md:translate-x-0 md:shrink-0',
        ].join(' ')}
      >
        {/* Brand Logo Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-4">
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

        {/* User Info Strip */}
        <div className="shrink-0 border-b border-slate-800 bg-slate-900/90 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-xs font-black shadow-md">
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

        {/* Control Toolbar: Tìm kiếm chức năng & Nút Đóng/Mở tất cả */}
        <div className="shrink-0 border-b border-slate-800/80 bg-slate-950/60 px-3 py-2 space-y-1.5">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm nhanh chức năng..."
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span className="font-medium">
              {searchQuery ? `Tìm thấy kết quả` : `Thư mục chức năng`}
            </span>
            <button
              type="button"
              onClick={toggleAllFolders}
              className="inline-flex items-center gap-1 hover:text-white transition font-semibold text-[10px] bg-slate-800/80 hover:bg-slate-700/80 px-2 py-0.5 rounded-md text-slate-300"
            >
              <ChevronsUpDown className="h-3 w-3" />
              <span>{allOpen ? 'Đóng tất cả' : 'Mở tất cả'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Area: Đóng mở theo từng thẻ Thư mục (Collapsible Folder Cards) */}
        <nav className="custom-scrollbar flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-3">
          {/* 1. MỤC ĐƠN TRỰC TIẾP: BẢNG ĐIỀU KHIỂN */}
          <div>
            <NavLink
              to="/dashboard"
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => [
                'flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all shadow-xs border',
                isActive
                  ? 'bg-blue-600 text-white border-blue-500 shadow-blue-600/30'
                  : 'bg-slate-900/80 border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white hover:border-slate-700',
              ].join(' ')}
            >
              <div className="flex items-center gap-2.5 truncate">
                <LayoutDashboard className="h-4 w-4 shrink-0 text-blue-400" />
                <span className="truncate">Bảng điều khiển</span>
              </div>
              <span className="rounded-md bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-bold text-blue-300 border border-blue-500/30">
                Tổng quan
              </span>
            </NavLink>
          </div>

          {/* 2. CÁC NHÓM DANH MỤC THẺ THƯ MỤC CÓ GẮN LABEL */}
          {categories.map(([categoryName, folders]) => (
            <div key={categoryName} className="space-y-2">
              {/* Tiêu đề nhóm phân loại lớn */}
              <div className="flex items-center justify-between px-1.5 pt-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  {categoryName}
                </span>
                <span className="h-px flex-1 bg-slate-800/80 ml-2" />
              </div>

              {/* Danh sách các Thẻ Thư mục trong nhóm */}
              {folders.map((folder) => {
                const isFolderOpen = Boolean(openFolders[folder.id]);
                const hasActiveChild = folder.items.some(
                  (item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
                );

                return (
                  <div
                    key={folder.id}
                    className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                      hasActiveChild
                        ? 'border-indigo-500/50 bg-slate-950/60 shadow-md shadow-indigo-500/10'
                        : 'border-slate-800/90 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80'
                    }`}
                  >
                    {/* Header Thẻ Thư mục (Folder Card Header) */}
                    <button
                      type="button"
                      onClick={() => toggleFolder(folder.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold transition-colors select-none ${
                        hasActiveChild
                          ? 'text-white'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`p-1 rounded-md ${hasActiveChild ? 'bg-indigo-600/30 text-indigo-400' : 'text-slate-400'}`}>
                          {isFolderOpen ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                        </span>
                        <span className="truncate text-[12px]">{folder.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        {/* Nhãn Label Thẻ (Yêu cầu / Cần thiết / Báo cáo / Cấu hình / Quản trị) */}
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold border ${folder.tag.style}`}
                        >
                          {folder.tag.label}
                        </span>

                        {/* Số lượng chức năng con */}
                        <span className="rounded bg-slate-800/90 px-1.5 py-0.5 text-[9px] font-medium text-slate-400">
                          {folder.items.length}
                        </span>

                        <ChevronDown
                          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                            isFolderOpen ? 'rotate-180 text-indigo-400' : 'rotate-0'
                          }`}
                        />
                      </div>
                    </button>

                    {/* Danh sách các chức năng con chi tiết bên trong thẻ */}
                    {isFolderOpen && (
                      <div className="px-2 pt-1 pb-2 border-t border-slate-800/70 bg-slate-950/40 space-y-0.5">
                        {folder.items.map((item) => {
                          const Icon = item.iconComponent;

                          return (
                            <NavLink
                              key={item.to}
                              to={item.to}
                              onClick={() => setIsOpen(false)}
                              title={item.detailHint}
                              className={({ isActive }) => [
                                'group flex flex-col rounded-lg px-2.5 py-1.5 text-xs transition-all',
                                isActive
                                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                                  : 'text-slate-400 hover:bg-slate-800/90 hover:text-white',
                              ].join(' ')}
                            >
                              <div className="flex items-center">
                                {Icon ? (
                                  <Icon className="mr-2 h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-blue-300 transition-colors" />
                                ) : (
                                  <span className="mr-2 text-xs">{item.icon}</span>
                                )}
                                <span className="truncate text-[11px] font-medium group-hover:text-white">
                                  {item.label}
                                </span>
                              </div>
                              {/* Dòng mô tả chi tiết nhỏ gọn */}
                              {item.detailHint && (
                                <span className="ml-5 text-[9px] text-slate-400 group-hover:text-slate-300 truncate">
                                  {item.detailHint}
                                </span>
                              )}
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Quick Tools & Bottom Logout */}
        <div className="shrink-0 border-t border-slate-800 bg-slate-950 p-3 space-y-2">
          {/* Link nhanh tới Cổng việc làm ngoài & Giới thiệu công ty */}
          <div className="grid grid-cols-2 gap-1.5">
            <NavLink
              to="/company"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-800/80 bg-slate-900/60 px-2 py-1.5 text-[10px] font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              <span>Giới thiệu</span>
            </NavLink>
            <NavLink
              to="/careers"
              target="_blank"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-800/80 bg-slate-900/60 px-2 py-1.5 text-[10px] font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              <Globe className="h-3 w-3 text-blue-400" />
              <span>Tuyển dụng</span>
              <span className="text-slate-500 text-[10px]">↗</span>
            </NavLink>
          </div>

          {/* Nút Đăng xuất */}
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 border border-slate-800/90 px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-rose-600 hover:border-rose-600 hover:text-white"
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
