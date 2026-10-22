import React from 'react';
import { Search } from 'lucide-react';
import { NotificationBell } from '../notifications/NotificationBell';

export interface HeaderProps {
  className?: string;
}

/**
 * Thanh điều hướng đầu trang (Header / Topbar) của ứng dụng
 * Tối giản, đồng bộ: đã bỏ phần thông tin quản trị viên trùng lặp ở góc phải
 * vì thông tin đăng nhập đã được hiển thị đầy đủ, trang trọng ở thanh Sidebar bên trái.
 */
export const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  return (
    <header
      data-testid="app-header-topbar"
      className={`sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 ${className}`}
    >
      {/* 1. Bên trái: Ô tìm kiếm nhanh toàn hệ thống */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            data-testid="input-global-search"
            placeholder="Tìm kiếm ứng viên, tin tuyển dụng, offer..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-4 text-xs text-slate-900 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
          />
        </div>
      </div>

      {/* 2. Bên phải: Chuông thông báo tinh tế (Đã bỏ avatar & text Quản trị viên để tránh trùng lặp) */}
      <div className="flex items-center gap-3">
        {/* CHUÔNG THÔNG BÁO (NOTIFICATION BELL) */}
        <NotificationBell containerClassName="shrink-0" />
      </div>
    </header>
  );
};

export default Header;
