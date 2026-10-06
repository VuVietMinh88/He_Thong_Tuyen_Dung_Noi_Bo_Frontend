import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { type Role, ROLE_NAMES } from '../../constants/roles';

// Cấu trúc một Menu Item
interface MenuItem {
  title: string;
  path: string;
  icon: string;
  allowedRoles: Role[]; // Khai báo rõ menu này dành cho những vai trò nào
}

// Danh sách toàn bộ menu của hệ thống
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

  // Lấy thông tin user (Nên thay bằng hook từ Redux/Context như useAuth() trong dự án thật)
  const userRole = (localStorage.getItem('user_role') as Role) || 'CANDIDATE';
  const userName = localStorage.getItem('user_name') || 'Nguyễn Văn A';

  // Lọc menu: Chỉ giữ lại những menu mà userRole hiện tại có quyền truy cập
  const visibleMenus = MENU_ITEMS.filter(menu => menu.allowedRoles.includes(userRole));

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
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
              {userName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{userName}</p>
              <p className="text-xs font-semibold text-blue-400 mt-0.5 uppercase tracking-wider truncate">
                {ROLE_NAMES[userRole] || 'Khách'}
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

        {/* === CODE TOOL TEST (Xóa đi khi release) === */}
        <div className="p-2 border-b border-slate-800 bg-slate-900">
          <select 
            className="w-full bg-slate-800 text-white text-xs p-2 rounded outline-none border border-slate-700"
            value={userRole}
            onChange={(e) => {
              localStorage.setItem('user_role', e.target.value);
              localStorage.setItem('access_token', 'test_token'); // Giả lập đã có token
              window.location.reload(); // Reload lại trang để áp quyền mới
            }}
          >
            <option value="SYSTEM_ADMIN">Quản trị hệ thống</option>
            <option value="HR_MANAGER">Trưởng phòng nhân sự</option>
            <option value="RECRUITER">Nhân viên tuyển dụng</option>
            <option value="HEAD_OF_DEPARTMENT">Trưởng bộ phận</option>
            <option value="CANDIDATE">Ứng viên</option>
          </select>
        </div>
        {/* ========================================= */}

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

