import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  Building2,
  Briefcase,
  Server,
  AlertTriangle,
  FileSpreadsheet,
  Settings,
  Mail,
  Clock,
  ArrowUpRight,
  TrendingUp,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { getHealth, type HealthResponse } from '../../services/healthService';
import { tokenService } from '../../services/token.service';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [healthStatus, setHealthStatus] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const currentUser = tokenService.getUserData();

  const checkServerHealth = async () => {
    setIsCheckingHealth(true);
    setHealthError(null);
    try {
      const res = await getHealth();
      setHealthStatus(res);
    } catch (err) {
      setHealthError(err instanceof Error ? err.message : 'Không thể kết nối đến máy chủ.');
    } finally {
      setIsCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkServerHealth();
  }, []);

  // System KPI Mock / Summary
  const adminMetrics = [
    {
      title: 'Tài khoản hoạt động',
      value: '24',
      subtext: 'Trên 7 vai trò phân quyền',
      icon: Users,
      color: 'from-blue-600 to-indigo-600',
      bgColor: 'bg-blue-50 text-blue-700',
      actionText: 'Quản lý tài khoản',
      onClick: () => navigate('/users'),
    },
    {
      title: 'Phòng ban & Cơ cấu',
      value: '12',
      subtext: '34 chức danh định biên',
      icon: Building2,
      color: 'from-violet-600 to-purple-600',
      bgColor: 'bg-violet-50 text-violet-700',
      actionText: 'Xem sơ đồ tổ chức',
      onClick: () => navigate('/settings/departments'),
    },
    {
      title: 'Tin tuyển dụng công khai',
      value: '18',
      subtext: 'Đang mở nhận hồ sơ',
      icon: Briefcase,
      color: 'from-emerald-600 to-teal-600',
      bgColor: 'bg-emerald-50 text-emerald-700',
      actionText: 'Duyệt tin đăng',
      onClick: () => navigate('/job-postings'),
    },
    {
      title: 'Cấu hình SLA & Phê duyệt',
      value: '100%',
      subtext: 'Tuân thủ thời hạn xử lý',
      icon: Clock,
      color: 'from-amber-600 to-orange-600',
      bgColor: 'bg-amber-50 text-amber-700',
      actionText: 'Cài đặt SLA',
      onClick: () => navigate('/settings/sla'),
    },
  ];

  const adminShortcuts = [
    {
      title: 'Quản lý người dùng',
      desc: 'Thêm, sửa, cấp quyền và khóa tài khoản nhân sự nội bộ',
      icon: UserPlus,
      route: '/users',
      badge: 'Quản trị viên',
    },
    {
      title: 'Nhập người dùng từ Excel',
      desc: 'Import hàng loạt danh sách nhân sự từ tệp Excel',
      icon: FileSpreadsheet,
      route: '/users/import',
      badge: 'Batch Tool',
    },
    {
      title: 'Danh mục Master Data',
      desc: 'Quản lý phòng ban, dải lương, kỹ năng, chức danh',
      icon: Settings,
      route: '/settings/master-data',
      badge: 'Cấu hình',
    },
    {
      title: 'Mẫu Email tự động',
      desc: 'Soạn thảo và cấu hình email theo từng giai đoạn ứng tuyển',
      icon: Mail,
      route: '/settings/email-templates',
      badge: 'Truyền thông',
    },
    {
      title: 'Ngân sách & Headcount',
      desc: 'Kiểm soát hạn mức định biên và chi phí tuyển dụng theo năm',
      icon: TrendingUp,
      route: '/headcount-budget',
      badge: 'Tài chính',
    },
    {
      title: 'Kiểm toán gửi Email',
      desc: 'Theo dõi nhật ký gửi thư ứng viên, khắc phục lỗi gửi thất bại',
      icon: ShieldCheck,
      route: '/email-audit-logs',
      badge: 'Bảo mật',
    },
  ];

  return (
    <div className="space-y-6 p-6 sm:p-8 max-w-7xl mx-auto">
      {/* Top Welcome Banner */}
      <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-400/30">
              <ShieldCheck className="h-3.5 w-3.5" />
              Bảng điều khiển quản trị hệ thống (System Administration)
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Xin chào, {currentUser?.fullName || 'Quản Trị Viên'}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl font-light">
              Theo dõi tình trạng hoạt động toàn diện của hệ thống tuyển dụng nội bộ, phân quyền tài khoản và cấu hình danh mục tổ chức.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
            >
              Dashboard tuyển dụng
            </button>
            <button
              type="button"
              onClick={() => navigate('/users')}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Thêm tài khoản mới
            </button>
          </div>
        </div>
      </div>

      {/* Server Health Status Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            healthStatus ? 'bg-emerald-50 text-emerald-600' : healthError ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'
          }`}>
            <Server className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-900">
                Tình trạng kết nối Máy chủ & Cơ sở dữ liệu
              </p>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                healthStatus
                  ? 'bg-emerald-100 text-emerald-800'
                  : healthError
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-slate-100 text-slate-700'
              }`}>
                {healthStatus ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Đang hoạt động ổn định
                  </>
                ) : healthError ? (
                  <>
                    <AlertTriangle className="h-3 w-3" />
                    Mất kết nối
                  </>
                ) : (
                  'Đang kiểm tra...'
                )}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {healthStatus
                ? `Máy chủ phản hồi bình thường • Thời gian: ${new Date().toLocaleTimeString('vi-VN')}`
                : healthError || 'Đang gửi tín hiệu kiểm tra định kỳ tới Backend API'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={checkServerHealth}
          disabled={isCheckingHealth}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition self-start sm:self-center"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isCheckingHealth ? 'animate-spin' : ''}`} />
          Kiểm tra lại
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {adminMetrics.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              onClick={item.onClick}
              className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className={`rounded-xl p-2.5 ${item.bgColor}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-0.5 transition">
                  {item.actionText}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  {item.value}
                </p>
                <p className="text-xs font-bold text-slate-700 mt-0.5">
                  {item.title}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {item.subtext}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Shortcuts Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Chức năng quản trị hệ thống
          </h2>
          <span className="text-xs font-semibold text-slate-400">
            Dành riêng cho vai trò Administrator &amp; HR Manager
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {adminShortcuts.map((sc, idx) => {
            const Icon = sc.icon;
            return (
              <div
                key={idx}
                onClick={() => navigate(sc.route)}
                className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-indigo-400 hover:shadow-md transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    {sc.badge}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
                    {sc.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {sc.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
