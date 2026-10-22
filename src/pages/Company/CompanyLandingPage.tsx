import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Briefcase,
  LogIn,
  Users,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Heart,
  Award,
  ArrowRight,
  Search,
  CheckCircle2,
  Coffee,
  Laptop,
  GraduationCap,
  ChevronRight,
  Menu,
  X,
  FileSearch,
  Lock,
} from 'lucide-react';

export const CompanyLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Thống kê ấn tượng
  const companyStats = [
    { value: '500+', label: 'Nhân sự tài năng', desc: 'Đội ngũ chuyên nghiệp' },
    { value: '18+', label: 'Vị trí đang tuyển', desc: 'Cơ hội phát triển ngay hôm nay' },
    { value: '96%', label: 'Chỉ số hài lòng', desc: 'Môi trường làm việc gắn kết' },
    { value: '15+', label: 'Năm đồng hành', desc: 'Khẳng định vị thế bền vững' },
  ];

  // Giá trị cốt lõi
  const coreValues = [
    {
      icon: Sparkles,
      title: 'Đổi mới & Sáng tạo',
      desc: 'Luôn khuyến khích thử nghiệm ý tưởng mới, đổi mới tư duy và áp dụng công nghệ tiên tiến nhất.',
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-50 text-amber-600',
    },
    {
      icon: ShieldCheck,
      title: 'Chính trực & Minh bạch',
      desc: 'Mọi quy trình từ tuyển dụng đến đánh giá đều công bằng, minh bạch và tôn trọng sự thật.',
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-blue-50 text-blue-600',
    },
    {
      icon: Users,
      title: 'Con người là trọng tâm',
      desc: 'Chúng tôi tin rằng sự thành công của tổ chức bắt nguồn từ sự phát triển và hạnh phúc của mỗi cá nhân.',
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-50 text-emerald-600',
    },
    {
      icon: TrendingUp,
      title: 'Khát vọng vươn xa',
      desc: 'Không ngừng nâng tầm tiêu chuẩn, chinh phục những cột mốc phát triển mới trên thị trường quốc tế.',
      color: 'from-violet-500 to-purple-500',
      bgColor: 'bg-violet-50 text-violet-600',
    },
  ];

  // Chế độ đãi ngộ & Phúc lợi
  const benefits = [
    {
      icon: Award,
      title: 'Thu nhập & Thưởng cạnh tranh',
      desc: 'Chính sách lương theo năng lực, thưởng kết quả kinh doanh quý/năm và tháng lương 13 rộng mở.',
    },
    {
      icon: Heart,
      title: 'Chăm sóc sức khỏe VIP',
      desc: 'Gói bảo hiểm sức khỏe cao cấp cho nhân viên và người thân, khám sức khỏe định kỳ tại viện quốc tế.',
    },
    {
      icon: GraduationCap,
      title: 'Lộ trình phát triển rõ ràng',
      desc: 'Chương trình đào tạo định kỳ, tài trợ 100% học phí chứng chỉ quốc tế và lộ trình thăng tiến minh bạch.',
    },
    {
      icon: Laptop,
      title: 'Làm việc linh hoạt & Hiện đại',
      desc: 'Chính sách Hybrid Work, trang bị Macbook/Laptop cấu hình cao, văn phòng chuẩn công nghệ mở.',
    },
    {
      icon: Coffee,
      title: 'Đời sống tinh thần phong phú',
      desc: 'Pantry trà bánh miễn phí, câu lạc bộ thể thao hàng tuần, teambuilding và du lịch nghỉ dưỡng 5 sao.',
    },
    {
      icon: Users,
      title: 'Văn hóa mở & Tôn trọng',
      desc: 'Không rào cản cấp bậc, lãnh đạo sẵn sàng lắng nghe và đồng hành hỗ trợ mọi ý kiến đóng góp.',
    },
  ];

  // Các khối phòng ban tuyển dụng trọng điểm
  const hiringDepartments = [
    { name: 'Khối Công nghệ & Sản phẩm', openings: '8 vị trí', tags: ['Backend', 'Frontend', 'Product Manager', 'DevOps'] },
    { name: 'Trung tâm Nghiên cứu AI & Dữ liệu', openings: '4 vị trí', tags: ['Data Scientist', 'AI Engineer', 'BI Analyst'] },
    { name: 'Phòng Kinh doanh & Tiếp thị', openings: '3 vị trí', tags: ['B2B Sales', 'Digital Marketing', 'Content Lead'] },
    { name: 'Ban Quản trị Nguồn nhân lực', openings: '3 vị trí', tags: ['Senior Recruiter', 'HRBP', 'C&B Specialist'] },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo & Brand Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/25 text-xl font-bold group-hover:scale-105 transition-transform">
              🏢
            </div>
            <div>
              <p className="text-base font-black text-slate-900 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
                TẬP ĐOÀN CÔNG NGHỆ NỘI BỘ
              </p>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-1">
                Internal Career &amp; HR Enterprise Portal
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#about" className="hover:text-indigo-600 transition-colors">
              Giới thiệu
            </a>
            <a href="#values" className="hover:text-indigo-600 transition-colors">
              Giá trị cốt lõi
            </a>
            <a href="#benefits" className="hover:text-indigo-600 transition-colors">
              Phúc lợi &amp; Môi trường
            </a>
            <a href="#openings" className="hover:text-indigo-600 transition-colors">
              Cơ hội nghề nghiệp
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Nút Ứng tuyển dành cho Ứng viên */}
            <Link
              to="/careers"
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100/80 transition shadow-xs"
            >
              <Briefcase className="h-4 w-4 text-indigo-600" />
              <span>Tìm việc làm</span>
            </Link>

            {/* Nút Đăng nhập dành cho Nhân sự nội bộ */}
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-indigo-600/25 transition active:scale-95"
            >
              <LogIn className="h-4 w-4" />
              <span>Đăng nhập nội bộ</span>
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top">
            <nav className="flex flex-col gap-3 text-sm font-semibold text-slate-700">
              <a
                href="#about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-1 hover:text-indigo-600"
              >
                Giới thiệu
              </a>
              <a
                href="#values"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-1 hover:text-indigo-600"
              >
                Giá trị cốt lõi
              </a>
              <a
                href="#benefits"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-1 hover:text-indigo-600"
              >
                Phúc lợi &amp; Môi trường
              </a>
              <a
                href="#openings"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-1 hover:text-indigo-600"
              >
                Cơ hội nghề nghiệp
              </a>
            </nav>
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2.5">
              <Link
                to="/careers"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 py-3 text-xs font-bold text-indigo-700"
              >
                <Briefcase className="h-4 w-4" />
                Tìm kiếm cơ hội việc làm
              </Link>
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md"
              >
                <LogIn className="h-4 w-4" />
                Đăng nhập nhân sự nội bộ
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white py-20 sm:py-28 lg:py-32">
        {/* Glow Background blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -top-10 -right-10 w-96 h-96 bg-blue-500/15 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-bold text-indigo-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            Cổng Thông Tin &amp; Tuyển Dụng Nhân Sự Hợp Nhất
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-5xl mx-auto leading-[1.12]">
            Nơi Khởi Đầu Của <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
              Những Tài Năng Xuất Chúng
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            Chúng tôi xây dựng môi trường làm việc cởi mở, trao quyền và không ngừng đổi mới để mỗi thành viên kiến tạo giá trị đột phá.
          </p>

          {/* 2 Main Direction CTAs (Dành cho Ứng viên & Nhân sự) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 max-w-md sm:max-w-xl mx-auto">
            {/* Luồng 1: Dành cho Ứng viên */}
            <button
              type="button"
              onClick={() => navigate('/careers')}
              className="w-full sm:flex-1 min-h-[54px] rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-600 to-violet-600 px-6 text-sm font-bold text-white shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
              <Briefcase className="h-4 w-4" />
              <span>Khám phá việc làm</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Luồng 2: Dành cho Cán bộ nhân sự nội bộ */}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full sm:flex-1 min-h-[54px] rounded-2xl border border-white/20 bg-white/10 px-6 text-sm font-bold text-white backdrop-blur-md hover:bg-white/20 hover:border-white/30 transition flex items-center justify-center gap-2"
            >
              <Lock className="h-4 w-4 text-indigo-300" />
              <span>Cổng nhân sự nội bộ</span>
            </button>
          </div>

          {/* Quick lookup link for candidate */}
          <p className="text-xs text-slate-400 pt-2">
            Đã nộp hồ sơ?{' '}
            <Link
              to="/careers/applications/lookup"
              className="text-indigo-300 font-semibold underline underline-offset-4 hover:text-white transition"
            >
              Tra cứu tiến trình ứng tuyển tại đây
            </Link>
          </p>
        </div>

        {/* Floating Stats Strip */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-24">
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-lg p-6 sm:p-8 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {companyStats.map((st, i) => (
              <div key={i} className="space-y-1">
                <p className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                  {st.value}
                </p>
                <p className="text-xs sm:text-sm font-bold text-white">{st.label}</p>
                <p className="text-[11px] text-slate-400 font-light">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. TWO DEDICATED PATHWAYS (CHO ỨNG VIÊN VÀ NHÂN VIÊN) */}
      <section className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
              Lựa chọn đúng cổng dịch vụ
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Bạn đang tìm kiếm điều gì hôm nay?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Cổng thông tin được thiết kế thông minh cho cả người tìm việc và cán bộ nhân viên nội bộ.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Card 1: Ứng viên tìm việc */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-8 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Briefcase className="h-7 w-7" />
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-100">
                    18 Vị trí đang mở
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Dành cho Ứng viên tài năng
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Khám phá những cơ hội nghề nghiệp hấp dẫn, ứng tuyển nhanh chóng với tệp CV và theo dõi minh bạch tiến trình tuyển dụng.
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-600 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Nộp hồ sơ trực tuyến trong vòng 2 phút (chấp nhận PDF/DOCX)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Nhận mã theo dõi độc quyền để đối soát trạng thái hồ sơ</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Chính sách lương thưởng và lộ trình phát triển minh bạch</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/careers')}
                  className="flex-1 min-h-[46px] rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition flex items-center justify-center gap-1.5"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Tìm kiếm việc làm</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/careers/applications/lookup')}
                  className="flex-1 min-h-[46px] rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
                >
                  <FileSearch className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Tra cứu hồ sơ đã nộp</span>
                </button>
              </div>
            </div>

            {/* Card 2: Cán bộ nhân sự nội bộ */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-8 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                    <ShieldCheck className="h-7 w-7" />
                  </div>
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700 border border-violet-100">
                    Nội bộ doanh nghiệp
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Dành cho Nhân sự &amp; Ban quản trị
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Hệ thống quản lý quy trình tuyển dụng khép kín: từ đề xuất Requisition, sàng lọc Kanban, đánh giá phỏng vấn đến duyệt Offer.
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-600 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-violet-500 shrink-0" />
                    <span>Phê duyệt yêu cầu tuyển dụng (Requisition) đa cấp</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-violet-500 shrink-0" />
                    <span>Bảng Kanban điều phối ứng viên và chấm điểm năng lực</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-violet-500 shrink-0" />
                    <span>Báo cáo thời gian (Time-to-hire) và chi phí theo thời gian thực</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="flex-1 min-h-[46px] rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 px-4 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:from-blue-800 hover:to-indigo-800 transition flex items-center justify-center gap-1.5"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Đăng nhập hệ thống nội bộ</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 min-h-[46px] rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
                >
                  <span>Truy cập nhanh Dashboard</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ABOUT COMPANY & CORE VALUES */}
      <section id="about" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
              Về chúng tôi &bull; Tập đoàn công nghệ
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Tiên phong công nghệ, <br />
              Kiến tạo giá trị cho cộng đồng
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-light">
              Được thành lập với sứ mệnh giải quyết các bài toán chuyển đổi số phức tạp cho doanh nghiệp, chúng tôi tự hào sở hữu đội ngũ chuyên gia hàng đầu và văn hóa đề cao tính chủ động, cởi mở và không ngừng học hỏi.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed font-light">
              Tại đây, bạn không chỉ nhận một công việc, mà là một hành trình sự nghiệp nơi mọi đóng góp đều được ghi nhận xứng đáng và tôn vinh.
            </p>

            <div className="pt-2 flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/careers')}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold text-white hover:bg-slate-800 transition shadow-md"
              >
                <span>Xem các vị trí công ty đang thiếu</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Right Core Values Grid */}
          <div id="values" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {coreValues.map((val, idx) => {
              const Icon = val.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md hover:border-indigo-200 transition space-y-2.5"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${val.bgColor}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{val.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{val.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. BENEFITS & PERKS */}
      <section id="benefits" className="py-20 sm:py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14 relative z-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              Vì sao bạn sẽ yêu thích làm việc tại đây?
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Chế độ đãi ngộ &amp; Phúc lợi toàn diện
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-light">
              Chúng tôi luôn cam kết mang lại đãi ngộ xứng đáng và trải nghiệm nhân viên tuyệt vời nhất.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, idx) => {
              const Icon = b.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xs hover:bg-white/10 hover:border-indigo-400/30 transition space-y-3"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/20">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">{b.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-light">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. FEATURED OPENINGS PREVIEW */}
      <section id="openings" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
              Vị trí công ty đang thiếu &amp; cần tuyển dụng
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Khối phòng ban đang tìm kiếm nhân tài
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Chọn ngay khối công việc phù hợp với năng lực và mục tiêu sự nghiệp của bạn.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/careers')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition self-start md:self-end"
          >
            <span>Xem tất cả vị trí chi tiết</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {hiringDepartments.map((dept, idx) => (
            <div
              key={idx}
              onClick={() => navigate('/careers')}
              className="group cursor-pointer rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:border-indigo-400 hover:shadow-lg transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                    {dept.openings}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
                  {dept.name}
                </h3>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                {dept.tags.map((tag, tIdx) => (
                  <span
                    key={tIdx}
                    className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-indigo-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 p-8 text-center space-y-4">
          <h3 className="text-xl font-black text-slate-900">
            Chưa tìm thấy vị trí mong muốn?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            Hãy gửi hồ sơ vào kho ứng viên tiềm năng của chúng tôi. Đội ngũ tuyển dụng sẽ chủ động liên hệ ngay khi có vị trí mới phù hợp!
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/careers')}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition"
            >
              <Briefcase className="h-4 w-4" />
              <span>Gửi CV vào kho nhân tài</span>
            </button>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="w-full border-t border-slate-200 bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-lg">
                🏢
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  TẬP ĐOÀN CÔNG NGHỆ NỘI BỘ
                </p>
                <p className="text-[11px] text-slate-400">
                  Hệ thống Quản trị &amp; Tuyển dụng Nhân sự Chuẩn Doanh nghiệp
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs font-semibold">
              <Link to="/careers" className="hover:text-white transition">
                Cơ hội việc làm
              </Link>
              <Link to="/careers/applications/lookup" className="hover:text-white transition">
                Tra cứu hồ sơ
              </Link>
              <Link to="/login" className="hover:text-white transition text-indigo-400">
                Đăng nhập nội bộ
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>
              &copy; {new Date().getFullYear()} Hệ Thống Quản Trị Tuyển Dụng Nội Bộ. All rights reserved.
            </p>
            <p>
              Địa chỉ: Tòa nhà Trụ sở Tập đoàn, Khu Công nghệ Cao &bull; Hotline: 1900 6868
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CompanyLandingPage;
