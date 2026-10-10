import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Department } from './DepartmentTreeView';

// === Types & Schemas ===
export interface ManagerOption {
  id: string;
  name: string;
}

const departmentSchema = z.object({
  name: z.string().min(1, 'Tên phòng ban là bắt buộc'),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  managerId: z.string().min(1, 'Vui lòng chọn người phụ trách'),
  status: z.enum(['active', 'inactive']).optional(),
});

export type DepartmentFormValues = z.infer<typeof departmentSchema>;

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  initialData?: Partial<DepartmentFormValues> & { id?: string }; 
  departments: Department[]; // Cây phòng ban hiện tại
  managers: ManagerOption[]; // Danh sách nhân viên (mock)
  onSubmit: (data: DepartmentFormValues) => Promise<void>;
}

// === Helpers ===
// Hàm làm phẳng cây để tạo dropdown (VD: Khối Công Nghệ > Phòng Phát triển)
// Kèm theo logic tìm tất cả ID con cháu (descendants) để chặn circular reference
const flattenDepartments = (
  nodes: Department[], 
  prefix = '', 
  disabledIds = new Set<string>()
): { id: string; label: string; disabled: boolean }[] => {
  let result: { id: string; label: string; disabled: boolean }[] = [];
  
  nodes.forEach(node => {
    const label = prefix ? `${prefix} > ${node.name}` : node.name;
    const isSelfOrDescendant = disabledIds.has(node.id);
    
    result.push({ id: node.id, label, disabled: isSelfOrDescendant });
    
    if (node.children && node.children.length > 0) {
      // Nếu node hiện tại bị disable, tất cả con của nó cũng phải bị disable
      const nextDisabledIds = new Set(disabledIds);
      if (isSelfOrDescendant) {
        node.children.forEach(child => nextDisabledIds.add(child.id));
      }
      
      result = result.concat(flattenDepartments(node.children, label, nextDisabledIds));
    }
  });
  
  return result;
};

// Hàm phụ để lấy danh sách ID của chính node đó và tất cả con cháu của nó
const getDescendantIds = (nodes: Department[], targetId: string, found = false): Set<string> => {
  let descendants = new Set<string>();
  
  for (const node of nodes) {
    if (node.id === targetId || found) {
      descendants.add(node.id);
      if (node.children) {
        node.children.forEach(child => {
          getDescendantIds([child], child.id, true).forEach(id => descendants.add(id));
        });
      }
    } else if (node.children) {
      const childDescendants = getDescendantIds(node.children, targetId);
      childDescendants.forEach(id => descendants.add(id));
    }
  }
  return descendants;
};

// === Component ===
const DepartmentModal: React.FC<DepartmentModalProps> = ({
  isOpen,
  onClose,
  mode,
  initialData,
  departments,
  managers,
  onSubmit,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: '',
      description: '',
      parentId: '',
      managerId: '',
      status: 'active',
    },
  });

  // Reset form khi mở modal hoặc thay đổi initialData
  useEffect(() => {
    if (isOpen) {
      reset({
        name: initialData?.name || '',
        description: initialData?.description || '',
        parentId: initialData?.parentId || '',
        managerId: initialData?.managerId || '',
        status: initialData?.status || 'active',
      });
    }
  }, [isOpen, initialData, reset]);

  // Xử lý danh sách Parent Department (Tránh Circular Reference)
  const parentOptions = useMemo(() => {
    // Nếu là mode edit, ta phải tìm ID của node hiện tại và toàn bộ con cháu của nó để disable
    const disabledIds = mode === 'edit' && initialData?.id 
      ? getDescendantIds(departments, initialData.id) 
      : new Set<string>();
      
    return flattenDepartments(departments, '', disabledIds);
  }, [departments, mode, initialData]);

  const onFormSubmit = async (data: DepartmentFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error("Lỗi khi lưu phòng ban:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800">
            {mode === 'add' ? 'Thêm mới Phòng ban' : 'Chỉnh sửa Phòng ban'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Body Form */}
        <div className="px-6 py-4 overflow-y-auto">
          <form id="department-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
            
            {/* Tên phòng ban */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên phòng ban <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name')}
                type="text"
                placeholder="Nhập tên phòng ban..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none ${errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'}`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
            </div>

            {/* Phòng ban cha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phòng ban cha (Cấp trên)</label>
              <select
                {...register('parentId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 focus:outline-none bg-white"
              >
                <option value="">-- Không có (Phòng ban cấp cao nhất) --</option>
                {parentOptions.map((opt) => (
                  <option key={opt.id} value={opt.id} disabled={opt.disabled}>
                    {opt.label} {opt.disabled ? '(Không hợp lệ)' : ''}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">Bỏ trống nếu đây là phòng ban/khối cấp cao nhất (Root).</p>
            </div>

            {/* Người phụ trách */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Người phụ trách <span className="text-red-500">*</span>
              </label>
              <select
                {...register('managerId')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none bg-white ${errors.managerId ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'}`}
              >
                <option value="">-- Chọn người phụ trách --</option>
                {managers.map((mgr) => (
                  <option key={mgr.id} value={mgr.id}>{mgr.name}</option>
                ))}
              </select>
              {errors.managerId && <p className="mt-1 text-sm text-red-500">{errors.managerId.message}</p>}
            </div>

            {/* Mô tả */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả thêm</label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Nhập mô tả về chức năng của phòng ban..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 focus:outline-none"
              ></textarea>
            </div>

            {/* Trạng thái (Chỉ hiện khi Edit) */}
            {mode === 'edit' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" {...register('status')} value="active" className="text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700">Đang hoạt động</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" {...register('status')} value="inactive" className="text-red-600 focus:ring-red-500" />
                    <span className="text-sm text-gray-700">Ngừng áp dụng</span>
                  </label>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            form="department-form"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-2"
          >
            {isSubmitting && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            )}
            {mode === 'add' ? 'Tạo phòng ban' : 'Lưu thay đổi'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default DepartmentModal;

