import React, { useState } from 'react';
import DepartmentTreeView, { type Department } from '../../components/Organization/DepartmentTreeView';
import DepartmentModal, { type DepartmentFormValues, type ManagerOption } from '../../components/Organization/DepartmentModal';

// === Mock Data Ban Đầu ===
const initialData: Department[] = [
  {
    id: 'dept-1',
    name: 'Khối Công Nghệ',
    manager: 'mgr-1', // Cần lưu ID thay vì tên cho Modal Select
    status: 'active',
    children: [
      {
        id: 'dept-1-1',
        name: 'Phòng Phát triển phần mềm',
        manager: 'mgr-2',
        hasOpenRequests: true, 
        status: 'active',
        children: [
          {
            id: 'dept-1-1-1',
            name: 'Nhóm Frontend',
            manager: 'mgr-3',
            status: 'active',
          }
        ]
      }
    ]
  }
];

const mockManagers: ManagerOption[] = [
  { id: 'mgr-1', name: 'Nguyễn Văn A' },
  { id: 'mgr-2', name: 'Trần Thị B' },
  { id: 'mgr-3', name: 'Lê Văn C' },
  { id: 'mgr-4', name: 'Phạm Thị D' },
];

export default function DepartmentPage() {
  const [departments, setDepartments] = useState<Department[]>(initialData);
  
  // Modal states
  const [modalType, setModalType] = useState<'add' | 'edit' | 'delete' | 'deactivate' | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

  // State lưu dữ liệu fill vào Form Modal khi Sửa/Thêm con
  const [formInitialData, setFormInitialData] = useState<Partial<DepartmentFormValues> & { id?: string }>({});

  const handleAddChild = (parentId: string) => {
    setFormInitialData({ parentId: parentId === 'root' ? '' : parentId }); // Mặc định gán parentId nếu thêm từ 1 node
    setModalType('add');
  };

  const handleEdit = (id: string) => {
    // Tìm node trong thực tế qua API, mock:
    setFormInitialData({ 
      id: id,
      name: 'Tên phòng ban hiện tại (Mock)', 
      managerId: 'mgr-1',
      parentId: '', // Phải tìm ra parentId thực tế
      status: 'active'
    });
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
    setFormInitialData({});
  };

  // Xử lý Submit từ Form (Thêm/Sửa)
  const handleFormSubmit = async (data: DepartmentFormValues) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        alert(`Lưu thành công! \n${JSON.stringify(data, null, 2)}`);
        resolve();
      }, 1000);
    });
  };

  // Xử lý Submit Xóa/Ngừng áp dụng
  const handleConfirmAction = () => {
    if (modalType === 'delete') {
      alert(`Đã xóa vĩnh viễn phòng ban ID: ${selectedDeptId}`);
    } else if (modalType === 'deactivate') {
      alert(`Đã chuyển trạng thái phòng ban ID: ${selectedDeptId} sang "Ngừng áp dụng"`);
    }
    closeModal();
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <DepartmentTreeView 
        data={departments}
        onAddChild={handleAddChild}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDeactivate={handleDeactivate}
      />

      {/* Component Form Thêm/Sửa Phòng Ban đã tách riêng */}
      <DepartmentModal 
        isOpen={modalType === 'add' || modalType === 'edit'}
        mode={modalType === 'add' ? 'add' : 'edit'}
        onClose={closeModal}
        initialData={formInitialData}
        departments={departments}
        managers={mockManagers}
        onSubmit={handleFormSubmit}
      />

      {/* Modal Cảnh báo Xóa/Ngừng áp dụng */}
      {(modalType === 'delete' || modalType === 'deactivate') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="font-bold text-lg text-gray-800">
                {modalType === 'delete' ? 'Xác nhận Xóa' : 'Xác nhận Ngừng áp dụng'}
              </h3>
            </div>
            <div className="px-6 py-4">
              {modalType === 'delete' ? (
                <p className="text-gray-600">Bạn có chắc chắn muốn xóa vĩnh viễn phòng ban này?</p>
              ) : (
                <p className="text-gray-600">Phòng ban này đang có tin tuyển dụng mở. Bạn có chắc chắn muốn chuyển sang trạng thái <b>Ngừng áp dụng</b>?</p>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t">
              <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-700 bg-white border rounded-lg">Hủy</button>
              <button onClick={handleConfirmAction} className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
