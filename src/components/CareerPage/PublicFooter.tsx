import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Mail, Phone, MapPin, Heart } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                <Briefcase className="h-5 w-5" />
              </div>
              <span className="text-xl font-black text-white">SmartRecruit System</span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Nền tảng công nghệ tuyển dụng nhân sự thông minh, kết nối các chuyên gia công nghệ hàng đầu
              với các dự án quy mô lớn.
            </p>
            <div className="pt-2 text-xs text-slate-500 space-y-1">
              <p className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                Tòa nhà Smart Tower, Tầng 8, 123 Duy Tân, Cầu Giấy, Hà Nội
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-indigo-400" />
                careers@company.com / hr@company.com
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-indigo-400" />
                (024) 1234 5678 (Hotline Tuyển dụng)
              </p>
            </div>
          </div>

          {/* Column 1: Cơ hội nghề nghiệp */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Cơ hội việc làm
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#jobs-section" className="hover:text-white transition">
                  Công nghệ &amp; Phần mềm
                </a>
              </li>
              <li>
                <a href="#jobs-section" className="hover:text-white transition">
                  AI &amp; Khoa học Dữ liệu
                </a>
              </li>
              <li>
                <a href="#jobs-section" className="hover:text-white transition">
                  UI/UX &amp; Thiết kế Sản phẩm
                </a>
              </li>
              <li>
                <a href="#jobs-section" className="hover:text-white transition">
                  Kinh doanh &amp; Tiếp thị
                </a>
              </li>
              <li>
                <a href="#jobs-section" className="hover:text-white transition">
                  Thực tập sinh tiềm năng
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Về công ty */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Văn hóa &amp; Đãi ngộ
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#about-section" className="hover:text-white transition">
                  Về chúng tôi
                </a>
              </li>
              <li>
                <a href="#benefits-section" className="hover:text-white transition">
                  Chế độ đãi ngộ 360°
                </a>
              </li>
              <li>
                <a href="#about-section" className="hover:text-white transition">
                  Môi trường làm việc
                </a>
              </li>
              <li>
                <a href="#about-section" className="hover:text-white transition">
                  Lộ trình thăng tiến
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Dành cho cán bộ nội bộ */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Dành cho Nội bộ
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition font-semibold"
                >
                  Cổng đăng nhập nhân sự
                </Link>
              </li>
              <li>
                <Link to="/forgot-password" className="hover:text-white transition">
                  Quên mật khẩu
                </Link>
              </li>
              <li>
                <Link to="/activate-account" className="hover:text-white transition">
                  Kích hoạt tài khoản mới
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 sm:flex-row text-xs text-slate-500">
          <p>© 2026 Smart Recruitment System. Tất cả các quyền được bảo lưu.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Xây dựng với</span>
            <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
            <span>dành cho cộng đồng nhân tài</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
