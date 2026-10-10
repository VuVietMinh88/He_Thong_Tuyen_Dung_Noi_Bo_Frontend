import React, { useState, useMemo } from 'react';

// === MOCK DATA & TYPES ===
interface JobTitle {
  id: string;
  code: string;
  name: string;
  level: string;
  salaryMin?: number; // Có thể không có nếu user không có quyền
  salaryMax?: number;
  active: boolean;
}

const mockData: JobTitle[] = [
  { id: 'pos-1', code: 'DEV_JUNIOR', name: 'Lập trình viên', level: 'Junior', salaryMin: 15000000, salaryMax: 25000000, active: true },
  { id: 'pos-2', code: 'DEV_SENIOR', name: 'Lập trình viên', level: 'Senior', salaryMin: 30000000, salaryMax: 50000000, active: true },
  { id: 'pos-3', code: 'HR_MGR', name: 'Trưởng phòng Nhân sự', level: 'Manager', salaryMin: 40000000, salaryMax: 60000000, active: true },
  { id: 'pos-4', code: 'TESTER', name: 'Kiểm thử phần mềm', level: 'Fresher', salaryMin: 8000000, salaryMax: 12000000, active: true },
];

const mockLevels = ['Fresher', 'Junior', 'Middle', 'Senior', 'Manager', 'Director'];

// === MOCK CURRENT USER PERMISSIONS ===
// Giả lập quyền của người đang đăng nhập. 
// Đổi mảng này thành rỗng [] để test trạng thái không có quyền xem lương.
const MOCK_USER_PERMISSIONS = ['ORGANIZATION_READ_ALL', 'SALARY_RANGES_READ_ALL']; 


export default function JobTitlesPage() {
  const [data] = useState<JobTitle[]>(mockData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Kiểm tra quyền hiển thị Lương
  const hasSalaryPermission = MOCK_USER_PERMISSIONS.includes('SALARY_RANGES_READ_ALL');

  // Logic Lọc & Tìm kiếm
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchLevel = selectedLevel ? item.level === selectedLevel : true;
      return matchSearch && matchLevel;
    });
  }, [data, searchTerm, selectedLevel]);

  // Logic Phân trang
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  // Helper format Tiền tệ
  const formatCurrency = (value?: number) => {
    if (value == null) return 'N/A';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Danh mục Chức danh</h1>
            <p className="text-sm text-gray-500 mt-1">Quản lý chức danh và dải lương theo cấp bậc</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Thêm chức danh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input 
              type="text" 
              placeholder="Tìm kiếm theo mã, tên chức danh..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-full sm:w-64">
            <select
              value={selectedLevel}
              onChange={(e) => { setSelectedLevel(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Tất cả cấp bậc</option>
              {mockLevels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-6 py-4">Mã chức danh</th>
                  <th className="px-6 py-4">Tên chức danh</th>
                  <th className="px-6 py-4">Cấp bậc</th>
                  
                  {/* CỘT LƯƠNG ĐƯỢC BẢO MẬT BẰNG QUYỀN */}
                  {hasSalaryPermission && (
                    <>
                      <th className="px-6 py-4 text-right">Mức lương Tối thiểu</th>
                      <th className="px-6 py-4 text-right">Mức lương Tối đa</th>
                    </>
                  )}
                  
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {paginatedData.length > 0 ? (
                  paginatedData.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium">{job.code}</td>
                      <td className="px-6 py-4">{job.name}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          {job.level}
                        </span>
                      </td>
                      
                      {/* DỮ LIỆU LƯƠNG ĐƯỢC BẢO MẬT BẰNG QUYỀN */}
                      {hasSalaryPermission && (
                        <>
                          <td className="px-6 py-4 text-right font-medium text-gray-600">{formatCurrency(job.salaryMin)}</td>
                          <td className="px-6 py-4 text-right font-medium text-gray-600">{formatCurrency(job.salaryMax)}</td>
                        </>
                      )}

                      <td className="px-6 py-4 text-center">
                        <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded mr-2" title="Chỉnh sửa">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        <button className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Xóa">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={hasSalaryPermission ? 6 : 4} className="px-6 py-8 text-center text-gray-500">
                      Không tìm thấy dữ liệu phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
              <span className="text-sm text-gray-500">Trang {currentPage} / {totalPages}</span>
              <div className="flex gap-2">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-white bg-transparent"
                >
                  Trước
                </button>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-white bg-transparent"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

