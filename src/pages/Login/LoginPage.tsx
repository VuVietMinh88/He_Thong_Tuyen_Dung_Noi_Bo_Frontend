import React from 'react';
import { LoginForm } from '../../components/Login/LoginForm';

export const LoginPage: React.FC = () => {
  return (
    <div className="flex h-screen w-full font-sans bg-gray-50">
      {/* Khối bên trái: Gradient sâu thẳm, thông điệp và danh sách tính năng */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-start bg-gradient-to-br from-blue-900 to-indigo-800 text-white p-16 xl:p-24 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="relative z-10 max-w-xl">
          <div className="text-6xl mb-8">
            🏢
          </div>
          <h1 className="text-5xl font-extrabold mb-6 tracking-tight leading-tight">Tuyển Dụng<br/>Thông Minh</h1>
          <p className="text-lg text-blue-100 leading-relaxed font-light mb-8">
            Hệ thống quản lý quy trình tuyển dụng và nhân sự nội bộ chuyên nghiệp, được thiết kế để tối ưu hóa hiệu suất và bảo mật.
          </p>

          <ul className="space-y-4">
            <li className="flex items-center">
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-500 bg-opacity-30 text-blue-300 mr-3">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
              </span>
              <span className="text-blue-50 font-medium">Quản lý Requisition & Phê duyệt</span>
            </li>
            <li className="flex items-center">
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-500 bg-opacity-30 text-blue-300 mr-3">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
              </span>
              <span className="text-blue-50 font-medium">Pipeline Sàng lọc CV tự động</span>
            </li>
            <li className="flex items-center">
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-500 bg-opacity-30 text-blue-300 mr-3">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
              </span>
              <span className="text-blue-50 font-medium">Phỏng vấn & Đánh giá năng lực</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="flex-1 flex justify-center items-center p-6 bg-gray-50 sm:p-12 relative z-10">
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
