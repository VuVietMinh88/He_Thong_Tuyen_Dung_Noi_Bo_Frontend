import { useState, useEffect } from 'react';
import axios from 'axios';
import DepartmentTreeView, { type Department } from '../../components/Organization/DepartmentTreeView';
import DepartmentModal, { type DepartmentFormValues, type ManagerOption } from '../../components/Organization/DepartmentModal';
import { departmentService, type DepartmentNode } from '../../services/department.service';

export default function DepartmentPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal states
  const [modalType, setModalType] = useState<'add' | 'edit' | 'delete' | 'deactivate' | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

  // State lưu dữ liệu fill vào Form Modal
  const [formInitialData, setFormInitialData] = useState<Partial<DepartmentFormValues> & { id?: string }>({});

  const mapNodeToDepartment = (node: DepartmentNode): Department => ({
    id: node.id,
    name: node.name,
    manager: node.managerFullName || 'Chưa cập nhật',
    status: node.active ? 'active' : 'inactive',
    hasOpenRequests: false, // UI logic, mock for now since backend doesn't provide
    children: node.children ? node.children.map(mapNodeToDepartment) : undefined,
  });

  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      const data = await departmentService.getDepartmentsTree();
      setDepartments(data.map(mapNodeToDepartment));
    } catch (error) {
      console.error("Lỗi khi tải phòng ban:", error);
      alert('Không thể tải dữ liệu phòng ban');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const data = await departmentService.getManagers();
      // Map fullName from service to name for modal
      setManagers(data.map(m => ({ id: m.id, name: m.fullName })));
    } catch (error) {
      console.error("Lỗi khi tải người quản lý:", error);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchManagers();
  }, []);

  const handleAddChild = (parentId: string) => {
    setFormInitialData({ parentId: parentId === 'root' ? '' : parentId }); 
    setModalType('add');
  };

  // Helper tìm node trong cây
  const findNode = (nodes: Department[], id: string): Department | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const findParentId = (nodes: Department[], targetId: string, currentParent: string | null = null): string | null => {
    for (const node of nodes) {
      if (node.id === targetId) return currentParent;
      if (node.children) {
        const found = findParentId(node.children, targetId, node.id);
        if (found) return found;
      }
    }
    return null;
  };

  const handleEdit = (id: string) => {
    const node = findNode(departments, id);
    const parentId = findParentId(departments, id);
    
    if (node) {
      setFormInitialData({ 
        id: id,
        name: node.name, 
        managerId: '', // Ideally we'd map back to ID, but node only has name right now.
        parentId: parentId || '', 
        status: node.status
      });
      setModalType('edit');
    }
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

  const handleFormSubmit = async (data: DepartmentFormValues) => {
    try {
      const payload = {
        code: data.name.toUpperCase().replace(/\s+/g, '_'),
        name: data.name,
        parentId: data.parentId || null,
        managerUserId: data.managerId,
        active: data.status === 'active'
      };

      if (modalType === 'edit' && formInitialData.id) {
        await departmentService.updateDepartment(formInitialData.id, payload);
        alert('Cập nhật phòng ban thành công!');
      } else {
        await departmentService.createDepartment(payload);
        alert('Tạo phòng ban thành công!');
      }
      fetchDepartments();
      closeModal();
    } catch (error) {
      alert('Có lỗi xảy ra khi lưu phòng ban!');
    }
  };

  const handleConfirmAction = async () => {
    if (!selectedDeptId) return;

    try {
      if (modalType === 'delete') {
        await departmentService.deleteDepartment(selectedDeptId);
        alert('Xóa phòng ban thành công!');
      } else if (modalType === 'deactivate') {
        // Find existing data to update active = false
        // ... (This requires finding full info or partial update endpoint, mock for now)
        alert('Đã ngừng áp dụng phòng ban!');
      }
      fetchDepartments();
      closeModal();
    } catch (error) {
      if (axios.isAxiosError(error) && (error.response?.status === 409 || error.response?.status === 400)) {
        alert("Không thể xóa phòng ban đang có yêu cầu tuyển dụng mở. Vui lòng chuyển sang trạng thái Ngừng áp dụng.");
      } else {
        alert('Có lỗi xảy ra khi thực hiện thao tác!');
      }
    }
    closeModal();
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {isLoading ? (
        <div className="flex items-center justify-center p-10">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        </div>
      ) : (
        <DepartmentTreeView 
          data={departments}
          onAddChild={handleAddChild}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDeactivate={handleDeactivate}
        />
      )}

      <DepartmentModal 
        isOpen={modalType === 'add' || modalType === 'edit'}
        mode={modalType === 'add' ? 'add' : 'edit'}
        onClose={closeModal}
        initialData={formInitialData}
        departments={departments}
        managers={managers}
        onSubmit={handleFormSubmit}
      />

      {(modalType === 'delete' || modalType === 'deactivate') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="font-bold text-lg text-gray-800">
                {modalType === 'delete' ? 'Xác nhận Xóa' : 'Xác nhận Ngừng Áp dụng'}
              </h3>
            </div>
            <div className="px-6 py-4">
              {modalType === 'delete' ? (
                <p className="text-gray-600">Bạn có chắc chắn muốn xóa vĩnh viễn phòng ban này?</p>
              ) : (
                <p className="text-gray-600">Phòng ban này đang có tin tuyển dụng mở. Bạn có chắc chắn muốn chuyển sang trạng thái <b>Ngừng Áp dụng</b>?</p>
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
