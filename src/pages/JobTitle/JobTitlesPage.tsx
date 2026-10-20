import { useState, useEffect } from 'react';
import { jobTitleService, type JobTitleNode } from '../../services/jobTitle.service';
import usePermission from '../../hooks/usePermission';

const MOCK_LEVELS = ['Fresher', 'Junior', 'Middle', 'Senior', 'Manager', 'Director'];

export default function JobTitlesPage() {
  const [data, setData] = useState<JobTitleNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Trạng thái Tìm kiếm & Phân trang
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5; // Cố định theo API hoặc UI

  // 🔴 TÍCH HỢP QUYỀN (Role-based Authorization) 🔴
  const { hasPermission } = usePermission();
  // Theo tài liệu Backend, quyền xem mức lương là SALARY_RANGES_READ_ALL (Chỉ Trưởng phòng Nhân sự có).
  const hasSalaryPermission = hasPermission('SALARY_RANGES_READ_ALL');

  // Gọi API lấy dữ liệu
  const fetchJobTitles = async () => {
    setIsLoading(true);
    try {
      // Vì backend không hỗ trợ lọc trực tiếp theo 'level' trong query params (chỉ hỗ trợ 'q' và 'active'), 
      // ta truyền từ khóa tìm kiếm (q), lấy danh sách và xử lý thêm trên Frontend nếu cần.
      const response = await jobTitleService.getJobTitles({
        q: searchTerm || undefined,
        page: currentPage - 1, // Backend page index bắt đầu từ 0
        size: itemsPerPage
      });
      
      // Nếu API chưa hỗ trợ lọc theo cấp bậc, ta đành lọc dữ liệu tĩnh trên số items trả về
      // (Khuyến nghị: Thêm param 'level' vào Backend sau này).
      let filteredItems = response.items;
      if (selectedLevel) {
        filteredItems = filteredItems.filter(item => item.level === selectedLevel);
      }

      setData(filteredItems);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error('Lỗi khi tải danh sách chức danh', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Delay (Debounce) nhẹ khi gõ tìm kiếm để tránh gọi API liên tục
    const delayDebounceFn = setTimeout(() => {
      fetchJobTitles();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, currentPage]); 

  // Lọc offline bổ sung cho Dropdown Level (do Backend chưa hỗ trợ query ?level=)
  useEffect(() => {
    fetchJobTitles();
  }, [selectedLevel]);

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
          <button 
             onClick={() => alert('Mở Form thêm mới...')}
             className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
          >
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
              {MOCK_LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-6 py-4 whitespace-nowrap">Mã chức danh</th>
                  <th className="px-6 py-4 whitespace-nowrap">Tên chức danh</th>
                  <th className="px-6 py-4 whitespace-nowrap">Cấp bậc</th>
                  
                  {/* 🛡️ BẢO MẬT: CHỈ RENDER NẾU CÓ QUYỀN 🛡️ */}
                  {hasSalaryPermission && (
                    <>
                      <th className="px-6 py-4 text-right whitespace-nowrap">Mức lương Tối thiểu</th>
                      <th className="px-6 py-4 text-right whitespace-nowrap">Mức lương Tối đa</th>
                    </>
                  )}
                  
                  <th className="px-6 py-4 text-center whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={hasSalaryPermission ? 6 : 4} className="px-6 py-10 text-center">
                       <svg className="animate-spin h-6 w-6 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    </td>
                  </tr>
                ) : data.length > 0 ? (
                  data.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium">{job.code}</td>
                      <td className="px-6 py-4">{job.name}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          {job.level}
                        </span>
                      </td>
                      
                      {/* 🛡️ BẢO MẬT: CHỈ RENDER NẾU CÓ QUYỀN 🛡️ */}
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
                        <button onClick={async () => {
                          if (confirm('Xác nhận ngừng áp dụng chức danh này?')) {
                             try {
                               // Vì không có DELETE API, ta mô phỏng bằng PUT (hoặc gọi deleteJobTitle)
                               await jobTitleService.updateJobTitle(job.id, { ...job, active: false } as any);
                               alert('Đã ngừng áp dụng thành công!');
                               fetchJobTitles();
                             } catch(e) { alert('Lỗi hệ thống!'); }
                          }
                        }} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Ngừng áp dụng (Xóa)">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={hasSalaryPermission ? 6 : 4} className="px-6 py-8 text-center text-gray-500">
                      Không tìm thấy chức danh nào phù hợp.
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
                  disabled={currentPage === 1 || isLoading}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-white bg-transparent transition-colors"
                >
                  Trước
                </button>
                <button 
                  disabled={currentPage === totalPages || isLoading}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-white bg-transparent transition-colors"
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
