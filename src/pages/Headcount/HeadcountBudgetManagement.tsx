import { useState, useMemo } from 'react';

// --- Types ---
export interface HeadcountBudget {
  id: string;
  departmentId: string;
  departmentName: string;
  totalHeadcount: number;
  usedHeadcount: number;
  totalBudget: number; // in VND
}

// --- Helper Functions ---
// Export helper function này để có thể import và tái sử dụng ở luồng Tạo Yêu Cầu Tuyển Dụng
export const checkHeadcountAvailability = (
  departmentId: string,
  requestedHeadcount: number,
  budgets: HeadcountBudget[]
): { isAvailable: boolean; remaining: number } => {
  const budget = budgets.find((b) => b.departmentId === departmentId);
  if (!budget) return { isAvailable: false, remaining: 0 };
  
  const remaining = budget.totalHeadcount - budget.usedHeadcount;
  return {
    isAvailable: remaining >= requestedHeadcount,
    remaining,
  };
};

export const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// --- Mock Data ---
const MOCK_DATA: HeadcountBudget[] = [
  { id: '1', departmentId: 'DEP01', departmentName: 'Phòng Kỹ thuật (IT)', totalHeadcount: 20, usedHeadcount: 18, totalBudget: 500000000 },
  { id: '2', departmentId: 'DEP02', departmentName: 'Phòng Nhân sự (HR)', totalHeadcount: 5, usedHeadcount: 2, totalBudget: 100000000 },
  { id: '3', departmentId: 'DEP03', departmentName: 'Phòng Kinh doanh (Sales)', totalHeadcount: 15, usedHeadcount: 15, totalBudget: 300000000 },
];

