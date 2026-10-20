import React, { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, Plus, ArrowUp, ArrowDown, AlertCircle, CheckCircle2, X } from 'lucide-react';
import {
  masterDataService,
  generateCatalogCode,
  type MasterDataItem,
  type MasterDataType,
} from '../../services/masterDataService';

// --- TAB CONFIGURATION ---
const TABS: { id: MasterDataType; label: string }[] = [
  { id: 'CANDIDATE_SOURCE', label: 'Nguồn ứng viên' },
  { id: 'REJECTION_REASON', label: 'Lý do loại hồ sơ' },
  { id: 'WORK_LOCATION', label: 'Địa điểm làm việc' },
  { id: 'EMPLOYMENT_TYPE', label: 'Hình thức làm việc' },
];

// --- GENERIC TABLE COMPONENT ---
interface ReusableTableProps {
  data: MasterDataItem[];
  isLoading: boolean;
  onEdit: (item: MasterDataItem) => void;
  onDelete: (id: string, name: string) => void;
  onToggleStatus: (item: MasterDataItem) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

const ReusableTable: React.FC<ReusableTableProps> = ({
  data,
  isLoading,
  onEdit,
  onDelete,
  onToggleStatus,
  onMoveUp,
  onMoveDown,
}) => {
  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center space-x-2 rounded-lg border border-gray-200 bg-white text-gray-500">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <span className="text-sm font-medium">Đang tải danh mục...</span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tên giá trị
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Mã danh mục
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Thứ tự
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Trạng thái
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hành động
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                Chưa có dữ liệu danh mục nào. Hãy bấm &quot;Thêm mới&quot; để khai báo giá trị.
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  {item.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-500">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-700">
                    {item.code}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="font-semibold text-gray-700">{item.order + 1}</span>
                    <div className="flex flex-col space-y-0.5">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => onMoveUp(index)}
                        className="text-gray-400 hover:text-blue-600 disabled:opacity-20 transition-colors"
                        title="Di chuyển lên trên"
                        aria-label="Di chuyển lên"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={index === data.length - 1}
                        onClick={() => onMoveDown(index)}
                        className="text-gray-400 hover:text-blue-600 disabled:opacity-20 transition-colors"
                        title="Di chuyển xuống dưới"
                        aria-label="Di chuyển xuống"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    type="button"
                    onClick={() => onToggleStatus(item)}
                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full transition-colors cursor-pointer ${
                      item.isActive
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                    title="Bấm để chuyển đổi trạng thái Active / Inactive"
                  >
                    {item.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <div className="flex items-center justify-center space-x-3">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="Chỉnh sửa"
                      aria-label="Chỉnh sửa danh mục"
                    >
                      <Pencil size={18} />
                    </button>

                    {item.isReferenced ? (
                      <div className="relative group flex items-center">
                        <button
                          type="button"
                          disabled
                          className="text-gray-300 cursor-not-allowed"
                          aria-label="Không thể xóa do đang tham chiếu"
                        >
                          <Trash2 size={18} />
                        </button>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-52 p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg z-20 text-center">
                          Dữ liệu đang được sử dụng trong hệ thống, không thể xóa. Bạn chỉ có thể đổi trạng thái sang Inactive.
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onDelete(item.id, item.name)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Xóa danh mục"
                        aria-label="Xóa danh mục"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

// --- MAIN MANAGEMENT COMPONENT ---
export default function MasterDataManagement() {
  const [activeTab, setActiveTab] = useState<MasterDataType>('CANDIDATE_SOURCE');
  const [items, setItems] = useState<MasterDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Thông báo lỗi và thành công
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [referencedItemId, setReferencedItemId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    order: 1,
    isActive: true,
  });

  // Tải danh mục từ API theo activeTab (AC1)
  const fetchCategoryData = useCallback(async (type: MasterDataType) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await masterDataService.getMasterData(type);
      setItems(data);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Không thể tải danh sách danh mục.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategoryData(activeTab);
  }, [activeTab, fetchCategoryData]);

  // Tự động ẩn thông báo thành công sau 4s
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => {
      setSuccessMessage('');
    }, 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  // Form Handlers
  const handleOpenModal = (item?: MasterDataItem) => {
    setErrorMessage('');
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        code: item.code,
        description: item.description,
        order: item.order + 1,
        isActive: item.isActive,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        order: items.length + 1,
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // Tự động tạo gợi ý code khi nhập name (chỉ khi tạo mới hoặc chưa nhập code)
  const handleNameChange = (val: string) => {
    setFormData((prev) => {
      const shouldUpdateCode = !editingItem;
      return {
        ...prev,
        name: val,
        code: shouldUpdateCode ? generateCatalogCode(val) : prev.code,
      };
    });
  };

  // Lưu danh mục (Tạo mới hoặc Sửa) qua masterDataService (AC1)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setErrorMessage('Tên giá trị danh mục không được để trống.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      await masterDataService.saveMasterData(activeTab, {
        id: editingItem?.id ?? null,
        code: formData.code.trim() || generateCatalogCode(trimmedName),
        name: trimmedName,
        description: formData.description.trim(),
        isActive: formData.isActive,
      });

      setSuccessMessage(
        editingItem ? 'Cập nhật danh mục thành công.' : 'Thêm mới danh mục thành công.',
      );
      handleCloseModal();
      void fetchCategoryData(activeTab);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Không thể lưu mục danh mục.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Xóa mục danh mục - Bắt mã lỗi khi đang bị tham chiếu (AC1 & AC2)
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mục "${name}" khỏi danh mục?`)) {
      return;
    }

    setErrorMessage('');
    setReferencedItemId(null);

    try {
      await masterDataService.deleteMasterData(activeTab, id);
      setSuccessMessage(`Đã xóa mục "${name}" thành công.`);
      void fetchCategoryData(activeTab);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể xóa giá trị danh mục.';
      setErrorMessage(msg);

      // Nếu lỗi do dữ liệu đang được tham chiếu -> Đánh dấu mục đó bị tham chiếu
      if (
        msg.includes('sử dụng') ||
        msg.includes('tham chiếu') ||
        msg.includes('IN_USE')
      ) {
        setReferencedItemId(id);
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, isReferenced: true } : item)),
        );
      }
    }
  };

  // Chuyển đổi trạng thái Active / Inactive (AC1 & AC2)
  const handleToggleStatus = async (item: MasterDataItem) => {
    setErrorMessage('');
    try {
      await masterDataService.saveMasterData(activeTab, {
        id: item.id,
        code: item.code,
        name: item.name,
        isActive: !item.isActive,
      });
      setSuccessMessage(
        `Đã chuyển trạng thái mục "${item.name}" sang ${!item.isActive ? 'Active' : 'Inactive'}.`,
      );
      void fetchCategoryData(activeTab);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Không thể cập nhật trạng thái mục.',
      );
    }
  };

  // Sắp xếp thứ tự hiển thị (Reorder) qua API PUT /order (AC2)
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    // Hoán đổi vị trí trong mảng
    const reorderedList = [...items];
    const [movedItem] = reorderedList.splice(index, 1);
    reorderedList.splice(targetIndex, 0, movedItem);

    // Cập nhật optimistic UI ngay lập tức
    const updatedWithOrder = reorderedList.map((item, idx) => ({
      ...item,
      order: idx,
    }));
    setItems(updatedWithOrder);
    setErrorMessage('');

    try {
      // Gửi danh sách ID toàn bộ giá trị theo thứ tự mới tới Backend
      const itemIds = updatedWithOrder.map((item) => item.id);
      const savedItems = await masterDataService.reorderMasterData(activeTab, itemIds);
      setItems(savedItems);
      setSuccessMessage('Đã lưu thứ tự hiển thị mới thành công.');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Không thể lưu thứ tự hiển thị danh mục.',
      );
      // Rollback lại dữ liệu nếu API thất bại
      void fetchCategoryData(activeTab);
    }
  };

  // Nhanh chóng chuyển mục bị tham chiếu sang Inactive
  const handleDeactivateReferenced = async () => {
    if (!referencedItemId) return;
    const target = items.find((x) => x.id === referencedItemId);
    if (target) {
      await handleToggleStatus(target);
      setReferencedItemId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Danh mục dùng chung</h1>
          <p className="text-gray-500 text-sm mt-1">
            Thiết lập các danh mục cốt lõi cho hệ thống tuyển dụng (Nguồn ứng viên, Lý do loại, Địa điểm, Hình thức).
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-xs cursor-pointer"
        >
          <Plus size={18} className="mr-2" />
          Thêm mới
        </button>
      </div>

      {/* Thông báo lỗi khi bị chặn xóa do tham chiếu hoặc lỗi hệ thống (AC2) */}
      {errorMessage && (
        <div
          className="flex items-start justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 shadow-xs"
          role="alert"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">{errorMessage}</p>
              {referencedItemId && (
                <button
                  type="button"
                  onClick={() => void handleDeactivateReferenced()}
                  className="mt-1 inline-flex items-center rounded-md bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-900 hover:bg-red-200 transition-colors cursor-pointer"
                >
                  Chuyển mục này sang Inactive ngay
                </button>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-red-400 hover:text-red-600 transition-colors"
            aria-label="Đóng thông báo"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Thông báo thành công */}
      {successMessage && (
        <div
          className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 p-3 text-xs text-green-800 shadow-xs"
          role="status"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="text-green-500 hover:text-green-700 transition-colors"
            aria-label="Đóng thông báo"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer
                ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-lg shadow-xs">
        <ReusableTable
          data={items}
          isLoading={isLoading}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
          onToggleStatus={(item) => void handleToggleStatus(item)}
          onMoveUp={(idx) => void handleMove(idx, 'up')}
          onMoveDown={(idx) => void handleMove(idx, 'down')}
        />
      </div>

      {/* Modal Form Thêm/Sửa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs transition-opacity"
              aria-hidden="true"
              onClick={handleCloseModal}
            />

            {/* Modal Panel */}
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-6 pt-6 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    {editingItem ? 'Cập nhật danh mục' : 'Thêm mới danh mục'}
                  </h3>

                  <div className="space-y-4">
                    {/* Tên giá trị */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Tên giá trị <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="VD: LinkedIn, Nhân viên giới thiệu, Hà Nội..."
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                      />
                    </div>

                    {/* Mã code */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Mã danh mục (Code) <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[10px] text-gray-400">Tối đa 50 ký tự</span>
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={50}
                        placeholder="VD: LINKEDIN, REFERRAL, HA_NOI..."
                        className="w-full px-3 py-2 text-xs font-mono uppercase border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        value={formData.code}
                        onChange={(e) =>
                          setFormData({ ...formData, code: e.target.value.toUpperCase() })
                        }
                      />
                    </div>

                    {/* Mô tả */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Mô tả chi tiết
                      </label>
                      <textarea
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                        placeholder="Mô tả ngắn gọn về mục danh mục này (tùy chọn)..."
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                      />
                    </div>

                    {/* Checkbox Trạng thái Active */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        id="master-data-active"
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({ ...formData, isActive: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor="master-data-active"
                        className="text-xs font-medium text-gray-700 cursor-pointer select-none"
                      >
                        Đang áp dụng (Active)
                      </label>
                    </div>
                  </div>
                </div>

                {/* Footer Modal */}
                <div className="bg-gray-50 px-6 py-3.5 sm:flex sm:flex-row-reverse rounded-b-2xl gap-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-xs px-4 py-2 bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 focus:outline-none sm:w-auto disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? 'Đang lưu...' : 'Lưu lại'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={isSaving}
                    className="mt-2 sm:mt-0 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-xs px-4 py-2 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none sm:w-auto cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
