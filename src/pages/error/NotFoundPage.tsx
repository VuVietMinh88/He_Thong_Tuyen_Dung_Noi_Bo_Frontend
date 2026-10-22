import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Home,
  Briefcase,
  ArrowLeft,
  Search,
  FileQuestion,
} from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800">
      {/* Top Navbar */}
      <header className="w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div
            onClick={() => navigate('/careers')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20 font-black text-lg">
              🏢
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 tracking-tight leading-none">
                HỆ THỐNG TUYỂN DỤNG NỘI BỘ
              </p>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                ENTERPRISE RECRUITMENT PORTAL
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/careers')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition"
          >
            Cổng cơ hội việc làm &rarr;
          </button>
        </div>
      </header>

      {/* Main 404 Hero Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-xl w-full text-center space-y-6">
          {/* Badge & Illustration */}
          <div className="relative inline-block">
            <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-indigo-500/20 to-violet-500/20 blur-2xl -z-10" />
            <div className="relative flex h-24 w-24 mx-auto items-center justify-center rounded-3xl bg-white border border-slate-200 shadow-xl shadow-indigo-500/10 text-indigo-600">
              <Compass className="h-12 w-12 animate-spin-slow text-indigo-600" />
            </div>
          </div>

          <div className="space-y-2">
            <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-700 border border-indigo-100">
              Lỗi 404 &bull; Không tìm thấy đường dẫn
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Trang bạn tìm không tồn tại
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto leading-relaxed">
              Địa chỉ liên kết có thể đã bị thay đổi, xóa bỏ hoặc tạm thời không khả dụng trên hệ thống.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-xs"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Quay lại trang trước</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/30 transition"
            >
              <Home className="h-4 w-4" />
              <span>Về Dashboard quản trị</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/careers')}
              className="w-full sm:w-auto min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-5 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
            >
              <Briefcase className="h-4 w-4" />
              <span>Xem các vị trí tuyển dụng</span>
            </button>
          </div>

          {/* Helpful suggestions */}
          <div className="pt-6 border-t border-slate-200/60 max-w-md mx-auto">
            <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">
              Gợi ý lối tắt nhanh
            </p>
            <div className="grid grid-cols-2 gap-2 text-left">
              <button
                type="button"
                onClick={() => navigate('/careers/applications/lookup')}
                className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white p-3 hover:border-indigo-400 hover:bg-indigo-50/30 transition text-xs font-semibold text-slate-700"
              >
                <Search className="h-4 w-4 text-indigo-600 shrink-0" />
                <span className="truncate">Tra cứu hồ sơ ứng viên</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white p-3 hover:border-indigo-400 hover:bg-indigo-50/30 transition text-xs font-semibold text-slate-700"
              >
                <FileQuestion className="h-4 w-4 text-violet-600 shrink-0" />
                <span className="truncate">Đăng nhập tài khoản nội bộ</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Hệ Thống Quản Trị Tuyển Dụng Nội Bộ. All rights reserved.
      </footer>
    </div>
  );
};

export default NotFoundPage;