export default function HeadcountBudgetManagement() {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [budgets, setBudgets] = useState<HeadcountBudget[]>(MOCK_DATA);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // State lưu trữ dữ liệu form đang edit
  const [editFormData, setEditFormData] = useState<{ totalHeadcount: number; totalBudget: number }>({ totalHeadcount: 0, totalBudget: 0 });

  // Simulate Modal State (Cảnh báo vượt chỉ tiêu)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [simulateReq, setSimulateReq] = useState({ departmentId: 'DEP01', requestedHeadcount: 1, overrideReason: '' });

  // --- Handlers ---
  const handleEdit = (budget: HeadcountBudget) => {
    setEditingId(budget.id);
    setEditFormData({ totalHeadcount: budget.totalHeadcount, totalBudget: budget.totalBudget });
  };

  const handleSave = (id: string) => {
    setBudgets((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, totalHeadcount: editFormData.totalHeadcount, totalBudget: editFormData.totalBudget } : b
      )
    );
    setEditingId(null);
  };

  const getRemainingColor = (total: number, used: number) => {
    const remaining = total - used;
    if (total === 0) return 'text-red-700 bg-red-100'; // Đỏ
    const ratio = remaining / total;
    if (ratio >= 0.5) return 'text-green-700 bg-green-100'; // Xanh lá
    if (ratio >= 0.2) return 'text-yellow-700 bg-yellow-100'; // Vàng
    return 'text-red-700 bg-red-100'; // Đỏ (sắp hết hoặc đã hết)
  };

  // Tính toán validation cho Simulator Modal
  const availability = useMemo(() => {
    return checkHeadcountAvailability(simulateReq.departmentId, simulateReq.requestedHeadcount, budgets);
  }, [simulateReq.departmentId, simulateReq.requestedHeadcount, budgets]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md p-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Định biên & Ngân sách Nhân sự</h1>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
            >
              Mô phỏng Yêu cầu Tuyển dụng
            </button>
            <div className="flex items-center gap-2">
              <label className="font-semibold text-gray-700">Năm ngân sách:</label>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 font-medium bg-white"
              >
                {[2025, 2026, 2027, 2028].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Budget Table Section */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200 text-sm uppercase text-gray-600">
                <th className="p-4 font-semibold">Phòng ban</th>
                <th className="p-4 font-semibold text-center">Chỉ tiêu (Tổng)</th>
                <th className="p-4 font-semibold text-center">Đã dùng</th>
                <th className="p-4 font-semibold text-center">Còn lại</th>
                <th className="p-4 font-semibold text-right">Tổng Ngân sách Lương</th>
                <th className="p-4 font-semibold text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map((budget) => {
                const isEditing = editingId === budget.id;
                const remaining = budget.totalHeadcount - budget.usedHeadcount;
                
                return (
                  <tr key={budget.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="p-4 font-medium text-gray-800">{budget.departmentName}</td>
                    
                    <td className="p-4 text-center">
                      {isEditing ? (
                        <input 
                          type="number" 
                          value={editFormData.totalHeadcount}
                          onChange={(e) => setEditFormData({...editFormData, totalHeadcount: Number(e.target.value)})}
                          className="w-20 border border-gray-300 rounded px-2 py-1 text-center focus:ring-blue-500 focus:border-blue-500"
                          min={budget.usedHeadcount}
                        />
                      ) : (
                        <span className="font-semibold text-gray-700">{budget.totalHeadcount}</span>
                      )}
                    </td>
                    
                    <td className="p-4 text-center text-gray-600">{budget.usedHeadcount}</td>
                    
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRemainingColor(budget.totalHeadcount, budget.usedHeadcount)}`}>
                        {remaining}
                      </span>
                    </td>
                    
                    <td className="p-4 text-right">
                      {isEditing ? (
                        <input 
                          type="number" 
                          value={editFormData.totalBudget}
                          onChange={(e) => setEditFormData({...editFormData, totalBudget: Number(e.target.value)})}
                          className="w-36 border border-gray-300 rounded px-2 py-1 text-right focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <span className="text-gray-700 font-medium">{formatVND(budget.totalBudget)}</span>
                      )}
                    </td>
                    
                    <td className="p-4 text-center">
                      {isEditing ? (
                        <div className="flex gap-3 justify-center">
                          <button onClick={() => handleSave(budget.id)} className="text-green-600 hover:text-green-800 font-medium text-sm">Lưu</button>
                          <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700 font-medium text-sm">Hủy</button>
                        </div>
                      ) : (
                        <button onClick={() => handleEdit(budget)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">Sửa</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Simulate Over-budget Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all">
              <h2 className="text-xl font-bold mb-5 text-gray-800 border-b pb-3">Tạo Yêu Cầu Tuyển Dụng mới</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Chọn Phòng ban</label>
                  <select 
                    value={simulateReq.departmentId}
                    onChange={(e) => setSimulateReq({...simulateReq, departmentId: e.target.value, overrideReason: ''})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {budgets.map(b => <option key={b.id} value={b.departmentId}>{b.departmentName}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Số lượng cần tuyển</label>
                  <input 
                    type="number" 
                    value={simulateReq.requestedHeadcount}
                    onChange={(e) => setSimulateReq({...simulateReq, requestedHeadcount: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    min={1}
                  />
                </div>

                {/* Validation Warning UI */}
                {!availability.isAvailable && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm mt-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-bold text-red-800">Cảnh báo: Vượt quá định biên!</h3>
                        <p className="text-sm text-red-700 mt-1">
                          Số headcount còn lại của phòng ban này chỉ là <strong className="text-red-900">{availability.remaining}</strong>.
                        </p>
                      </div>
                    </div>
                    
                    {/* Override Reason Input */}
                    <div className="mt-4 pt-4 border-t border-red-200">
                      <label className="block text-sm font-bold text-red-800 mb-1">Lý do ghi đè (Bắt buộc cho Trưởng phòng HR)</label>
                      <textarea 
                        className="w-full border border-red-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500 shadow-sm"
                        rows={2}
                        placeholder="Nhập lý do phê duyệt vượt định biên (VD: Thay thế nhân sự nghỉ thai sản)..."
                        value={simulateReq.overrideReason}
                        onChange={(e) => setSimulateReq({...simulateReq, overrideReason: e.target.value})}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium rounded-lg transition"
                >
                  Hủy
                </button>
                <button 
                  className={`px-4 py-2 text-white font-medium rounded-lg transition shadow-sm ${
                    !availability.isAvailable && !simulateReq.overrideReason 
                      ? 'bg-blue-300 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`} 
                  disabled={!availability.isAvailable && !simulateReq.overrideReason}
                >
                  Xác nhận Tạo Yêu Cầu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

