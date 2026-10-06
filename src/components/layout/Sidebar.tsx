import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { type Role, ROLE_NAMES } from '../../constants/roles';

// --------------------------------------------------------
// CẤU HÌNH MENU & QUYỀN TRUY CẬP (AC 1)
// --------------------------------------------------------
interface MenuItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  allowedRoles: Role[]; 
}

const MENU_ITEMS: MenuItem[] = [
  { title: 'Bảng điều khiển', path: '/dashboard', icon: '📊', allowedRoles: ['SYSTEM_ADMIN', 'HR_MANAGER', 'RECRUITER', 'HEAD_OF_DEPARTMENT', 'INTERVIEWER'] },
  { title: 'Quản lý tài khoản', path: '/users', icon: '👥', allowedRoles: ['SYSTEM_ADMIN'] },
  { title: 'Đăng tuyển dụng', path: '/jobs', icon: '📝', allowedRoles: ['SYSTEM_ADMIN', 'HR_MANAGER', 'RECRUITER'] },
  { title: 'Quản lý CV / Ứng viên', path: '/candidates', icon: '📄', allowedRoles: ['SYSTEM_ADMIN', 'HR_MANAGER', 'RECRUITER', 'HEAD_OF_DEPARTMENT'] },
  { title: 'Lịch phỏng vấn', path: '/interviews', icon: '📅', allowedRoles: ['SYSTEM_ADMIN', 'HR_MANAGER', 'RECRUITER', 'INTERVIEWER', 'HEAD_OF_DEPARTMENT'] },
  { title: 'Việc làm của tôi', path: '/my-jobs', icon: '💼', allowedRoles: ['CANDIDATE'] },
  { title: 'Hồ sơ cá nhân', path: '/profile', icon: '👤', allowedRoles: ['CANDIDATE', 'EMPLOYEE', 'SYSTEM_ADMIN', 'HR_MANAGER', 'RECRUITER', 'INTERVIEWER', 'HEAD_OF_DEPARTMENT'] },
];

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Lấy Role từ Storage/Global State (AC 2)
  const userRole = (localStorage.getItem('user_role') as Role) || 'CANDIDATE';
  const userName = localStorage.getItem('user_name') || 'Tài khoản khách';

  // Lọc menu theo quyền (AC 1)
  const visibleMenus = MENU_ITEMS.filter(menu => menu.allowedRoles.includes(userRole));

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <>
      {/* --------------------------------------------------------
          GIAO DIỆN MOBILE: Nút Hamburger (AC 3)
          -------------------------------------------------------- */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-md focus:outline-none shadow-md transition-transform hover:scale-105"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Overlay: Nền mờ khi mở menu trên điện thoại */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm transition-opacity" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* --------------------------------------------------------
          CẤU TRÚC SIDEBAR CHÍNH (Desktop & Drawer Mobile)
          -------------------------------------------------------- */}
      <aside 
        className={`fixed top-0 left-0 h-screen w-72 bg-slate-900 text-white shadow-2xl z-40 flex flex-col transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 md:static md:h-screen md:flex-shrink-0`}
      >
        {/* Header Logo */}
        <div className="flex items-center justify-center h-16 bg-slate-950 border-b border-slate-800 px-4 shrink-0">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-300 truncate">
            Smart Recruitment
          </span>
        </div>

        {/* Thông tin người dùng đang đăng nhập (AC 2) */}
        <div className="p-5 border-b border-slate-800 bg-slate-800/50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-lg font-bold shadow-inner">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-100 truncate">{userName}</p>
              <p className="text-xs font-medium text-blue-400 mt-0.5 uppercase tracking-wider truncate">
                {ROLE_NAMES[userRole] || 'Khách'}
              </p>
            </div>
          </div>
        </div>

        {/* Danh sách Menu Navigation (Đã lọc) */}
        <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <ul className="space-y-1 px-3">
            {visibleMenus.map((menu) => {
              const isActive = location.pathname.startsWith(menu.path);
              return (
                <li key={menu.path}>
                  <Link
                    to={menu.path}
                    onClick={() => setIsOpen(false)} // UX: Tự đóng Drawer khi user click menu trên Mobile
                    className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className={`mr-3 text-xl transition-transform duration-200 ${!isActive && 'group-hover:scale-110'}`}>
                      {menu.icon}
                    </span>
                    <span className="font-medium text-sm">{menu.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Nút Đăng xuất */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 shrink-0">
          <button 
            className="w-full flex items-center justify-center px-4 py-2.5 bg-slate-800 hover:bg-red-600/90 text-slate-300 hover:text-white rounded-lg transition-colors duration-200"
            onClick={handleLogout}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span className="font-medium text-sm">Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
