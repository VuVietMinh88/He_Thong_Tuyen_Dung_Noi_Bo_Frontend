import React, { useState } from 'react';
import DepartmentTreeView, { Department } from '../../components/Organization/DepartmentTreeView';

// === Mock Data Ban Đầu ===
const initialData: Department[] = [
  {
    id: 'dept-1',
    name: 'Khối Công Nghệ',
    manager: 'Nguyễn Văn A',
    status: 'active',
    children: [
      {
        id: 'dept-1-1',
        name: 'Phòng Phát triển phần mềm',
        manager: 'Trần Thị B',
        hasOpenRequests: true, // Không cho phép xóa, chỉ được ngừng áp dụng
        status: 'active',
        children: [
          {
            id: 'dept-1-1-1',
            name: 'Nhóm Frontend',
            manager: 'Lê Văn C',
            status: 'active',
          },
          {
            id: 'dept-1-1-2',
            name: 'Nhóm Backend',
            manager: 'Phạm Thị D',
            status: 'active',
          }
        ]
      },
      {
        id: 'dept-1-2',
        name: 'Phòng QA/QC',
        manager: 'Hoàng Văn E',
        status: 'active',
      }
    ]
  },
  {
    id: 'dept-2',
    name: 'Khối Kinh Doanh',
    manager: 'Đỗ Thị F',
    hasOpenRequests: false,
    status: 'inactive',
  }
];

export default function DepartmentPage() {
  const [departments, setDepartments] = useState<Department[]>(initialData);
  
  // States quản lý Modal
  const [modalType, setModalType] = useState<'add' | 'edit' | 'delete' | 'deactivate' | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

  // States cho Form
  const [formData, setFormData] = useState({ name: '', manager: '' });

  // === Handlers được truyền xuống TreeView ===
  const handleAddChild = (parentId: string) => {
    setSelectedDeptId(parentId);
    setFormData({ name: '', manager: '' });
    setModalType('add');
  };

  const handleEdit = (id: string) => {
    setSelectedDeptId(id);
    // Trong thực tế sẽ gọi API lấy chi tiết, ở đây mock dữ liệu trống
    setFormData({ name: 'Tên phòng ban hiện tại', manager: 'Tên quản lý hiện tại' });
    setModalType('edit');
  };

  const handleDelete = (id: string) => {
    setSelectedDeptId(id);
    setModalType('delete');
  };

  const handleDeactivate = (id: string) => {
    setSelectedDeptId(id);
    setModalType('deactivate');
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedDeptId(null);
  };

  // === Xử lý Submit Modal (Giả lập cập nhật State đệ quy) ===
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalType === 'add') {
      alert(`Đã thêm phòng ban con cho ID: ${selectedDeptId} \n- Tên: ${formData.name}\n- Phụ trách: ${formData.manager}`);
    } else if (modalType === 'edit') {
      alert(`Đã cập nhật phòng ban ID: ${selectedDeptId} \n- Tên mới: ${formData.name}\n- Phụ trách mới: ${formData.manager}`);
    } else if (modalType === 'delete') {
      alert(`Đã xóa vĩnh viễn phòng ban ID: ${selectedDeptId}`);
    } else if (modalType === 'deactivate') {
      alert(`Đã chuyển trạng thái phòng ban ID: ${selectedDeptId} sang "Ngừng áp dụng"`);
    }
    
    // Trong thực tế, sau khi gọi API thành công, ta sẽ fetch lại danh sách (setDepartments)
    closeModal();
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Container TreeView */}
      <DepartmentTreeView 
        data={departments}
        onAddChild={handleAddChild}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDeactivate={handleDeactivate}
      />

      {/* === MODALS === */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            
            {/* Header Modal */}
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">
                {modalType === 'add' && 'Thêm Phòng ban'}
                {modalType === 'edit' && 'Chỉnh sửa Phòng ban'}
                {modalType === 'delete' && 'Xác nhận Xóa'}
                {modalType === 'deactivate' && 'Xác nhận Ngừng áp dụng'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* Body Modal */}
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4">
                {(modalType === 'add' || modalType === 'edit') && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tên phòng ban</label>
                      <input 
                        type="text" 
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Nhập tên phòng ban..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Người phụ trách</label>
                      <input 
                        type="text" 
                        value={formData.manager}
                        onChange={(e) => setFormData({...formData, manager: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Nhập tên người phụ trách..."
                      />
                    </div>
                  </div>
                )}

                {modalType === 'delete' && (
                  <p className="text-gray-600">Bạn có chắc chắn muốn xóa vĩnh viễn phòng ban này? Thao tác này không thể hoàn tác.</p>
                )}

                {modalType === 'deactivate' && (
                  <p className="text-gray-600">Phòng ban này đang có tin tuyển dụng mở. Bạn có chắc chắn muốn chuyển sang trạng thái <b>Ngừng áp dụng</b>?</p>
                )}
              </div>

              {/* Footer Modal */}
              <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-xl border-t">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${
                    modalType === 'delete' || modalType === 'deactivate' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {modalType === 'add' || modalType === 'edit' ? 'Lưu lại' : 'Xác nhận'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}

