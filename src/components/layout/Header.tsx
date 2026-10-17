import React from 'react';
import { Search } from 'lucide-react';
import { NotificationBell } from '../notifications/NotificationBell';
import { tokenService } from '../../services/token.service';

export interface HeaderProps {
  className?: string;
}

/**
 * Thanh điều hướng đầu trang (Header / Topbar) của ứng dụng
 * Tích hợp Chuông thông báo (Notification Bell) theo Jira Subtask TKNHTTDNB1-541
 */
export const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  const userData = tokenService.getUserData();
  const userName = userData?.fullName || 'Quản Trị Viên';
  const userRole = userData?.roles?.[0] || 'Chuyên viên Nhân sự';

  return (
    <header
      data-testid="app-header-topbar"
      className={`sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white/95 px-6 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/95 ${className}`}
    >
      {/* 1. Bên trái: Ô tìm kiếm nhanh */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            data-testid="input-global-search"
            placeholder="Tìm kiếm ứng viên, tin tuyển dụng, offer..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50/70 py-2 pl-9 pr-4 text-xs text-gray-900 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-gray-700 dark:bg-gray-800/60 dark:text-white"
          />
        </div>
      </div>

      {/* 2. Bên phải: Chuông thông báo & Profile người dùng */}
      <div className="flex items-center gap-3.5">
        {/* CHUÔNG THÔNG BÁO (NOTIFICATION BELL - AC 1) */}
        <NotificationBell containerClassName="shrink-0" />

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

        {/* Thông tin người dùng đăng nhập */}
        <div
          data-testid="header-user-profile"
          className="flex items-center gap-2.5 pl-1"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-extrabold text-xs shadow-md">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">
              {userName}
            </p>
            <p className="text-[10px] text-gray-400 font-medium line-clamp-1">
              {userRole}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
