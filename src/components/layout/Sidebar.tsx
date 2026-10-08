import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { type Role, ROLE_NAMES } from '../../constants/roles';
import { tokenService } from '../../services/token.service';
import { authService } from '../../services/auth.service';

// Cấu trúc một Menu Item
interface MenuItem {
  title: string;
  path: string;
  icon: string;
  allowedRoles: Role[]; // Khai báo rõ menu này dành cho những vai trò nào
}

// Danh sách toàn bộ menu của hệ thống
const MENU_ITEMS: MenuItem[] = [
  { title: 'Bảng điều khiển', path: '/dashboard', icon: '📊', allowedRoles: ['ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER', 'APPROVER'] },
  { title: 'Quản lý tài khoản', path: '/users', icon: '👥', allowedRoles: ['ADMIN'] },
  { title: 'Đăng tuyển dụng', path: '/jobs', icon: '📝', allowedRoles: ['ADMIN', 'HR_MANAGER', 'RECRUITER'] },
  { title: 'Quản lý CV / Ứng viên', path: '/candidates', icon: '📄', allowedRoles: ['ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER'] },
  { title: 'Lịch phỏng vấn', path: '/interviews', icon: '📅', allowedRoles: ['ADMIN', 'HR_MANAGER', 'RECRUITER', 'INTERVIEWER', 'HIRING_MANAGER'] },
  { title: 'Hồ sơ cá nhân', path: '/profile', icon: '👤', allowedRoles: ['ADMIN', 'HR_MANAGER', 'RECRUITER', 'INTERVIEWER', 'HIRING_MANAGER', 'APPROVER'] },
];

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const userData = tokenService.getUserData();
  const userRoles = userData?.roles ?? [];
  const userName = userData?.fullName || userData?.email || 'Người dùng';

  const displayRole = userRoles.find(
    (role): role is Role => Object.hasOwn(ROLE_NAMES, role),
  );

  // Lọc menu: Chỉ giữ lại những menu mà userRoles hiện tại có quyền truy cập
  const visibleMenus = MENU_ITEMS.filter(menu => 
    menu.allowedRoles.some(role => userRoles.includes(role))
  );

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error: unknown) {
      console.error("Logout API failed", error);
    } finally {
      tokenService.clearAll();
      navigate('/login');
    }
  };

  return (
    <>
      {/* Nút Hamburger cho Mobile (hiển thị khi màn hình < md) */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-md focus:outline-none shadow-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Overlay làm mờ background cho mobile khi Sidebar mở */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Cấu trúc Sidebar chính */}
      <aside 
        className={`fixed top-0 left-0 h-screen w-72 bg-slate-900 text-white shadow-xl z-40 transition-transform duration-300 ease-in-out transform flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 md:static md:h-screen md:flex-shrink-0`}
      >
        {/* Header Logo */}
        <div className="flex items-center justify-center h-16 bg-slate-950 border-b border-slate-800 px-4 shrink-0">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-300 truncate">
            Smart Recruitment
          </span>
        </div>

        {/* Thông tin User (AC 1) */}
        <div className="p-5 border-b border-slate-800 bg-slate-800/50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{userName}</p>
              <p className="text-xs font-semibold text-blue-400 mt-0.5 uppercase tracking-wider truncate">
                {displayRole ? ROLE_NAMES[displayRole] : 'Khách'}
              </p>
            </div>
          </div>
        </div>

        {/* Danh sách Menu Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <ul className="space-y-1 px-3">
            {visibleMenus.map((menu) => {
              const isActive = location.pathname.startsWith(menu.path);
              return (
                <li key={menu.path}>
                  <Link
                    to={menu.path}
                    onClick={() => setIsOpen(false)} // Tự đóng khi click link trên mobile
                    className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="mr-3 text-xl">{menu.icon}</span>
                    <span className="font-medium text-sm">{menu.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Nút Đăng xuất ở Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 shrink-0">
          <button 
            className="w-full flex items-center justify-center px-4 py-2.5 bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white rounded-lg transition-colors duration-200"
            onClick={handleLogout}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span className="font-medium text-sm">Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
